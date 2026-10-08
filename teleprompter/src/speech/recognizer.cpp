#ifndef NOMINMAX
#define NOMINMAX
#endif
#include "recognizer.h"
#include "audio.h"
#include "model.h"
#include "whisper.h"
#include <iostream>
#include <chrono>
#include <thread>
#include <algorithm>

SpeechRecognizer::SpeechRecognizer()
    : m_audioCapture(std::make_unique<AudioCapture>())
    , m_model(std::make_unique<WhisperModel>())
{
}

SpeechRecognizer::~SpeechRecognizer() {
    Stop();
}

bool SpeechRecognizer::LoadModel(const std::string& modelPath) {
    return m_model->Load(modelPath);
}

bool SpeechRecognizer::Start() {
    if (m_isRecognizing) return true;
    if (!m_model->IsLoaded()) {
        std::cerr << "Cannot start recognition: model not loaded" << std::endl;
        return false;
    }

    // Set up audio callback
    m_audioCapture->SetCallback([this](const float* samples, size_t count) {
        ProcessAudio(samples, count);
    });

    // Start audio capture
    if (!m_audioCapture->Start()) {
        std::cerr << "Failed to start audio capture" << std::endl;
        return false;
    }

    m_isRecognizing = true;

    // Start recognition thread
    m_recognitionThread = std::thread(&SpeechRecognizer::RunRecognition, this);

    return true;
}

void SpeechRecognizer::Stop() {
    if (!m_isRecognizing) return;

    m_isRecognizing = false;
    m_shouldProcess = false;

    if (m_recognitionThread.joinable()) {
        m_recognitionThread.join();
    }

    m_audioCapture->Stop();
}

bool SpeechRecognizer::IsRecognizing() const {
    return m_isRecognizing;
}

void SpeechRecognizer::SetLanguage(const std::string& lang) {
    m_language = lang;
}

void SpeechRecognizer::SetCallback(TranscriptCallback callback) {
    std::lock_guard<std::mutex> lock(m_callbackMutex);
    m_callback = callback;
}

void SpeechRecognizer::ProcessAudio(const float* samples, size_t count) {
    if (!m_isRecognizing) return;

    std::lock_guard<std::mutex> lock(m_bufferMutex);
    m_audioBuffer.insert(m_audioBuffer.end(), samples, samples + count);

    // Trigger processing when we have enough audio (e.g., 1 second = 16000 samples)
    if (m_audioBuffer.size() >= 16000) {
        m_shouldProcess = true;
    }
}

void SpeechRecognizer::RunRecognition() {
    whisper_context* ctx = m_model->GetContext();
    if (!ctx) return;

    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    params.print_realtime = false;
    params.print_progress = false;
    params.print_timestamps = false;
    params.translate = false;
    params.no_context = true;
    params.single_segment = false;
    params.max_tokens = 0;
    params.audio_ctx = 0;
    params.tdrz_enable = false;

    // Set language
    if (!m_language.empty()) {
        params.language = m_language.c_str();
    } else {
        params.language = nullptr; // auto-detect
    }

    std::vector<float> processBuffer;

    while (m_isRecognizing) {
        // Check if we have enough audio to process
        {
            std::lock_guard<std::mutex> lock(m_bufferMutex);
            if (m_shouldProcess && m_audioBuffer.size() >= 16000) {
                // Take up to 3 seconds of audio (48000 samples)
                size_t processSize = std::min(m_audioBuffer.size(), static_cast<size_t>(48000));
                processBuffer.assign(m_audioBuffer.begin(), m_audioBuffer.begin() + processSize);
                m_audioBuffer.erase(m_audioBuffer.begin(), m_audioBuffer.begin() + processSize);
                m_shouldProcess = m_audioBuffer.size() >= 16000;
            } else {
                processBuffer.clear();
            }
        }

        if (!processBuffer.empty()) {
            // Run whisper on the audio buffer
            if (whisper_full(ctx, params, processBuffer.data(), processBuffer.size()) == 0) {
                int n_segments = whisper_full_n_segments(ctx);
                for (int i = 0; i < n_segments; i++) {
                    const char* text = whisper_full_get_segment_text(ctx, i);
                    if (text && strlen(text) > 0) {
                        TranscriptResult result;
                        result.text = text;
                        result.is_final = true;

                        std::lock_guard<std::mutex> lock(m_callbackMutex);
                        if (m_callback) {
                            m_callback(result);
                        }
                    }
                }
            }
        } else {
            // No audio to process, sleep briefly
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }
    }
}
