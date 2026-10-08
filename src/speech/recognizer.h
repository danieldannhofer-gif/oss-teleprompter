#pragma once
#ifdef _WIN32

#include "speech/audio.h"
#include "speech/model.h"
#include <atomic>
#include <deque>
#include <functional>
#include <mutex>
#include <string>
#include <vector>

namespace teleprompter {

struct Transcript {
    std::string text;
    bool is_final;
};

// Feeds captured audio into whisper.cpp on a background thread and emits
// transcripts. Auto language or pinned "de"/"en".
class Recognizer {
public:
    using TranscriptCallback = std::function<void(const Transcript&)>;

    ~Recognizer();

    bool Start(Model& model, TranscriptCallback callback);
    void Stop();
    void SetLanguage(const std::string& lang); // "de", "en" or "auto"
    bool IsRunning() const { return running_.load(); }

private:
    void ProcessBuffer(const float* samples, size_t count);
    void RunWhisperLoop(Model& model, TranscriptCallback callback);

    std::atomic<bool> running_{false};
    std::mutex buffer_mutex_;
    std::deque<float> pending_;
    std::string language_ = "auto";
    std::thread worker_;
};

} // namespace teleprompter

#endif // _WIN32
