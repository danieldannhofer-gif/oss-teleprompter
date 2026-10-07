#include "ipc.h"

#include <string>

#include <nlohmann/json.hpp>

#include "webview.h"
#include "window.h"

namespace teleprompter {

namespace {

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
