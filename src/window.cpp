#include "window.h"
#include <windows.h>

static HWND g_hwnd = nullptr;

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    switch (uMsg) {
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
        case WM_SIZE:
            // Resize WebView2 controller if needed (handled in webview.cpp)
            return 0;
        default:
            return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
}

HWND CreateMainWindow(HINSTANCE hInstance, int nCmdShow) {
    const wchar_t CLASS_NAME[] = L"TeleprompterWindowClass";

    WNDCLASS wc = {};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hCursor = LoadCursor(nullptr, IDC_ARROW);
    wc.hbrBackground = nullptr; // Transparent background

    RegisterClass(&wc);

    g_hwnd = CreateWindowEx(
        0,
        CLASS_NAME,
        L"Teleprompter",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT,
        1200, 800,
        nullptr,
        nullptr,
        hInstance,
        nullptr
    );

    if (g_hwnd) {
        ShowWindow(g_hwnd, nCmdShow);
        UpdateWindow(g_hwnd);
    }

    return g_hwnd;
}

void SetOverlay(HWND hwnd, bool enabled) {
    LONG_PTR exStyle = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
    LONG_PTR style = GetWindowLongPtr(hwnd, GWL_STYLE);

    if (enabled) {
        // Remove caption and thick frame for borderless
        style &= ~(WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
        // Add layered + topmost
        exStyle |= WS_EX_LAYERED | WS_EX_TOPMOST;
        // Semi-transparent background
        SetLayeredWindowAttributes(hwnd, RGB(0, 0, 0), 200, LWA_ALPHA);
    } else {
        style |= WS_OVERLAPPEDWINDOW;
        exStyle &= ~(WS_EX_LAYERED | WS_EX_TOPMOST);
    }

    SetWindowLongPtr(hwnd, GWL_STYLE, style);
    SetWindowLongPtr(hwnd, GWL_EXSTYLE, exStyle);
    SetWindowPos(hwnd, nullptr, 0, 0, 0, 0,
        SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER);
}

void SetClickThrough(HWND hwnd, bool enabled) {
    LONG_PTR exStyle = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
    if (enabled) {
        exStyle |= WS_EX_TRANSPARENT | WS_EX_LAYERED;
    } else {
        exStyle &= ~WS_EX_TRANSPARENT;
    }
    SetWindowLongPtr(hwnd, GWL_EXSTYLE, exStyle);
}

void SetAlwaysOnTop(HWND hwnd, bool enabled) {
    SetWindowPos(hwnd, enabled ? HWND_TOPMOST : HWND_NOTOPMOST,
        0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}
