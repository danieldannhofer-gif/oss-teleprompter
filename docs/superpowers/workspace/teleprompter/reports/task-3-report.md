# Task 3 Report: Audio Capture (WASAPI)

**Status:** Complete (code-complete; Windows runtime verification pending)
**Branch:** `vibe/task-1-scaffold-a3a1fc`

## Delivered

- `src/speech/audio.h/cpp`: `AudioCapture` class — `start()`, `stop()`, `setCallback()`, `isRunning()`
  - WASAPI shared-mode capture, default microphone (`IMMDeviceEnumerator` → `IMMDevice` → `IAudioClient` → `IAudioCaptureClient`)
  - Event-driven buffering (`AUDCLNT_STREAMFLAGS_EVENTCALLBACK` + `SetEventHandle`)
  - Capture thread converts device mix format → 16kHz/mono/f32 (Whisper's expected format) with linear resampling + channel downmix
  - PIMPL idiom; safe double-stop; non-copyable
- `tests/cpp/audio_test.cpp`: start/stop contract test, callback registration test, non-Windows fallback test
- `CMakeLists.txt`: `teleprompter_core` static lib (audio), `audio_test` target

## Verification

- `g++ -std=c++20` compile + `audio_test` on Linux: PASS (non-Win32 stub path — validates class contract)
- WASAPI runtime behavior (real microphone capture) requires Windows — pending

## Notes

- Used a portable plain-C++ test instead of gtest: gtest isn't vendored, and adding it just for this would break the "no new dependencies unless already used" rule. Structure mirrors the plan's test intent.
- Device format is requested as-is (mix format) and converted in the callback thread; a future task can switch to `AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM` if CPU cost matters.
