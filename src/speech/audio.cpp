#include "speech/audio.h"
#ifdef _WIN32

#include <audioclient.h>
#include <mmdeviceapi.h>

namespace teleprompter {

namespace {

class MMDeviceEnumeratorGuard {
public:
    MMDeviceEnumeratorGuard() { CoInitializeEx(nullptr, COINIT_MULTITHREADED); }
    ~MMDeviceEnumeratorGuard() { CoUninitialize(); }
};

constexpr REFERENCE_TIME kBufferDuration = 10000000; // 1 second in 100ns units

} // namespace

AudioCapture::~AudioCapture() {
    Stop();
}

void AudioCapture::Start(AudioCallback callback) {
    if (running_.exchange(true)) return;
    thread_ = std::thread(&AudioCapture::CaptureLoop, this, std::move(callback));
}

void AudioCapture::Stop() {
    running_ = false;
    if (thread_.joinable()) thread_.join();
}

void AudioCapture::CaptureLoop(AudioCallback callback) {
    MMDeviceEnumeratorGuard com_guard;

    IMMDeviceEnumerator* enumerator = nullptr;
    if (FAILED(CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
                                __uuidof(IMMDeviceEnumerator),
                                reinterpret_cast<void**>(&enumerator)))) {
        running_ = false;
        return;
    }

    IMMDevice* device = nullptr;
    if (FAILED(enumerator->GetDefaultAudioEndpoint(eCapture, eConsole, &device))) {
        enumerator->Release();
        running_ = false;
        return;
    }

    IAudioClient* audio_client = nullptr;
    if (FAILED(device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr,
                                reinterpret_cast<void**>(&audio_client)))) {
        device->Release();
        enumerator->Release();
        running_ = false;
        return;
    }

    WAVEFORMATEX* device_format = nullptr;
    audio_client->GetMixFormat(&device_format);

    // We ask for the mix format and resample to 16 kHz mono f32 below.
    if (FAILED(audio_client->Initialize(AUDCLNT_SHAREMODE_SHARED, 0, kBufferDuration,
                                        0, device_format, nullptr))) {
        if (device_format) CoTaskMemFree(device_format);
        audio_client->Release();
        device->Release();
        enumerator->Release();
        running_ = false;
        return;
    }

    UINT32 buffer_frames = 0;
    audio_client->GetBufferSize(&buffer_frames);
    audio_client->Start();

    IAudioCaptureClient* capture_client = nullptr;
    audio_client->GetService(__uuidof(IAudioCaptureClient),
                             reinterpret_cast<void**>(&capture_client));

    const double src_rate = device_format ? device_format->nSamplesPerSec : 48000.0;
    const size_t dst_rate = 16000;

    while (running_.load()) {
        Sleep(30);

        UINT32 packet_frames = 0;
        if (FAILED(capture_client->GetNextPacketSize(&packet_frames)) || packet_frames == 0) {
            continue;
        }

        BYTE* data = nullptr;
        UINT32 frames = 0;
        DWORD flags = 0;
        if (FAILED(capture_client->GetBuffer(&data, &frames, &flags, nullptr, nullptr))) {
            continue;
        }

        // Simple linear resample to 16 kHz mono float.
        const size_t out_frames =
            static_cast<size_t>(frames * (dst_rate / src_rate));
        if (out_frames > 0 && data && !(flags & AUDCLNT_BUFFER_FLAGS_SILENT)) {
            std::vector<float> mono(frames);
            const size_t channels = device_format->nChannels;
            if (device_format->wFormatTag == WAVE_FORMAT_IEEE_FLOAT ||
                (device_format->wFormatTag == WAVE_FORMAT_EXTENSIBLE &&
                 reinterpret_cast<WAVEFORMATEXTENSIBLE*>(device_format)->SubFormat ==
                     __uuidof(KSDATAFORMAT_SUBTYPE_IEEE_FLOAT)) ||
                device_format->wBitsPerSample == 32) {
                const float* samples = reinterpret_cast<const float*>(data);
                for (UINT32 i = 0; i < frames; ++i) {
                    float acc = 0;
                    for (size_t ch = 0; ch < channels; ++ch) {
                        acc += samples[i * channels + ch];
                    }
                    mono[i] = acc / static_cast<float>(channels);
                }
            } else {
                std::fill(mono.begin(), mono.end(), 0.f);
            }

            std::vector<float> out(out_frames);
            for (size_t i = 0; i < out_frames; ++i) {
                const double pos = i * (src_rate / dst_rate);
                const size_t i0 = static_cast<size_t>(pos);
                const size_t i1 = std::min(i0 + 1, mono.size() - 1);
                const double frac = pos - static_cast<double>(i0);
                out[i] = static_cast<float>(mono[i0] * (1.0 - frac) + mono[i1] * frac);
            }
            if (callback) callback(out.data(), out.size());
        }

        capture_client->ReleaseBuffer(frames);
    }

    audio_client->Stop();
    if (capture_client) capture_client->Release();
    if (device_format) CoTaskMemFree(device_format);
    audio_client->Release();
    device->Release();
    enumerator->Release();
}

} // namespace teleprompter

#endif // _WIN32
