#pragma once
#ifdef _WIN32

#include <string>
#include <windows.h>

namespace teleprompter {

struct WindowOptions {
    std::wstring title = L"Teleprompter";
    int width = 1280;
    int height = 800;
};

class Window {
public:
    bool Create(const WindowOptions& options);
    int RunMessageLoop();
    HWND hwnd() const { return hwnd_; }

    void SetOverlay(bool enabled);
    void SetClickThrough(bool enabled);
    void SetAlwaysOnTop(bool enabled);

private:
    static LRESULT CALLBACK WndProc(HWND, UINT, WPARAM, LPARAM);
    HWND hwnd_ = nullptr;
};

} // namespace teleprompter

#endif // _WIN32
