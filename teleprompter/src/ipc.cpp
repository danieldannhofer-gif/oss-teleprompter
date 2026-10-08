#include "ipc.h"
#include "webview.h"
#include "window.h"
#include <string>
#include <cwchar>

// Forward declaration from main.cpp
extern HWND g_mainWindow;

void SendToFrontend(const wchar_t* jsonMessage) {
    SendMessageToWeb(jsonMessage);
}

void HandleWebMessage(const wchar_t* message) {
    // Parse JSON message and dispatch
    // Messages from frontend look like: {"type":"overlay:toggle","enabled":true}
    std::wstring msg(message);

    // Simple string-based dispatch (will be replaced with proper JSON parsing in later tasks)
    if (msg.find(L"\"type\":\"overlay:toggle\"") != std::wstring::npos) {
        bool enabled = msg.find(L"\"enabled\":true") != std::wstring::npos;
        SetOverlay(g_mainWindow, enabled);
    }
    else if (msg.find(L"\"type\":\"overlay:clickThrough\"") != std::wstring::npos) {
        bool enabled = msg.find(L"\"enabled\":true") != std::wstring::npos;
        SetClickThrough(g_mainWindow, enabled);
    }
    else if (msg.find(L"\"type\":\"overlay:alwaysOnTop\"") != std::wstring::npos) {
        bool enabled = msg.find(L"\"enabled\":true") != std::wstring::npos;
        SetAlwaysOnTop(g_mainWindow, enabled);
    }
    // Additional message types will be added in later tasks:
    // - speech:start, speech:stop, speech:setLanguage
    // - script:match
    // - settings:get, settings:set
}

// Callback function that matches the WebMessageCallback typedef
static void OnWebMessageReceived(const wchar_t* message) {
    HandleWebMessage(message);
}

void InitIPC(HWND hwnd) {
    SetWebMessageCallback(OnWebMessageReceived);
}
