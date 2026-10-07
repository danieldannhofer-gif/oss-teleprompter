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
    src/speech/model.cpp
    src/speech/recognizer.cpp
    src/script/matcher.cpp
    src/utils/string_utils.cpp
)
target_include_directories(teleprompter_core PUBLIC src)

if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/third_party/whisper.cpp/CMakeLists.txt)
    set(WHISPER_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
    set(WHISPER_BUILD_TESTS OFF CACHE BOOL "" FORCE)
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
    add_subdirectory(third_party/whisper.cpp)
    target_link_libraries(teleprompter_core PUBLIC whisper)
endif()

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

add_executable(recognizer_test tests/cpp/recognizer_test.cpp)
target_link_libraries(recognizer_test PRIVATE teleprompter_core)

add_executable(string_utils_test tests/cpp/string_utils_test.cpp)
target_link_libraries(string_utils_test PRIVATE teleprompter_core)

add_executable(matcher_test tests/cpp/matcher_test.cpp)
target_link_libraries(matcher_test PRIVATE teleprompter_core)

add_test(NAME string_utils_test COMMAND string_utils_test)
add_test(NAME matcher_test COMMAND matcher_test)
