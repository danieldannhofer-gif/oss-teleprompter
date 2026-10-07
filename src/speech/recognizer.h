#pragma once

#include <atomic>
#include <condition_variable>
#include <cstdint>
#include <deque>
#include <functional>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#include "audio.h"
#include "model.h"

namespace teleprompter {

struct Transcript {
    std::string text;
    bool isFinal = false;
};

using TranscriptCallback = std::function<void(const Transcript&)>;

class Recognizer {
public:
    Recognizer() = default;
    ~Recognizer();

    Recognizer(const Recognizer&) = delete;
    Recognizer& operator=(const Recognizer&) = delete;

    bool start(const std::string& modelPath);
    void stop();
    void setLanguage(const std::string& lang);
    void setTranscriptCallback(TranscriptCallback cb) { transcriptCb_ = std::move(cb); }

    bool isRunning() const { return running_.load(); }

    static constexpr size_t kSampleRate = 16000;

private:
    void processLoop();
    void onAudioData(const float* samples, size_t count);

    AudioCapture capture_;
    Model model_;
    TranscriptCallback transcriptCb_;

    std::mutex queueMutex_;
    std::condition_variable queueCv_;
    std::deque<float> sampleQueue_;
    std::atomic<bool> running_{false};
    std::atomic<bool> hasNewData_{false};
    std::thread worker_;
    std::mutex langMutex_;
    std::string language_;
};

}  // namespace teleprompter
