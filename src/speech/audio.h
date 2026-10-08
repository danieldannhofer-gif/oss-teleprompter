#pragma once
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>
#include <wrl/client.h>
#include <audioclient.h>
#include <mmdeviceapi.h>
#include <functional>
#include <vector>
#include <thread>
#include <atomic>
#include <mutex>

using Microsoft::WRL::ComPtr;

// Audio capture using WASAPI
// Captures microphone audio at 16kHz, mono, float32 (Whisper's expected format)

class AudioCapture {
public:
    using AudioCallback = std::function<void(const float* samples, size_t count)>;

    AudioCapture();
    ~AudioCapture();

    // Start capturing audio from the default microphone
    bool Start();

    // Stop capturing
    void Stop();

    // Check if currently capturing
    bool IsCapturing() const;

    // Set the callback for audio data
    void SetCallback(AudioCallback callback);

private:
    void CaptureThreadProc();

    ComPtr<IMMDeviceEnumerator> m_deviceEnumerator;
    ComPtr<IMMDevice> m_device;
    ComPtr<IAudioClient> m_audioClient;
    ComPtr<IAudioCaptureClient> m_captureClient;

    HANDLE m_sampleReadyEvent = nullptr;
    std::thread m_captureThread;
    std::atomic<bool> m_isCapturing{false};
    std::mutex m_callbackMutex;
    AudioCallback m_callback;

    UINT32 m_bufferFrameCount = 0;
};
