#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>
#include "window.h"
#include "webview.h"
#include "ipc.h"

HWND g_mainWindow = nullptr;

// Dev URL (Vite dev server) — change to embedded path for production
#ifdef _DEBUG
    const wchar_t* DEV_URL = L"http://localhost:5173";
#else
    const wchar_t* DEV_URL = L"http://localhost:5173"; // TODO: embed frontend for production
#endif

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine, int nCmdShow) {
    // Enable DPI awareness
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);

    // Create main window
    g_mainWindow = CreateMainWindow(hInstance, nCmdShow);
    if (!g_mainWindow) {
        MessageBox(nullptr, L"Failed to create window", L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    // Initialize IPC
    InitIPC(g_mainWindow);

    // Initialize WebView2
    InitWebView(g_mainWindow, DEV_URL);

    // Message loop
    MSG msg = {};
    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return static_cast<int>(msg.wParam);
}
