#include <cstdio>

#include "speech/audio.h"

int main() {
    int failures = 0;

    {
        teleprompter::AudioCapture capture;
        if (capture.isRunning()) { std::printf("FAIL: should not be running initially\n"); ++failures; }

        bool started = capture.start();
#ifdef _WIN32
        if (!started) { std::printf("FAIL: start() should succeed on Windows\n"); ++failures; }
        if (!capture.isRunning()) { std::printf("FAIL: should be running after start\n"); ++failures; }
        capture.stop();
        if (capture.isRunning()) { std::printf("FAIL: should not be running after stop\n"); ++failures; }
        capture.stop();
#else
        if (started) { std::printf("FAIL: start() should fail on non-Windows\n"); ++failures; }
#endif
    }

    {
        teleprompter::AudioCapture capture;
        capture.setCallback([](const float*, size_t count) {
            if (count == 0) std::printf("FAIL: callback received 0 samples\n");
        });
        capture.start();
        capture.stop();
    }

    if (failures == 0) {
        std::printf("audio_test PASS\n");
        return 0;
    }
    std::printf("audio_test FAIL (%d)\n", failures);
    return 1;
}
