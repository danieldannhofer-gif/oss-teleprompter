#pragma once
#ifdef _WIN32

#include <atomic>
#include <cstdint>
#include <functional>
#include <thread>
#include <vector>

namespace teleprompter {

// Captures microphone audio via WASAPI, resampled to 16 kHz mono float32
// (the format whisper.cpp expects).
class AudioCapture {
public:
    using AudioCallback = std::function<void(const float* samples, size_t count)>;

    ~AudioCapture();

    void Start(AudioCallback callback);
    void Stop();
    bool IsRunning() const { return running_.load(); }

private:
    void CaptureLoop(AudioCallback callback);

    std::atomic<bool> running_{false};
    std::thread thread_;
};

} // namespace teleprompter

#endif // _WIN32
