cmake_minimum_required(VERSION 3.27)
project(Teleprompter VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- WebView2 SDK ---
# Downloaded manually to build/webview2 (see scripts/setup-webview2.ps1)
set(WEBVIEW2_DIR "${CMAKE_BINARY_DIR}/webview2")

if(NOT EXISTS "${WEBVIEW2_DIR}/build/native/include/WebView2.h")
    message(FATAL_ERROR "WebView2 SDK not found at ${WEBVIEW2_DIR}. Run scripts/setup-webview2.ps1 first.")
endif()

# --- Source files ---
set(SOURCES
    src/main.cpp
    src/window.cpp
    src/webview.cpp
    src/ipc.cpp
)

set(HEADERS
    src/window.h
    src/webview.h
    src/ipc.h
)

# --- Executable ---
add_executable(Teleprompter WIN32 ${SOURCES} ${HEADERS})

# Windows SDK include paths (for WRL headers under winrt/wrl/)
execute_process(
    COMMAND "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvarsall.bat" x64
    OUTPUT_QUIET ERROR_QUIET
)
# Find Windows SDK include path
file(GLOB WINDOWS_SDK_INCLUDE "C:/Program Files (x86)/Windows Kits/10/Include/10.0.*")
list(GET WINDOWS_SDK_INCLUDE 0 WINDOWS_SDK_PATH)

target_include_directories(Teleprompter PRIVATE
    src
    "${WEBVIEW2_DIR}/build/native/include"
    "${WINDOWS_SDK_PATH}/winrt"     # for wrl/client.h, wrl/event.h
    "${WINDOWS_SDK_PATH}/um"        # for windows.h etc
    "${WINDOWS_SDK_PATH}/shared"    # for shared headers
)

target_link_directories(Teleprompter PRIVATE
    "${WEBVIEW2_DIR}/build/native/x64"
)

target_link_libraries(Teleprompter PRIVATE
    WebView2LoaderStatic
    ws2_32
    comctl32
    ole32
    oleaut32
    uuid
    shlwapi
)

# --- Whisper.cpp (added in Task 4) ---
# add_subdirectory(third_party/whisper.cpp)
# target_link_libraries(Teleprompter PRIVATE whisper)

# --- Google Test (for C++ unit tests) ---
option(BUILD_TESTS "Build C++ unit tests" ON)
if(BUILD_TESTS)
    enable_testing()
    include(FetchContent)
    FetchContent_Declare(
        googletest
        URL https://github.com/google/googletest/archive/refs/tags/v1.15.2.zip
        DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    )
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    FetchContent_MakeAvailable(googletest)
endif()

# --- Post-build: copy WebView2 loader DLL ---
add_custom_command(TARGET Teleprompter POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${WEBVIEW2_DIR}/build/native/x64/WebView2Loader.dll"
        "$<TARGET_FILE_DIR:Teleprompter>/WebView2Loader.dll"
)
