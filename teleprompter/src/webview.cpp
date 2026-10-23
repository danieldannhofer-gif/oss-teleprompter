#include "webview.h"
#include <windows.h>
#include <wrl/client.h>
#include <wrl/event.h>
#include <WebView2.h>
#include <shlwapi.h>
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

// Check if the WebView2 Runtime is installed by looking in the registry.
// The runtime registers itself under the EdgeUpdate Clients key with this well-known GUID.
static bool IsWebView2RuntimeAvailable() {
    const wchar_t* keyPaths[] = {
        L"SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
        L"SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    };

    for (const wchar_t* keyPath : keyPaths) {
        HKEY hKey;
        if (RegOpenKeyEx(HKEY_LOCAL_MACHINE, keyPath, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            return true;
        }
        if (RegOpenKeyEx(HKEY_CURRENT_USER, keyPath, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            RegCloseKey(hKey);
            return true;
        }
    }
    return false;
}

// Get the directory containing the current executable.
static std::wstring GetExeDirectory() {
    wchar_t path[MAX_PATH];
    GetModuleFileName(nullptr, path, MAX_PATH);
    PathRemoveFileSpec(path);
    return std::wstring(path);
}

bool InitWebView(HWND hwnd, const wchar_t* url) {
    g_parentHwnd = hwnd;

    if (!IsWebView2RuntimeAvailable()) {
        MessageBox(hwnd,
            L"Microsoft Edge WebView2 Runtime is not installed.\n\n"
            L"Please download and install it from:\n"
            L"https://developer.microsoft.com/microsoft-edge/webview2/\n\n"
            L"The application will now exit.",
            L"WebView2 Runtime Required",
            MB_OK | MB_ICONERROR);
        return false;
    }

    WebViewContext* ctx = new WebViewContext{ hwnd, url };

    auto envHandler = Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
        [ctx](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
            return OnEnvironmentCreated(result, env, ctx);
        }
    );

    CreateCoreWebView2Environment(envHandler.Get());
    return true;
}

static HRESULT OnEnvironmentCreated(HRESULT result, ICoreWebView2Environment* env, WebViewContext* ctx) {
    if (FAILED(result) || !env) {
        MessageBox(ctx->hwnd,
            L"Failed to initialize WebView2.\n\n"
            L"Please ensure the Microsoft Edge WebView2 Runtime is installed:\n"
            L"https://developer.microsoft.com/microsoft-edge/webview2/\n\n"
            L"The application will now exit.",
            L"WebView2 Initialization Failed",
            MB_OK | MB_ICONERROR);
        delete ctx;
        PostQuitMessage(1);
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
        MessageBox(ctx->hwnd,
            L"Failed to create WebView2 controller.\n\n"
            L"The application will now exit.",
            L"WebView2 Error",
            MB_OK | MB_ICONERROR);
        delete ctx;
        PostQuitMessage(1);
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

#ifndef _DEBUG
    // Map a virtual host to the embedded frontend assets so the production
    // build serves files from disk instead of requiring a dev server.
    std::wstring exeDir = GetExeDirectory();
    std::wstring distPath = exeDir + L"\\dist";

    ComPtr<ICoreWebView2_3> webview2_3;
    if (SUCCEEDED(g_webview->QueryInterface(IID_PPV_ARGS(&webview2_3)))) {
        webview2_3->SetVirtualHostNameToFolderMapping(
            L"appassets.local",
            distPath.c_str(),
            COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_ALLOW
        );
    }
#endif

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
