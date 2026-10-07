cmake_minimum_required(VERSION 3.27)
project(Teleprompter CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(TELEPROMPTER_BUILD_TESTS "Build unit tests" ON)

add_library(teleprompter_core STATIC
    src/utils/string_utils.cpp
    src/script/matcher.cpp
    src/ipc/ipc.cpp
)
target_include_directories(teleprompter_core PUBLIC src third_party/nlohmann_json/single_include)

if(WIN32)
    # whisper.cpp is only built into the Windows app
    set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
    add_subdirectory(third_party/whisper.cpp EXCLUDE_FROM_ALL)

    add_executable(Teleprompter WIN32
        src/main.cpp
        src/window.cpp
        src/webview.cpp
        src/speech/audio.cpp
        src/speech/recognizer.cpp
        src/speech/model.cpp
        src/settings.cpp
    )
    target_link_libraries(Teleprompter PRIVATE
        teleprompter_core
        whisper
        nlohmann_json::nlohmann_json
        ws2_32
    )
    if(CMAKE_BUILD_TYPE STREQUAL "Release")
        set_target_properties(Teleprompter PROPERTIES WIN32_EXECUTABLE TRUE)
    endif()
endif()

if(TELEPROMPTER_BUILD_TESTS)
    enable_testing()
    add_subdirectory(third_party/googletest EXCLUDE_FROM_ALL)

    foreach(test_name string_utils_test matcher_test ipc_test)
        add_executable(${test_name} tests/cpp/${test_name}.cpp)
        target_link_libraries(${test_name} PRIVATE teleprompter_core GTest::gtest_main)
        target_include_directories(${test_name} PRIVATE src)
        add_test(NAME ${test_name} COMMAND ${test_name})
    endforeach()
endif()
