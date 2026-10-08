#include <gtest/gtest.h>
#include "ipc/ipc.h"
#include "script/matcher.h"
#include <nlohmann/json.hpp>

using namespace teleprompter;

namespace {
std::string handle_script_match(IpcRouter& router, const std::string& payload) {
    return router.Dispatch("script:match", payload);
}
} // namespace

TEST(Ipc, RegistersAndDispatches) {
    IpcRouter router;
    Matcher matcher({"hello world"});
    router.Register("script:match", [&](const std::string& payload) {
        auto json = nlohmann::json::parse(payload);
        return MakeReply("script:match", matcher.Match(json["transcript"].get<std::string>()));
    });

    EXPECT_TRUE(router.Has("script:match"));
    EXPECT_FALSE(router.Has("unknown:type"));

    const std::string reply = handle_script_match(router, R"({"type":"script:match","transcript":"hello world"})");
    auto json = nlohmann::json::parse(reply);
    EXPECT_TRUE(json["onScript"].get<bool>());
    EXPECT_EQ(json["lineIndex"].get<int>(), 0);
}

TEST(Ipc, FloodOfMessagesIsNotLost) {
    IpcRouter router;
    int received = 0;
    router.Register("speech:transcript", [&](const std::string&) {
        ++received;
        return "";
    });
    for (int i = 0; i < 100; ++i) {
        router.Dispatch(R"({"type":"speech:transcript","text":"flood"})");
    }
    EXPECT_EQ(received, 100);
}

TEST(Ipc, InvalidJsonIsIgnored) {
    IpcRouter router;
    EXPECT_EQ(router.Dispatch("not json at all"), "");
    EXPECT_EQ(router.Dispatch(R"({"noType":true})"), "");
}

TEST(Ipc, MakeEventWrapsPayload) {
    const std::string ev = MakeEvent("speech:transcript", R"({"text":"hi","isFinal":true})");
    auto json = nlohmann::json::parse(ev);
    EXPECT_EQ(json["type"].get<std::string>(), "speech:transcript");
    EXPECT_EQ(json["text"].get<std::string>(), "hi");
    EXPECT_TRUE(json["isFinal"].get<bool>());
}
