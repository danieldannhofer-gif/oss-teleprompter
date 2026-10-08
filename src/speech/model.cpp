#include "model.h"
#include "whisper.h"
#include <iostream>

WhisperModel::WhisperModel() = default;

WhisperModel::~WhisperModel() {
    if (m_ctx) {
        whisper_free(m_ctx);
        m_ctx = nullptr;
    }
}

bool WhisperModel::Load(const std::string& modelPath) {
    if (m_ctx) {
        whisper_free(m_ctx);
        m_ctx = nullptr;
    }

    m_ctx = whisper_init_from_file(modelPath.c_str());
    if (!m_ctx) {
        std::cerr << "Failed to load Whisper model: " << modelPath << std::endl;
        return false;
    }

    m_modelPath = modelPath;
    std::cout << "Whisper model loaded: " << modelPath << std::endl;
    return true;
}

bool WhisperModel::IsLoaded() const {
    return m_ctx != nullptr;
}

whisper_context* WhisperModel::GetContext() const {
    return m_ctx;
}

const std::string& WhisperModel::GetPath() const {
    return m_modelPath;
}
