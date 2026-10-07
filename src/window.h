#pragma once

#include <string>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#else
typedef void* HWND;
typedef void* WNDPROC;
#endif

namespace teleprompter {

struct WindowOptions {
    std::wstring title;
    int width = 1280;
    int height = 800;
};

class Window {
public:
    static bool registerWindowClass();
    static HWND create(const WindowOptions& options);

    static HWND handle();
    static bool pumpMessages();

private:
#ifdef _WIN32
    static LRESULT CALLBACK wndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp);
#endif
    static inline HWND handle_ = nullptr;
};

}  // namespace teleprompter
