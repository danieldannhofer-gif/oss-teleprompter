#pragma once
#include <string>
#include <functional>
#include <memory>
#include <atomic>
#include <vector>
#include <mutex>

class AudioCapture;
class WhisperModel;

struct TranscriptResult {
    std::string text;
    bool is_final;
};

// Speech recognizer using Whisper.cpp
class SpeechRecognizer {
public:
    using TranscriptCallback = std::function<void(const TranscriptResult&)>;

    SpeechRecognizer();
    ~SpeechRecognizer();

    // Load the Whisper model
    bool LoadModel(const std::string& modelPath);

    // Start recognition (starts audio capture + whisper processing)
    bool Start();

    // Stop recognition
    void Stop();

    // Check if currently recognizing
    bool IsRecognizing() const;

    // Set language ("de", "en", or "" for auto)
    void SetLanguage(const std::string& lang);

    // Set callback for transcript results
    void SetCallback(TranscriptCallback callback);

private:
    void ProcessAudio(const float* samples, size_t count);
    void RunRecognition();

    std::unique_ptr<AudioCapture> m_audioCapture;
    std::unique_ptr<WhisperModel> m_model;

    std::atomic<bool> m_isRecognizing{false};
    std::mutex m_callbackMutex;
    TranscriptCallback m_callback;

    std::string m_language;

    // Audio buffer for whisper (accumulated samples)
    std::vector<float> m_audioBuffer;
    std::mutex m_bufferMutex;

    // Recognition thread
    std::thread m_recognitionThread;
    std::atomic<bool> m_shouldProcess{false};
};
