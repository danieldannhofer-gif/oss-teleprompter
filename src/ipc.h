#pragma once
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>
#include <string>

// Initialize IPC (sets up WebView2 message callback)
void InitIPC(HWND hwnd);

// Handle a message received from JavaScript
void HandleWebMessage(const wchar_t* message);

// Send a JSON message to the web frontend
void SendToFrontend(const wchar_t* jsonMessage);

// Initialize speech recognition (loads model, etc.)
bool InitSpeech(const std::string& modelPath);

// Get the default model path (relative to executable)
std::string GetDefaultModelPath();
