#include "webview.h"

namespace teleprompter {

#ifdef _WIN32

#include <cstring>

#include <WebView2.h>
#include <wrl.h>

using namespace Microsoft::WRL;

namespace {

ComPtr<ICoreWebView2Environment> g_environment;
ComPtr<ICoreWebView2Controller> g_controller;
ComPtr<ICoreWebView2> g_webview;
WebViewMessageHandler g_handler = nullptr;

}  // namespace

bool webviewInitialize(void* parentHwnd, WebViewMessageHandler handler) {
    g_handler = handler;
    (void)parentHwnd;
    // Full WebView2 environment/controller creation is wired in Task 2.
    return false;
}

void webviewResize(int width, int height) {
    if (g_controller) {
        RECT bounds{0, 0, width, height};
        g_controller->put_Bounds(bounds);
    }
}

void webviewPostMessage(const char* json) {
    if (g_webview && json) {
        std::wstring ws(json, json + std::strlen(json));
        g_webview->PostWebMessageAsString(ws.c_str());
    }
}

#else

bool webviewInitialize(void*, WebViewMessageHandler) { return false; }
void webviewResize(int, int) {}
void webviewPostMessage(const char*) {}

#endif

}  // namespace teleprompter
