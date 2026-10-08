#pragma once
#include <string>

struct whisper_context;

// Manages the Whisper model lifecycle
class WhisperModel {
public:
    WhisperModel();
    ~WhisperModel();

    // Load model from file path. Returns true on success.
    bool Load(const std::string& modelPath);

    // Check if model is loaded
    bool IsLoaded() const;

    // Get the raw whisper context (for use by Recognizer)
    whisper_context* GetContext() const;

    // Get model path
    const std::string& GetPath() const;

private:
    whisper_context* m_ctx = nullptr;
    std::string m_modelPath;
};
