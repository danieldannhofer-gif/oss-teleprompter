#include "webview.h"
#include <windows.h>
#include <wrl/client.h>
#include <wrl/event.h>
#include <WebView2.h>
#include <string>
#include <memory>

using Microsoft::WRL::ComPtr;
using Microsoft::WRL::Callback;
using Microsoft::WRL::Make;

static ComPtr<ICoreWebView2Controller> g_controller;
static ComPtr<ICoreWebView2> g_webview;
static WebMessageCallback g_messageCallback = nullptr;
static HWND g_parentHwnd = nullptr;

void SetWebMessageCallback(WebMessageCallback callback) {
    g_messageCallback = callback;
}

struct WebViewContext {
    HWND hwnd;
    std::wstring url;
};

static HRESULT OnControllerCreated(HRESULT result, ICoreWebView2Controller* controller, WebViewContext* ctx);
static HRESULT OnEnvironmentCreated(HRESULT result, ICoreWebView2Environment* env, WebViewContext* ctx);

void InitWebView(HWND hwnd, const wchar_t* url) {
    g_parentHwnd = hwnd;

    WebViewContext* ctx = new WebViewContext{ hwnd, url };

    auto envHandler = Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
        [ctx](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
            return OnEnvironmentCreated(result, env, ctx);
        }
    );

    CreateCoreWebView2Environment(envHandler.Get());
}

static HRESULT OnEnvironmentCreated(HRESULT result, ICoreWebView2Environment* env, WebViewContext* ctx) {
    if (FAILED(result) || !env) {
        delete ctx;
        return result;
    }

    WebViewContext* ctxCopy = new WebViewContext(*ctx);

    auto controllerHandler = Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
        [ctxCopy](HRESULT result, ICoreWebView2Controller* controller) -> HRESULT {
            return OnControllerCreated(result, controller, ctxCopy);
        }
    );

    env->CreateCoreWebView2Controller(ctx->hwnd, controllerHandler.Get());
    delete ctx;
    return S_OK;
}

static HRESULT OnControllerCreated(HRESULT result, ICoreWebView2Controller* controller, WebViewContext* ctx) {
    if (FAILED(result) || !controller) {
        delete ctx;
        return result;
    }

    g_controller = controller;
    g_controller->get_CoreWebView2(&g_webview);

    RECT bounds;
    GetClientRect(ctx->hwnd, &bounds);
    g_controller->put_Bounds(bounds);

    auto messageHandler = Callback<ICoreWebView2WebMessageReceivedEventHandler>(
        [](ICoreWebView2* sender, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
            LPWSTR messageRaw = nullptr;
            args->TryGetWebMessageAsString(&messageRaw);
            if (messageRaw && g_messageCallback) {
                g_messageCallback(messageRaw);
            }
            if (messageRaw) CoTaskMemFree(messageRaw);
            return S_OK;
        }
    );

    g_webview->add_WebMessageReceived(messageHandler.Get(), nullptr);

    g_webview->Navigate(ctx->url.c_str());

    delete ctx;
    return S_OK;
}

void ResizeWebView(HWND hwnd) {
    if (g_controller) {
        RECT bounds;
        GetClientRect(hwnd, &bounds);
        g_controller->put_Bounds(bounds);
    }
}

void SendMessageToWeb(const wchar_t* message) {
    if (g_webview) {
        g_webview->PostWebMessageAsString(message);
    }
}
