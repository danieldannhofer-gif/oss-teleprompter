#pragma once
#ifdef _WIN32

#include <string>
#include <functional>
#include <WebView2.h>
#include <wil/com.h>

namespace teleprompter {

class Window;

// Hosts the WebView2 control that renders the React frontend and routes
// WebMessages between JavaScript and the native IpcRouter.
class WebViewHost {
public:
    using MessageHandler = std::function<void(const std::string&)>;

    bool Create(HWND parent, const std::string& frontend_url);
    void Resize();
    void SetMessageHandler(MessageHandler handler);
    // Post a JSON string to the frontend via window.chrome.webview messages.
    void PostJson(const std::string& json);
    HWND controller_hwnd() const { return controller_hwnd_; }

private:
    void OnWebMessageReceived(const std::string& web_message);

    wil::com_ptr<ICoreWebView2Environment> environment_;
    wil::com_ptr<ICoreWebView2Controller> controller_;
    wil::com_ptr<ICoreWebView2> webview_;
    HWND parent_ = nullptr;
    HWND controller_hwnd_ = nullptr;
    MessageHandler handler_;
};

} // namespace teleprompter

#endif // _WIN32
