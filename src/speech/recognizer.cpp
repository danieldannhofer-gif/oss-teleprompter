#include "speech/recognizer.h"
#ifdef _WIN32

#include <whisper.h>

#include <condition_variable>

namespace teleprompter {

namespace {
constexpr size_t kSampleRate = 16000;
// Process ~2 second chunks once enough audio has accumulated.
constexpr size_t kMinSamples = kSampleRate * 2;
} // namespace

Recognizer::~Recognizer() {
    Stop();
}

void Recognizer::SetLanguage(const std::string& lang) {
    language_ = lang;
}

bool Recognizer::Start(Model& model, TranscriptCallback callback) {
    if (!model.IsLoaded() || running_.exchange(true)) return false;

    worker_ = std::thread([this, &model, callback = std::move(callback)] {
        RunWhisperLoop(model, callback);
    });
    return true;
}

void Recognizer::Stop() {
    running_ = false;
    if (worker_.joinable()) worker_.join();
}

void Recognizer::ProcessBuffer(const float* samples, size_t count) {
    std::lock_guard<std::mutex> lock(buffer_mutex_);
    pending_.insert(pending_.end(), samples, samples + count);
}

void Recognizer::RunWhisperLoop(Model& model, TranscriptCallback callback) {
    AudioCapture capture;
    capture.Start([this](const float* samples, size_t count) {
        ProcessBuffer(samples, count);
    });

    while (running_.load()) {
        std::vector<float> chunk;
        {
            std::lock_guard<std::mutex> lock(buffer_mutex_);
            if (pending_.size() < kMinSamples) {
                // not enough audio yet
            } else {
                chunk.assign(pending_.begin(), pending_.begin() + kMinSamples);
                pending_.erase(pending_.begin(), pending_.begin() + kMinSamples);
            }
        }
        if (chunk.empty()) {
            Sleep(100);
            continue;
        }

        whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_BEAM_SEARCH);
        params.print_progress = false;
        params.print_realtime = false;
        params.print_timestamps = false;
        params.language = language_ == "auto" ? nullptr : language_.c_str();

        if (whisper_full(model.ctx(), params, chunk.data(),
                         static_cast<int>(chunk.size())) != 0) {
            continue;
        }

        std::string text;
        const int n_segments = whisper_full_n_segments(model.ctx());
        for (int i = 0; i < n_segments; ++i) {
            const char* seg = whisper_full_get_segment_text(model.ctx(), i);
            if (seg) text += seg;
        }
        if (!text.empty() && callback) {
            callback({text, true});
        }
    }

    capture.Stop();
}

} // namespace teleprompter

#endif // _WIN32
