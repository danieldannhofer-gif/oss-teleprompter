#include "ipc.h"
#include "webview.h"
#include "window.h"
#include "speech/recognizer.h"
#include <string>
#include <cwchar>
#include <memory>
#include <sstream>
#include <filesystem>

// Forward declaration from main.cpp
extern HWND g_mainWindow;

// Speech recognizer instance
static std::unique_ptr<SpeechRecognizer> g_recognizer;

void SendToFrontend(const wchar_t* jsonMessage) {
    SendMessageToWeb(jsonMessage);
}

// Helper: send transcript to frontend
static void SendTranscriptToFrontend(const std::string& text, bool isFinal) {
    std::wstringstream wss;
    wss << L"{\"type\":\"speech:transcript\",\"text\":\"" << std::wstring(text.begin(), text.end())
        << L"\",\"is_final\":" << (isFinal ? L"true" : L"false") << L"}";
    SendToFrontend(wss.str().c_str());
}

void HandleWebMessage(const wchar_t* message) {
    std::wstring msg(message);

    // Overlay messages
    if (msg.find(L"\"type\":\"overlay:toggle\"") != std::wstring::npos) {
        bool enabled = msg.find(L"\"enabled\":true") != std::wstring::npos;
        SetOverlay(g_mainWindow, enabled);
    }
    else if (msg.find(L"\"type\":\"overlay:clickThrough\"") != std::wstring::npos) {
        bool enabled = msg.find(L"\"enabled\":true") != std::wstring::npos;
        SetClickThrough(g_mainWindow, enabled);
    }
    else if (msg.find(L"\"type\":\"overlay:alwaysOnTop\"") != std::wstring::npos) {
        bool enabled = msg.find(L"\"enabled\":true") != std::wstring::npos;
        SetAlwaysOnTop(g_mainWindow, enabled);
    }
    // Dock messages: {"type":"window:dock","position":"top","heightPercent":60}
    else if (msg.find(L"\"type\":\"window:dock\"") != std::wstring::npos) {
        // Extract position
        std::string position = "none";
        size_t posPos = msg.find(L"\"position\":\"");
        if (posPos != std::wstring::npos) {
            posPos += 12;
            size_t endPos = msg.find(L"\"", posPos);
            if (endPos != std::wstring::npos) {
                std::wstring wpos = msg.substr(posPos, endPos - posPos);
                position = std::string(wpos.begin(), wpos.end());
            }
        }
        // Extract heightPercent
        int heightPercent = 60;
        size_t hPos = msg.find(L"\"heightPercent\":");
        if (hPos != std::wstring::npos) {
            hPos += 16;
            heightPercent = std::stoi(msg.substr(hPos));
        }
        SetDock(g_mainWindow, position.c_str(), heightPercent);
    }
    // Speech messages
    else if (msg.find(L"\"type\":\"speech:start\"") != std::wstring::npos) {
        if (!g_recognizer) {
            g_recognizer = std::make_unique<SpeechRecognizer>();
            std::string modelPath = GetDefaultModelPath();
            if (!g_recognizer->LoadModel(modelPath)) {
                SendToFrontend(L"{\"type\":\"speech:error\",\"message\":\"Failed to load Whisper model\"}");
                g_recognizer.reset();
                return;
            }
            g_recognizer->SetCallback([](const TranscriptResult& result) {
                SendTranscriptToFrontend(result.text, result.is_final);
            });
        }
        if (g_recognizer->Start()) {
            SendToFrontend(L"{\"type\":\"speech:started\"}");
        } else {
            SendToFrontend(L"{\"type\":\"speech:error\",\"message\":\"Failed to start recognition\"}");
        }
    }
    else if (msg.find(L"\"type\":\"speech:stop\"") != std::wstring::npos) {
        if (g_recognizer) {
            g_recognizer->Stop();
            SendToFrontend(L"{\"type\":\"speech:stopped\"}");
        }
    }
    else if (msg.find(L"\"type\":\"speech:setLanguage\"") != std::wstring::npos) {
        // Extract language value: {"type":"speech:setLanguage","lang":"de"}
        size_t langPos = msg.find(L"\"lang\":\"");
        if (langPos != std::wstring::npos) {
            langPos += 8; // skip "lang":"
            size_t endPos = msg.find(L"\"", langPos);
            if (endPos != std::wstring::npos) {
                std::wstring wlang = msg.substr(langPos, endPos - langPos);
                std::string lang(wlang.begin(), wlang.end());
                if (g_recognizer) {
                    g_recognizer->SetLanguage(lang);
                }
            }
        }
    }
    // Additional message types will be added in later tasks:
    // - script:match
    // - settings:get, settings:set
}

// Callback function that matches the WebMessageCallback typedef
static void OnWebMessageReceived(const wchar_t* message) {
    HandleWebMessage(message);
}

void InitIPC(HWND hwnd) {
    SetWebMessageCallback(OnWebMessageReceived);
}

bool InitSpeech(const std::string& modelPath) {
    g_recognizer = std::make_unique<SpeechRecognizer>();
    return g_recognizer->LoadModel(modelPath);
}

std::string GetDefaultModelPath() {
    // Model is expected next to the executable or in a "models" subfolder
    char exePath[MAX_PATH];
    GetModuleFileNameA(nullptr, exePath, MAX_PATH);
    std::filesystem::path exeDir = std::filesystem::path(exePath).parent_path();

    // Check models/ subfolder first
    auto modelPath = exeDir / "models" / "ggml-base.bin";
    if (std::filesystem::exists(modelPath)) {
        return modelPath.string();
    }

    // Check next to executable
    modelPath = exeDir / "ggml-base.bin";
    if (std::filesystem::exists(modelPath)) {
        return modelPath.string();
    }

    // Return default path (will fail to load if not present)
    return (exeDir / "models" / "ggml-base.bin").string();
}
