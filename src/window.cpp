#include "window.h"
#include "webview.h"

namespace teleprompter {

bool Window::registerWindowClass() {
#ifdef _WIN32
    WNDCLASSEXW wc{};
    wc.cbSize = sizeof(wc);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = Window::wndProc;
    wc.hInstance = GetModuleHandleW(nullptr);
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName = L"TeleprompterWindowClass";
    return RegisterClassExW(&wc) != 0;
#else
    return false;
#endif
}

HWND Window::create(const WindowOptions& options) {
#ifdef _WIN32
    handle_ = CreateWindowExW(
        0, L"TeleprompterWindowClass", options.title.c_str(),
        WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT,
        options.width, options.height, nullptr, nullptr,
        GetModuleHandleW(nullptr), nullptr);
    if (handle_) {
        ShowWindow(handle_, SW_SHOW);
        UpdateWindow(handle_);
    }
    return handle_;
#else
    (void)options;
    return nullptr;
#endif
}

#ifdef _WIN32
LRESULT CALLBACK Window::wndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
    case WM_SIZE: {
        RECT rc{};
        if (GetClientRect(hwnd, &rc)) {
            webviewResize(rc.right - rc.left, rc.bottom - rc.top);
        }
        return 0;
    }
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    default:
        return DefWindowProcW(hwnd, msg, wp, lp);
    }
}
#endif

bool Window::pumpMessages() {
#ifdef _WIN32
    MSG msg{};
    while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    return true;
#else
    return false;
#endif
}

HWND Window::handle() {
    return handle_;
}

}  // namespace teleprompter
