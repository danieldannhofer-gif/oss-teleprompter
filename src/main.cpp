#include <cstdio>

#include "window.h"
#include "webview.h"

int main() {
    if (!teleprompter::Window::registerWindowClass()) {
        std::fprintf(stderr, "Failed to register window class\n");
        return 1;
    }

    teleprompter::WindowOptions options;
    options.title = L"Teleprompter";
    options.width = 1280;
    options.height = 800;

    if (!teleprompter::Window::create(options)) {
        std::fprintf(stderr, "Failed to create window\n");
        return 1;
    }

    if (!teleprompter::webviewInitialize(teleprompter::Window::handle(), nullptr)) {
        std::fprintf(stderr, "WebView2 not available (Task 2 wires full host)\n");
    }

    teleprompter::Window::pumpMessages();
    return 0;
}
