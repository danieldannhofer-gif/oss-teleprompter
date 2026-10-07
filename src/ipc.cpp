#include "ipc.h"

#include <string>

#include <nlohmann/json.hpp>

#include "script/matcher.h"
#include "speech/recognizer.h"
#include "webview.h"
#include "window.h"

namespace teleprompter {

namespace {

Recognizer g_recognizer;
std::string g_model_path = "models/ggml-base.bin";
Matcher* g_matcher = nullptr;
std::vector<std::string> g_script_lines;

void emitTranscript(const std::string& text, bool isFinal) {
    nlohmann::json event{{"type", "speech:transcript"}, {"text", text}, {"isFinal", isFinal}};
    webviewPostMessage(event.dump().c_str());
}

void ensureRecognizerCallbacks() {
    g_recognizer.setTranscriptCallback([](const Transcript& t) { emitTranscript(t.text, t.isFinal); });
}

void dispatch(const nlohmann::json& msg) {
    if (!msg.contains("type") || !msg["type"].is_string()) {
        return;
    }
    const std::string type = msg["type"];
    const bool enabled = msg.value("enabled", false);

    if (type == "overlay:toggle") {
        setOverlay(Window::handle(), enabled);
    } else if (type == "overlay:clickThrough") {
        setClickThrough(Window::handle(), enabled);
    } else if (type == "overlay:alwaysOnTop") {
        setAlwaysOnTop(Window::handle(), enabled);
    } else if (type == "speech:start") {
        ensureRecognizerCallbacks();
        if (!g_recognizer.start(g_model_path)) {
            emitTranscript("error: failed to start recognizer (model missing?)", true);
        }
    } else if (type == "speech:stop") {
        g_recognizer.stop();
    } else if (type == "speech:setLanguage") {
        g_recognizer.setLanguage(msg.value("language", std::string()));
    } else if (type == "speech:setModel") {
        g_model_path = msg.value("path", g_model_path);
    } else if (type == "script:load") {
        g_script_lines = msg.value("lines", std::vector<std::string>{});
        delete g_matcher;
        g_matcher = new Matcher(g_script_lines);
    } else if (type == "script:match") {
        if (!g_matcher) {
            nlohmann::json err{{"type", "script:matchResult"},
                              {"error", "no script loaded"}};
            webviewPostMessage(err.dump().c_str());
            return;
        }
        MatchResult result = g_matcher->match(msg.value("text", std::string()));
        nlohmann::json reply{
            {"type", "script:matchResult"},
            {"matchType", result.type == MatchType::OnScript ? "onScript" : "offScript"},
            {"lineIndex", result.lineIndex},
            {"confidence", result.confidence}};
        webviewPostMessage(reply.dump().c_str());
    }
}

}  // namespace

void handleWebMessage(const std::string& message) {
    try {
        dispatch(nlohmann::json::parse(message));
    } catch (const nlohmann::json::exception&) {
        return;
    }
}

}  // namespace teleprompter
