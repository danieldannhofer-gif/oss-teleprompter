#pragma once
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>
#include <wrl/client.h>
#include <wrl/event.h>
#include <WebView2.h>

using Microsoft::WRL::ComPtr;

// Initialize WebView2 in the given window
void InitWebView(HWND hwnd, const wchar_t* url);
// Resize WebView2 to fill the window
void ResizeWebView(HWND hwnd);
// Send a message to the web content (JavaScript)
void SendMessageToWeb(const wchar_t* message);
// Set callback for messages from web content (JavaScript -> C++)
typedef void (*WebMessageCallback)(const wchar_t* message);
void SetWebMessageCallback(WebMessageCallback callback);
