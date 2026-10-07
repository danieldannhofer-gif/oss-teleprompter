#pragma once

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <thread>

namespace teleprompter {

using AudioCallback = std::function<void(const float* samples, size_t count)>;

class AudioCapture {
public:
    AudioCapture() = default;
    ~AudioCapture();

    AudioCapture(const AudioCapture&) = delete;
    AudioCapture& operator=(const AudioCapture&) = delete;

    bool start();
    void stop();
    void setCallback(AudioCallback callback);

    bool isRunning() const { return running_.load(); }

    static constexpr uint32_t kSampleRate = 16000;
    static constexpr uint32_t kChannels = 1;

private:
    class Impl;
    void cleanup();

    Impl* impl_ = nullptr;
    AudioCallback callback_;
    std::thread thread_;
    std::atomic<bool> running_{false};
};

}  // namespace teleprompter
