#include "window.h"
#ifdef _WIN32

namespace teleprompter {

bool Window::Create(const WindowOptions& options) {
    WNDCLASSW wc = {};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = GetModuleHandleW(nullptr);
    wc.lpszClassName = L"TeleprompterWindow";
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    RegisterClassW(&wc);

    hwnd_ = CreateWindowW(wc.lpszClassName, options.title.c_str(),
                          WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT,
                          options.width, options.height, nullptr, nullptr, wc.hInstance, this);
    if (!hwnd_) return false;
    ShowWindow(hwnd_, SW_SHOW);
    UpdateWindow(hwnd_);
    return true;
}

int Window::RunMessageLoop() {
    MSG msg;
    while (GetMessageW(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    return static_cast<int>(msg.wParam);
}

void Window::SetOverlay(bool enabled) {
    if (enabled) {
        SetWindowLong(hwnd_, GWL_EXSTYLE,
                      GetWindowLong(hwnd_, GWL_EXSTYLE) | WS_EX_LAYERED | WS_EX_TOPMOST);
        SetLayeredWindowAttributes(hwnd_, RGB(0, 0, 0), 200, LWA_ALPHA);
        SetWindowLong(hwnd_, GWL_STYLE,
                      GetWindowLong(hwnd_, GWL_STYLE) & ~WS_CAPTION & ~WS_THICKFRAME);
    } else {
        SetWindowLong(hwnd_, GWL_EXSTYLE,
                      GetWindowLong(hwnd_, GWL_EXSTYLE) & ~WS_EX_LAYERED & ~WS_EX_TOPMOST);
        SetWindowLong(hwnd_, GWL_STYLE, WS_OVERLAPPEDWINDOW);
    }
    SetWindowPos(hwnd_, nullptr, 0, 0, 0, 0,
                 SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE);
}

void Window::SetClickThrough(bool enabled) {
    LONG ex_style = GetWindowLong(hwnd_, GWL_EXSTYLE);
    if (enabled) {
        SetWindowLong(hwnd_, GWL_EXSTYLE, ex_style | WS_EX_TRANSPARENT | WS_EX_LAYERED);
    } else {
        SetWindowLong(hwnd_, GWL_EXSTYLE, ex_style & ~WS_EX_TRANSPARENT);
    }
}

void Window::SetAlwaysOnTop(bool enabled) {
    SetWindowPos(hwnd_, enabled ? HWND_TOPMOST : HWND_NOTOPMOST,
                 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}

LRESULT CALLBACK Window::WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
        case WM_SIZE:
            // WebView2 controller resizes via webview.cpp callback registered on this HWND.
            if (auto handler = GetWindowLongPtrW(hwnd, GWLP_USERDATA)) {
                // Reserved: forward size to WebView2 controller.
            }
            return 0;
        default:
            return DefWindowProcW(hwnd, msg, wp, lp);
    }
}

} // namespace teleprompter

#endif // _WIN32
