#include "webview.h"
#ifdef _WIN32

#include <WebView2.h>
#include <wil/com.h>
#include <wil/resource.h>

namespace teleprompter {

namespace {
// Event registration tokens kept alive for the process lifetime.
EventRegistrationToken web_message_token_{};
} // namespace

bool WebViewHost::Create(HWND parent, const std::string& frontend_url) {
    parent_ = parent;

    std::wstring url(frontend_url.begin(), frontend_url.end());

    HRESULT hr = CreateCoreWebView2EnvironmentWithOptions(
        nullptr, nullptr, nullptr,
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [this, url](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
                if (FAILED(result)) return result;
                environment_ = env;
                return env->CreateCoreWebView2Controller(
                    parent_,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [this, url](HRESULT r, ICoreWebView2Controller* ctrl) -> HRESULT {
                            if (FAILED(r)) return r;
                            controller_ = ctrl;
                            controller_->get_CoreWebView2(&webview_);
                            wil::com_ptr<ICoreWebView2> wv = webview_;
                            wv->add_WebMessageReceived(
                                Callback<ICoreWebView2WebMessageReceivedEventHandler>(
                                    [this](ICoreWebView2*, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                                        wil::unique_cotaskmem_string json;
                                        args->get_WebMessageAsJson(&json);
                                        OnWebMessageReceived(
                                            json ? std::string(json.get()) : std::string());
                                        return S_OK;
                                    })
                                    .Get(),
                                &web_message_token_);
                            wv->Navigate(url.c_str());
                            Resize();
                            return S_OK;
                        })
                        .Get());
            })
            .Get());

    return SUCCEEDED(hr);
}

void WebViewHost::Resize() {
    if (!controller_ || !parent_) return;
    RECT rect;
    GetClientRect(parent_, &rect);
    controller_->put_Bounds(rect);
}

void WebViewHost::SetMessageHandler(MessageHandler handler) {
    handler_ = std::move(handler);
}

void WebViewHost::PostJson(const std::string& json) {
    if (!webview_) return;
    std::wstring wide(json.begin(), json.end());
    webview_->PostWebMessageAsJson(wide.c_str());
}

void WebViewHost::OnWebMessageReceived(const std::string& web_message) {
    if (handler_) handler_(web_message);
}

} // namespace teleprompter

#endif // _WIN32
