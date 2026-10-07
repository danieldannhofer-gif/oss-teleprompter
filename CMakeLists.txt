cmake_minimum_required(VERSION 3.27)
project(Teleprompter CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(NOT WIN32)
    message(FATAL_ERROR "Teleprompter requires Windows (Win32 + WebView2).")
endif()

set(WEBVIEW2_SDK "" CACHE PATH "Path to the WebView2 SDK (unpacked NuGet package)")

if(NOT WEBVIEW2_SDK)
    message(FATAL_ERROR
        "Set WEBVIEW2_SDK to the WebView2 SDK include directory "
        "(download the Microsoft.Web.WebView2 NuGet package and point this "
        "at its build/native/include folder).")
endif()

add_executable(Teleprompter
    src/main.cpp
    src/window.cpp
    src/webview.cpp
)

target_include_directories(Teleprompter PRIVATE ${WEBVIEW2_SDK})

target_link_libraries(Teleprompter PRIVATE
    WebView2LoaderStatic
    user32
    gdi32
    ws2_32
)

# Whisper.cpp is added in Task 4 (third_party/whisper.cpp submodule).

# Frontend build output is embedded/copy step, wired in Task 13 (installer).
