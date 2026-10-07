#pragma once

#include <cstddef>

#ifdef _WIN32
#include <windows.h>
#endif

namespace teleprompter {

using WebViewMessageHandler = void (*)(const char* message, size_t length);

bool webviewInitialize(void* parentHwnd, WebViewMessageHandler handler);
void webviewResize(int width, int height);
void webviewPostMessage(const char* json);

}  // namespace teleprompter
