#ifdef _WIN32

#include "ipc/ipc.h"
#include "script/matcher.h"
#include "settings.h"
#include "speech/model.h"
#include "speech/recognizer.h"
#include "webview.h"
#include "window.h"

#include <nlohmann/json.hpp>

#include <memory>

#ifndef TELEPROMPTER_FRONTEND_URL
#ifdef NDEBUG
#define TELEPROMPTER_FRONTEND_URL "http://localhost:5173"
#else
#define TELEPROMPTER_FRONTEND_URL "http://localhost:5173"
#endif
#endif

using namespace teleprompter;

namespace {

struct App {
    Window window;
    std::unique_ptr<WebViewHost> webview;
    std::unique_ptr<Matcher> matcher;
    std::unique_ptr<Model> model;
    std::unique_ptr<Recognizer> recognizer;

    void WireIpc(WebViewHost* webview) {
        // IPC dispatch is registered in RegisterIpcHandlers (ipc wiring below).
    }
};

} // namespace

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
    App app;

    if (!app.window.Create({})) return 1;

    app.webview = std::make_unique<WebViewHost>();
    if (!app.webview->Create(app.window.hwnd(), TELEPROMPTER_FRONTEND_URL)) return 1;

    app.matcher = std::make_unique<Matcher>(std::vector<std::string>{});
    app.model = std::make_unique<Model>();
    app.recognizer = std::make_unique<Recognizer>();

    WebViewHost* wv = app.webview.get();

    IpcRouter router;

    router.Register("overlay:toggle", [&app](const std::string& payload) {
        auto j = nlohmann::json::parse(payload, nullptr, false);
        if (!j.is_discarded()) app.window.SetOverlay(j.value("enabled", false));
        return "";
    });
    router.Register("overlay:clickThrough", [&app](const std::string& payload) {
        auto j = nlohmann::json::parse(payload, nullptr, false);
        if (!j.is_discarded()) app.window.SetClickThrough(j.value("enabled", false));
        return "";
    });
    router.Register("overlay:alwaysOnTop", [&app](const std::string& payload) {
        auto j = nlohmann::json::parse(payload, nullptr, false);
        if (!j.is_discarded()) app.window.SetAlwaysOnTop(j.value("enabled", false));
        return "";
    });
    router.Register("script:match", [&app, wv](const std::string& payload) {
        auto j = nlohmann::json::parse(payload, nullptr, false);
        if (j.is_discarded() || !j.contains("transcript")) return std::string("");
        const auto result = app.matcher->Match(j["transcript"].get<std::string>());
        wv->PostJson(MakeReply("script:matchResult", result));
        return "";
    });
    router.Register("speech:start", [&app, wv](const std::string&) {
        if (app.model->IsLoaded() && app.recognizer->Start(*app.model, [wv](const Transcript& t) {
                wv->PostJson(MakeEvent("speech:transcript",
                                       nlohmann::json({{"text", t.text}, {"isFinal", t.is_final}})
                                           .dump()));
            })) {
            wv->PostJson(MakeEvent("speech:started", "{}"));
        }
        return "";
    });
    router.Register("speech:stop", [&app](const std::string&) {
        app.recognizer->Stop();
        return "";
    });
    router.Register("speech:setLanguage", [&app](const std::string& payload) {
        auto j = nlohmann::json::parse(payload, nullptr, false);
        if (!j.is_discarded()) app.recognizer->SetLanguage(j.value("lang", "auto"));
        return "";
    });
    router.Register("settings:get", [](const std::string&) {
        return Settings::Instance().Load().dump();
    });
    router.Register("settings:set", [](const std::string& payload) {
        auto j = nlohmann::json::parse(payload, nullptr, false);
        if (!j.is_discarded()) Settings::Instance().Save(j);
        return "";
    });

    app.webview->SetMessageHandler([&router](const std::string& msg) {
        router.Dispatch(msg);
    });

    return app.window.RunMessageLoop();
}

#endif // _WIN32
