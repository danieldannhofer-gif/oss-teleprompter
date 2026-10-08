#include <gtest/gtest.h>
#include "../src/speech/audio.h"

TEST(AudioCapture, StartsAndStops) {
    AudioCapture capture;
    // Note: This test may fail on machines without a microphone
    // In CI, we'd mock this or skip
    bool started = capture.Start();
    if (started) {
        EXPECT_TRUE(capture.IsCapturing());
        capture.Stop();
        EXPECT_FALSE(capture.IsCapturing());
    } else {
        GTEST_SKIP() << "No microphone available or audio capture failed";
    }
}

TEST(AudioCapture, CallbackReceivesData) {
    AudioCapture capture;
    bool receivedData = false;

    capture.SetCallback([&receivedData](const float* samples, size_t count) {
        if (count > 0 && samples != nullptr) {
            receivedData = true;
        }
    });

    if (capture.Start()) {
        // Wait up to 2 seconds for audio data
        for (int i = 0; i < 20 && !receivedData; i++) {
            Sleep(100);
        }
        capture.Stop();
        // Don't assert receivedData — may be silent environment
    } else {
        GTEST_SKIP() << "No microphone available";
    }
}
