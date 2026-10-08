#include "audio.h"
#include <wrl/client.h>
#include <avrt.h>
#include <iostream>

using Microsoft::WRL::ComPtr;

AudioCapture::AudioCapture() {
    // Initialize COM for this thread
    CoInitializeEx(nullptr, COINIT_MULTITHREADED);

    // Create device enumerator
    HRESULT hr = CoCreateInstance(
        __uuidof(MMDeviceEnumerator),
        nullptr,
        CLSCTX_ALL,
        __uuidof(IMMDeviceEnumerator),
        reinterpret_cast<void**>(m_deviceEnumerator.GetAddressOf())
    );

    if (FAILED(hr)) {
        std::cerr << "Failed to create device enumerator: " << std::hex << hr << std::endl;
    }
}

AudioCapture::~AudioCapture() {
    Stop();
    CoUninitialize();
}

bool AudioCapture::Start() {
    if (m_isCapturing) return true;
    if (!m_deviceEnumerator) return false;

    // Get default audio endpoint (microphone)
    HRESULT hr = m_deviceEnumerator->GetDefaultAudioEndpoint(
        eCapture, eConsole, m_device.GetAddressOf()
    );
    if (FAILED(hr)) {
        std::cerr << "Failed to get default audio endpoint: " << std::hex << hr << std::endl;
        return false;
    }

    // Activate audio client
    hr = m_device->Activate(
        __uuidof(IAudioClient),
        CLSCTX_ALL,
        nullptr,
        reinterpret_cast<void**>(m_audioClient.GetAddressOf())
    );
    if (FAILED(hr)) {
        std::cerr << "Failed to activate audio client: " << std::hex << hr << std::endl;
        return false;
    }

    // Get mix format
    WAVEFORMATEX* pWaveFormat = nullptr;
    hr = m_audioClient->GetMixFormat(&pWaveFormat);
    if (FAILED(hr)) {
        std::cerr << "Failed to get mix format: " << std::hex << hr << std::endl;
        return false;
    }

    // Configure for 16kHz, mono, float32 (Whisper's expected format)
    WAVEFORMATEXTENSIBLE wfx = {};
    wfx.Format.wFormatTag = WAVE_FORMAT_EXTENSIBLE;
    wfx.Format.nChannels = 1;
    wfx.Format.nSamplesPerSec = 16000;
    wfx.Format.wBitsPerSample = 32;
    wfx.Format.nBlockAlign = wfx.Format.nChannels * wfx.Format.wBitsPerSample / 8;
    wfx.Format.nAvgBytesPerSec = wfx.Format.nSamplesPerSec * wfx.Format.nBlockAlign;
    wfx.Format.cbSize = sizeof(WAVEFORMATEXTENSIBLE) - sizeof(WAVEFORMATEX);
    wfx.Samples.wValidBitsPerSample = 32;
    wfx.dwChannelMask = 0;
    wfx.SubFormat = KSDATAFORMAT_SUBTYPE_IEEE_FLOAT;

    // Check if the format is supported, otherwise use the mix format
    WAVEFORMATEX* pClosestFormat = nullptr;
    hr = m_audioClient->IsFormatSupported(
        AUDCLNT_SHAREMODE_SHARED,
        reinterpret_cast<WAVEFORMATEX*>(&wfx),
        &pClosestFormat
    );

    WAVEFORMATEX* pUseFormat = nullptr;
    if (hr == S_OK) {
        pUseFormat = reinterpret_cast<WAVEFORMATEX*>(&wfx);
    } else if (pClosestFormat) {
        pUseFormat = pClosestFormat;
    } else {
        pUseFormat = pWaveFormat;
    }

    // Initialize audio client
    REFERENCE_TIME hnsBufferDuration = 1000000; // 100ms buffer
    hr = m_audioClient->Initialize(
        AUDCLNT_SHAREMODE_SHARED,
        AUDCLNT_STREAMFLAGS_EVENTCALLBACK,
        hnsBufferDuration,
        0,
        pUseFormat,
        nullptr
    );
    if (FAILED(hr)) {
        std::cerr << "Failed to initialize audio client: " << std::hex << hr << std::endl;
        CoTaskMemFree(pWaveFormat);
        if (pClosestFormat) CoTaskMemFree(pClosestFormat);
        return false;
    }

    // Get buffer size
    hr = m_audioClient->GetBufferSize(&m_bufferFrameCount);
    if (FAILED(hr)) {
        std::cerr << "Failed to get buffer size: " << std::hex << hr << std::endl;
        CoTaskMemFree(pWaveFormat);
        if (pClosestFormat) CoTaskMemFree(pClosestFormat);
        return false;
    }

    // Create event for buffer ready notification
    m_sampleReadyEvent = CreateEvent(nullptr, FALSE, FALSE, nullptr);
    if (!m_sampleReadyEvent) {
        CoTaskMemFree(pWaveFormat);
        if (pClosestFormat) CoTaskMemFree(pClosestFormat);
        return false;
    }

    hr = m_audioClient->SetEventHandle(m_sampleReadyEvent);
    if (FAILED(hr)) {
        std::cerr << "Failed to set event handle: " << std::hex << hr << std::endl;
        CloseHandle(m_sampleReadyEvent);
        m_sampleReadyEvent = nullptr;
        CoTaskMemFree(pWaveFormat);
        if (pClosestFormat) CoTaskMemFree(pClosestFormat);
        return false;
    }

    // Get capture client
    hr = m_audioClient->GetService(
        __uuidof(IAudioCaptureClient),
        reinterpret_cast<void**>(m_captureClient.GetAddressOf())
    );
    if (FAILED(hr)) {
        std::cerr << "Failed to get capture client: " << std::hex << hr << std::endl;
        CloseHandle(m_sampleReadyEvent);
        m_sampleReadyEvent = nullptr;
        CoTaskMemFree(pWaveFormat);
        if (pClosestFormat) CoTaskMemFree(pClosestFormat);
        return false;
    }

    CoTaskMemFree(pWaveFormat);
    if (pClosestFormat) CoTaskMemFree(pClosestFormat);

    // Start audio client
    hr = m_audioClient->Start();
    if (FAILED(hr)) {
        std::cerr << "Failed to start audio client: " << std::hex << hr << std::endl;
        return false;
    }

    // Start capture thread
    m_isCapturing = true;
    m_captureThread = std::thread(&AudioCapture::CaptureThreadProc, this);

    return true;
}

void AudioCapture::Stop() {
    if (!m_isCapturing) return;

    m_isCapturing = false;

    if (m_captureThread.joinable()) {
        m_captureThread.join();
    }

    if (m_audioClient) {
        m_audioClient->Stop();
    }

    if (m_sampleReadyEvent) {
        CloseHandle(m_sampleReadyEvent);
        m_sampleReadyEvent = nullptr;
    }

    m_captureClient.Reset();
    m_audioClient.Reset();
    m_device.Reset();
}

bool AudioCapture::IsCapturing() const {
    return m_isCapturing;
}

void AudioCapture::SetCallback(AudioCallback callback) {
    std::lock_guard<std::mutex> lock(m_callbackMutex);
    m_callback = callback;
}

void AudioCapture::CaptureThreadProc() {
    // Set thread priority to real-time for audio
    HANDLE hTask = AvSetMmThreadCharacteristics(L"Pro Audio", nullptr);

    std::vector<float> buffer;

    while (m_isCapturing) {
        // Wait for buffer ready event (with timeout)
        DWORD waitResult = WaitForSingleObject(m_sampleReadyEvent, 100);
        if (waitResult != WAIT_OBJECT_0) {
            continue;
        }

        UINT32 packetCount = 0;
        HRESULT hr = m_captureClient->GetNextPacketSize(&packetCount);
        if (FAILED(hr)) continue;

        while (packetCount > 0) {
            BYTE* pData = nullptr;
            UINT32 framesAvailable = 0;
            DWORD flags = 0;

            hr = m_captureClient->GetBuffer(&pData, &framesAvailable, &flags, nullptr, nullptr);
            if (FAILED(hr)) break;

            if (flags & AUDCLNT_BUFFERFLAGS_SILENT) {
                // Silent buffer, skip
                m_captureClient->ReleaseBuffer(framesAvailable);
                packetCount--;
                continue;
            }

            // Copy audio data (assuming float32 format)
            size_t sampleCount = framesAvailable; // mono = 1 sample per frame
            buffer.resize(sampleCount);
            memcpy(buffer.data(), pData, sampleCount * sizeof(float));

            m_captureClient->ReleaseBuffer(framesAvailable);

            // Invoke callback
            {
                std::lock_guard<std::mutex> lock(m_callbackMutex);
                if (m_callback) {
                    m_callback(buffer.data(), buffer.size());
                }
            }

            packetCount--;
        }
    }

    if (hTask) {
        AvRevertMmThreadCharacteristics(hTask);
    }
}
