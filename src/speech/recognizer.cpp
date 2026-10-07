#include "recognizer.h"

#include <chrono>
#include <cmath>

#include <whisper.h>

namespace teleprompter {

namespace {

constexpr size_t kChunkSamples = 16000;
constexpr std::chrono::milliseconds kProcessInterval{500};

}  // namespace

Recognizer::~Recognizer() { stop(); }

void Recognizer::onAudioData(const float* samples, size_t count) {
    std::lock_guard<std::mutex> lock(queueMutex_);
    sampleQueue_.insert(sampleQueue_.end(), samples, samples + count);
    hasNewData_.store(true);
    queueCv_.notify_one();
}

bool Recognizer::start(const std::string& modelPath) {
    if (running_.load()) return true;
    if (!model_.load(modelPath)) return false;

    capture_.setCallback([this](const float* s, size_t n) { onAudioData(s, n); });
    if (!capture_.start()) return false;

    running_.store(true);
    worker_ = std::thread([this] { processLoop(); });
    return true;
}

void Recognizer::stop() {
    if (!running_.load()) return;
    running_.store(false);
    queueCv_.notify_all();
    if (worker_.joinable()) worker_.join();
    capture_.stop();
}

void Recognizer::setLanguage(const std::string& lang) {
    std::lock_guard<std::mutex> lock(langMutex_);
    language_ = lang;
}

void Recognizer::processLoop() {
    while (running_.load()) {
        std::vector<float> chunk;
        {
            std::unique_lock<std::mutex> lock(queueMutex_);
            queueCv_.wait_for(lock, kProcessInterval, [this] { return !running_.load(); });
            if (sampleQueue_.size() >= kChunkSamples) {
                chunk.assign(sampleQueue_.begin(), sampleQueue_.begin() + kChunkSamples);
                sampleQueue_.erase(sampleQueue_.begin(),
                                    sampleQueue_.begin() + kChunkSamples);
            } else if (!sampleQueue_.empty()) {
                chunk.assign(sampleQueue_.begin(), sampleQueue_.end());
                sampleQueue_.clear();
            }
        }
        if (chunk.empty()) continue;

        whisper_full_params params = whisper_full_default_params(
            WHISPER_SAMPLING_BEAM_SEARCH);
        {
            std::lock_guard<std::mutex> lock(langMutex_);
            params.language = language_.empty() ? nullptr : language_.c_str();
        }
        params.translate = false;
        params.no_context = true;
        params.single_segment = false;
        params.print_progress = false;
        params.print_special = false;
        params.print_realtime = false;

        if (whisper_full(model_.raw(), params, chunk.data(),
                         static_cast<int>(chunk.size())) != 0) {
            continue;
        }

        const int nSegments = whisper_full_n_segments(model_.raw());
        std::string text;
        for (int i = 0; i < nSegments; ++i) {
            const char* seg = whisper_full_get_segment_text(model_.raw(), i);
            if (seg) text += seg;
        }
        if (transcriptCb_) {
            transcriptCb_({text, true});
        }
    }
}

}  // namespace teleprompter
