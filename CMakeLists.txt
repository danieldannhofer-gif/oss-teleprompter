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
    src/ipc.cpp
)

add_library(teleprompter_core STATIC
    src/speech/audio.cpp
)
target_include_directories(teleprompter_core PUBLIC src)
target_compile_definitions(teleprompter_core PUBLIC $<$<BOOL:${WIN32}>:TELEPROMPTER_WIN32>)

target_include_directories(Teleprompter PRIVATE ${WEBVIEW2_SDK})
target_include_directories(Teleprompter SYSTEM PRIVATE third_party/nlohmann_json/single_include)

target_link_libraries(Teleprompter PRIVATE
    WebView2LoaderStatic
    user32
    gdi32
    ws2_32
)

# Whisper.cpp is added in Task 4 (third_party/whisper.cpp submodule).

enable_testing()

add_executable(audio_test tests/cpp/audio_test.cpp)
target_link_libraries(audio_test PRIVATE teleprompter_core)
