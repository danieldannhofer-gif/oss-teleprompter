#pragma once
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>

// Window management functions
void SetOverlay(HWND hwnd, bool enabled);
void SetClickThrough(HWND hwnd, bool enabled);
void SetAlwaysOnTop(HWND hwnd, bool enabled);

// Dock window to top or bottom edge of the nearest monitor.
// heightPercent: 10-90, percentage of screen height.
// Pass position="none" to undock (restore normal window).
void SetDock(HWND hwnd, const char* position, int heightPercent);

// Window procedure
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);

// Create and show the main window
HWND CreateMainWindow(HINSTANCE hInstance, int nCmdShow);
