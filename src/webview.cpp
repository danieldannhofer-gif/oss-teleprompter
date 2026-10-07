#include "webview.h"

#include <cstring>
#include <string>

namespace teleprompter {

#ifdef _WIN32

#include <WebView2.h>
#include <wrl.h>

#include "ipc.h"
#include "window.h"

using namespace Microsoft::WRL;

namespace {

ComPtr<ICoreWebView2Environment> g_environment;
ComPtr<ICoreWebView2Controller> g_controller;
ComPtr<ICoreWebView2> g_webview;
WebViewMessageHandler g_handler = nullptr;

class EnvironmentCompletedHandler
    : public ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler {
public:
    HRESULT STDMETHODCALLTYPE Invoke(HRESULT, ICoreWebView2Environment* env) override {
        g_environment = env;
        HWND hwnd = Window::handle();
        auto callback = Callback<
            ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
            [hwnd](HRESULT, ICoreWebView2Controller* controller) -> HRESULT {
                g_controller = controller;
                controller->get_CoreWebView2(&g_webview);
                RECT rc{};
                if (GetClientRect(hwnd, &rc)) {
                    controller->put_Bounds(rc);
                }
                EventRegistrationToken token{};
                g_webview->add_WebMessageReceived(
                    Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                        [](ICoreWebView2*, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                            wil::unique_cotaskmem_string raw;
                            if (FAILED(args->TryGetWebMessageAsString(&raw)) || !raw) return S_OK;
                            std::wstring ws(raw.get());
                            std::string s(ws.begin(), ws.end());
                            handleWebMessage(s);
                            return S_OK;
                        }).Get(), &token);
                g_webview->NavigateToString(L"<html><body style=\"background:#1a1a1a\"></body></html>");
                return S_OK;
            }).Get();
        env->CreateCoreWebView2Controller(hwnd, callback);
        return S_OK;
    }
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID, void**) override { return E_NOINTERFACE; }
    ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
    ULONG STDMETHODCALLTYPE Release() override { return 1; }
};

}  // namespace

bool webviewInitialize(void* parentHwnd, WebViewMessageHandler handler) {
    g_handler = handler;
    HRESULT hr = CreateCoreWebView2EnvironmentWithOptions(
        nullptr, nullptr, nullptr, new EnvironmentCompletedHandler());
    return SUCCEEDED(hr);
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
