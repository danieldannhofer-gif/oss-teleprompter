#include "audio.h"

#include <vector>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <audioclient.h>
#include <mmdeviceapi.h>
#endif

namespace teleprompter {

#ifdef _WIN32

class AudioCapture::Impl {
public:
    IMMDeviceEnumerator* enumerator = nullptr;
    IMMDevice* device = nullptr;
    IAudioClient* client = nullptr;
    IAudioCaptureClient* capture = nullptr;
    HANDLE event = nullptr;
    WAVEFORMATEX* deviceFormat = nullptr;
    WAVEFORMATEX mixFormat{};
};

namespace {

std::vector<float> convertTo16kMono(const float* input, size_t frames,
                                    const WAVEFORMATEX& fmt) {
    std::vector<float> mono(frames);
    const uint32_t channels = fmt.nChannels;
    if (channels == 1) {
        for (size_t i = 0; i < frames; ++i) mono[i] = input[i];
    } else {
        for (size_t i = 0; i < frames; ++i) {
            float sum = 0.0f;
            for (uint32_t c = 0; c < channels; ++c) sum += input[i * channels + c];
            mono[i] = sum / static_cast<float>(channels);
        }
    }
    if (fmt.nSamplesPerSec == AudioCapture::kSampleRate) return mono;

    const double ratio = static_cast<double>(fmt.nSamplesPerSec) / AudioCapture::kSampleRate;
    const size_t outFrames = static_cast<size_t>(frames / ratio);
    std::vector<float> out(outFrames);
    for (size_t i = 0; i < outFrames; ++i) {
        const double srcPos = i * ratio;
        const size_t i0 = static_cast<size_t>(srcPos);
        const size_t i1 = (i0 + 1 < frames) ? i0 + 1 : i0;
        const double frac = srcPos - static_cast<double>(i0);
        out[i] = static_cast<float>(mono[i0] * (1.0 - frac) + mono[i1] * frac);
    }
    return out;
}

void captureLoop(AudioCapture::Impl* impl, AudioCallback callback,
                 std::atomic<bool>& running) {
    while (running.load()) {
        DWORD wait = WaitForSingleObject(impl->event, 200);
        if (wait != WAIT_OBJECT_0) continue;

        UINT32 packetFrames = 0;
        while (SUCCEEDED(impl->capture->GetNextPacketSize(&packetFrames)) &&
               packetFrames > 0) {
            BYTE* data = nullptr;
            UINT32 frames = 0;
            DWORD flags = 0;
            if (FAILED(impl->capture->GetBuffer(&data, &frames, &flags, nullptr, nullptr)))
                break;
            if (data && !(flags & AUDCLNT_BUFFERFLAGS_SILENT) && frames > 0) {
                auto* samples = reinterpret_cast<const float*>(data);
                std::vector<float> converted = convertTo16kMono(samples, frames, impl->mixFormat);
                if (!converted.empty()) callback(converted.data(), converted.size());
            }
            impl->capture->ReleaseBuffer(frames, flags);
        }
    }
}

}  // namespace

AudioCapture::~AudioCapture() { stop(); }

bool AudioCapture::start() {
    if (running_.load()) return true;
    impl_ = new Impl();
    bool ok = false;
    do {
        if (FAILED(CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
                                    __uuidof(IMMDeviceEnumerator),
                                    reinterpret_cast<void**>(&impl_->enumerator))))
            break;
        if (FAILED(impl_->enumerator->GetDefaultAudioEndpoint(eCapture, eConsole,
                                                              &impl_->device)))
            break;
        if (FAILED(impl_->device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr,
                                           reinterpret_cast<void**>(&impl_->client))))
            break;
        if (FAILED(impl_->client->GetMixFormat(&impl_->deviceFormat))) break;
        impl_->mixFormat = *impl_->deviceFormat;

        impl_->event = CreateEventW(nullptr, FALSE, FALSE, nullptr);
        if (!impl_->event) break;

        REFERENCE_TIME bufferDuration = 10000000;
        if (FAILED(impl_->client->Initialize(AUDCLNT_SHAREMODE_SHARED,
                                             AUDCLNT_STREAMFLAGS_EVENTCALLBACK,
                                             bufferDuration, 0, impl_->deviceFormat,
                                             nullptr)))
            break;
        if (FAILED(impl_->client->SetEventHandle(impl_->event))) break;
        if (FAILED(impl_->client->GetService(
                __uuidof(IAudioCaptureClient),
                reinterpret_cast<void**>(&impl_->capture))))
            break;
        if (FAILED(impl_->client->Start())) break;
        ok = true;
    } while (false);

    if (!ok) {
        cleanup();
        return false;
    }
    running_.store(true);
    thread_ = std::thread([this] { captureLoop(impl_, callback_, running_); });
    return true;
}

void AudioCapture::cleanup() {
    if (!impl_) return;
    if (impl_->client) impl_->client->Stop();
    if (impl_->capture) { impl_->capture->Release(); impl_->capture = nullptr; }
    if (impl_->client) { impl_->client->Release(); impl_->client = nullptr; }
    if (impl_->deviceFormat) {
        CoTaskMemFree(impl_->deviceFormat);
        impl_->deviceFormat = nullptr;
    }
    if (impl_->device) { impl_->device->Release(); impl_->device = nullptr; }
    if (impl_->enumerator) { impl_->enumerator->Release(); impl_->enumerator = nullptr; }
    if (impl_->event) { CloseHandle(impl_->event); impl_->event = nullptr; }
    delete impl_;
    impl_ = nullptr;
}

void AudioCapture::stop() {
    if (!running_.load()) return;
    running_.store(false);
    if (thread_.joinable()) thread_.join();
    cleanup();
}

void AudioCapture::setCallback(AudioCallback callback) { callback_ = std::move(callback); }

#else

AudioCapture::~AudioCapture() = default;
bool AudioCapture::start() { return false; }
void AudioCapture::stop() {}
void AudioCapture::setCallback(AudioCallback) {}

#endif

}  // namespace teleprompter
