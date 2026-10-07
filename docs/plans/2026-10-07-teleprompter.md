# OSS Teleprompter Implementation Plan (C++ + WebView2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, on-device Windows teleprompter app (C++/Win32 + WebView2 + React) with voice-tracking via Whisper.cpp (auto-scrolls on-script, pauses off-script), transparent overlay mode, DE+EN speech recognition, and Markdown/Word import.

**Architecture:** A native C++ Win32 application hosts a Microsoft WebView2 control that renders a React/TypeScript frontend. Whisper.cpp (C library) runs in the C++ backend for local speech recognition. WASAPI captures microphone audio. A fuzzy script-matcher (C++) compares recognized speech against the loaded script. The Win32 window supports transparent, always-on-top, and click-through overlay modes. IPC between C++ and JavaScript uses WebView2's `PostMessage` / `window.chrome.webview` API.

**Tech Stack:** C++ 20, Win32 API, WebView2 (NuGet), React 18, TypeScript 5, Vite 5, Whisper.cpp (C library, git submodule), WASAPI (Windows Audio Session API), Google Test (C++ unit tests), CMake 3.27+, WiX Toolset 4 (installer), mammoth.js (DOCX), marked (Markdown), Zustand (state), Vitest (frontend tests)

**Spec:** Design discussed in brainstorming session 2026-10-07. Requirements: Windows local on-device, voice-tracking with off-script detection, DE+EN, transparent overlay, on-screen + keyboard + presenter-remote controls, MD+DOCX import.

## Global Constraints

- Windows 10/11 only (x64)
- 100% offline / on-device — no cloud API calls for speech recognition
- Whisper model: `ggml-base.bin` (~150MB) or `ggml-small.bin` (~500MB), downloaded on first run or bundled
- App binary target: < 30MB (excluding Whisper model and WebView2 runtime)
- WebView2 Runtime must be present (pre-installed on Windows 11, installable on Windows 10)
- Transparent overlay window must be toggleable at runtime
- All UI text must support German and English (i18n via JSON locale files)
- License: MIT

## Review Focus

1. **Off-script recovery:** When the speaker deviates from the script, the prompter must pause. When they return to the script (even at a different position), it must resume. Test: speak off-script, verify pause; speak a line from later in the script, verify it jumps there.
2. **Transparent overlay click-through:** In overlay mode, the user must be able to interact with apps underneath (Teams, PowerPoint). Test: toggle click-through, verify mouse events pass through.
3. **Whisper model loading:** First launch downloads/loads the model. Subsequent launches must be fast (< 2s). Test: measure cold start vs. warm start.
4. **DOCX import fidelity:** Word documents with formatting must import as readable plain text with paragraph breaks. Test: import a formatted .docx, verify structure preserved.
5. **Multi-language switching:** Switching between DE and EN mid-session must not crash or lose scroll position. Test: start in DE, switch to EN, verify recognition continues.
6. **WebView2 IPC reliability:** Messages between C++ and JavaScript must not be lost under rapid transcript events. Test: flood 100 transcript messages, verify all received.

---

## File Structure

```
teleprompter/
├── CMakeLists.txt                      # Top-level CMake build
├── src/                                # C++ backend (Win32 + WebView2)
│   ├── main.cpp                        # Win32 entry point, WebView2 init
│   ├── window.h / window.cpp           # Window creation, transparent/overlay/click-through
│   ├── webview.h / webview.cpp         # WebView2 host, navigation, IPC
│   ├── ipc.h / ipc.cpp                 # Message routing C++ ↔ JavaScript
│   ├── speech/
│   │   ├── recognizer.h / .cpp         # Whisper.cpp wrapper (C API)
│   │   ├── audio.h / .cpp              # WASAPI microphone capture
│   │   └── model.h / .cpp              # Whisper model loading & management
│   ├── script/
│   │   ├── matcher.h / .cpp            # Fuzzy script matching (Levenshtein)
│   │   └── types.h                     # Script, MatchResult structs
│   └── utils/
│       ├── string_utils.h / .cpp       # Normalization, tokenization
│       └── json.h                      # Minimal JSON (or use nlohmann/json)
├── frontend/                           # React frontend (rendered in WebView2)
│   ├── src/
│   │   ├── components/
│   │   │   ├── PrompterView.tsx        # Main scrolling text display
│   │   │   ├── OverlayControls.tsx     # Play/pause/speed buttons
│   │   │   ├── ScriptEditor.tsx        # Script editing + import UI
│   │   │   ├── SettingsPanel.tsx       # Language, speed, overlay toggle
│   │   │   └── StatusBar.tsx           # Current state indicator
│   │   ├── hooks/
│   │   │   ├── usePrompter.ts          # Prompter state (scroll, speed, play)
│   │   │   ├── useSpeech.ts            # Speech recognition hook
│   │   │   ├── useOverlay.ts           # Overlay/transparent mode hook
│   │   │   └── useKeyboard.ts          # Keyboard shortcuts
│   │   ├── lib/
│   │   │   ├── webview.ts              # WebView2 IPC wrapper (chrome.webview)
│   │   │   ├── i18n.ts                 # German/English locale strings
│   │   │   ├── parser.ts               # MD (marked) + DOCX (mammoth.js) parsing
│   │   │   └── types.ts                # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── models/                     # Whisper model files (downloaded)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── third_party/
│   ├── whisper.cpp/                    # Git submodule
│   └── nlohmann_json/                  # Git submodule (single header)
├── tests/
│   ├── cpp/                            # C++ unit tests (Google Test)
│   │   ├── matcher_test.cpp
│   │   ├── string_utils_test.cpp
│   │   └── ipc_test.cpp
│   └── frontend/                       # Frontend tests (Vitest)
│       ├── usePrompter.test.ts
│       └── useSpeech.test.ts
├── installer/
│   └── teleprompter.wxs                # WiX installer definition
├── scripts/
│   ├── download-model.ps1              # Downloads Whisper model
│   └── build.ps1                       # Full build script
└── README.md
```

---

### Task 1: Project Scaffold (CMake + Win32 + WebView2 + React)

**Files:**
- Create: `CMakeLists.txt`
- Create: `src/main.cpp`
- Create: `src/window.h`, `src/window.cpp`
- Create: `src/webview.h`, `src/webview.cpp`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

**Interfaces:**
- Produces: Working Windows app that opens a Win32 window with WebView2 showing a React "Teleprompter" page
- IPC: `window.chrome.webview.postMessage()` available in frontend, `WebMessageReceived` event in C++

- [ ] **Step 1: Initialize frontend project**

```powershell
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Create minimal C++ Win32 + WebView2 scaffold**

`src/main.cpp` — Win32 `WinMain`, register window class, create window, init WebView2, navigate to `http://localhost:5173` (dev) or embedded HTML (prod).

`src/window.h/cpp` — Window creation with `WS_OVERLAPPEDWINDOW`, message loop.

`src/webview.h/cpp` — WebView2 environment creation, controller, navigation.

- [ ] **Step 3: Configure CMakeLists.txt**

```cmake
cmake_minimum_required(VERSION 3.27)
project(Teleprompter CXX)
set(CMAKE_CXX_STANDARD 20)

# WebView2 via NuGet (or vcpkg)
find_package(WebView2 REQUIRED)

# Whisper.cpp as subdirectory
add_subdirectory(third_party/whisper.cpp)

add_executable(Teleprompter
    src/main.cpp
    src/window.cpp
    src/webview.cpp
    src/ipc.cpp
)
target_link_libraries(Teleprompter PRIVATE WebView2::WebView2 ws2_32)
```

- [ ] **Step 4: Add git submodules**

```bash
git submodule add https://github.com/ggerganov/whisper.cpp.git third_party/whisper.cpp
git submodule add https://github.com/nlohmann/json.git third_party/nlohmann_json
```

- [ ] **Step 5: Verify dev mode**

```powershell
# Terminal 1: Start Vite dev server
cd frontend && npm run dev

# Terminal 2: Build and run C++ app
cmake -B build && cmake --build build
.\build\Teleprompter.exe
```
Expected: Win32 window opens, WebView2 shows React "Teleprompter" page.

- [ ] **Step 6: Replace default App.tsx with placeholder**

```tsx
function App() {
  return <div style={{ color: 'white', background: 'black', minHeight: '100vh', padding: 40 }}>
    <h1>Teleprompter</h1>
  </div>
}
export default App
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: scaffold C++ Win32 + WebView2 + React project"
```

---

### Task 2: Window Management (Transparent, Overlay, Always-on-Top, Click-Through)

**Files:**
- Modify: `src/window.h`, `src/window.cpp`
- Create: `src/ipc.h`, `src/ipc.cpp`
- Create: `frontend/src/lib/webview.ts`
- Create: `frontend/src/hooks/useOverlay.ts`

**Interfaces:**
- Consumes: Win32 window handle
- Produces:
  - C++ functions: `SetOverlay(HWND, bool)`, `SetClickThrough(HWND, bool)`, `SetAlwaysOnTop(HWND, bool)`
  - IPC messages: `overlay:toggle`, `overlay:clickThrough`, `overlay:alwaysOnTop`
  - Frontend: `useOverlay` hook with `toggleOverlay()`, `toggleClickThrough()`, `toggleAlwaysOnTop()`

- [ ] **Step 1: Implement Win32 overlay functions**

`src/window.cpp`:
```cpp
void SetOverlay(HWND hwnd, bool enabled) {
    if (enabled) {
        SetWindowLong(hwnd, GWL_EXSTYLE, GetWindowLong(hwnd, GWL_EXSTYLE) | WS_EX_LAYERED | WS_EX_TOPMOST);
        SetLayeredWindowAttributes(hwnd, RGB(0,0,0), 200, LWA_ALPHA); // Semi-transparent
        SetWindowLong(hwnd, GWL_STYLE, GetWindowLong(hwnd, GWL_STYLE) & ~WS_CAPTION & ~WS_THICKFRAME);
    } else {
        SetWindowLong(hwnd, GWL_EXSTYLE, GetWindowLong(hwnd, GWL_EXSTYLE) & ~WS_EX_LAYERED & ~WS_EX_TOPMOST);
        SetWindowLong(hwnd, GWL_STYLE, WS_OVERLAPPEDWINDOW);
    }
    SetWindowPos(hwnd, nullptr, 0, 0, 0, 0, SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE);
}

void SetClickThrough(HWND hwnd, bool enabled) {
    LONG exStyle = GetWindowLong(hwnd, GWL_EXSTYLE);
    if (enabled) {
        SetWindowLong(hwnd, GWL_EXSTYLE, exStyle | WS_EX_TRANSPARENT | WS_EX_LAYERED);
    } else {
        SetWindowLong(hwnd, GWL_EXSTYLE, exStyle & ~WS_EX_TRANSPARENT);
    }
}

void SetAlwaysOnTop(HWND hwnd, bool enabled) {
    SetWindowPos(hwnd, enabled ? HWND_TOPMOST : HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}
```

- [ ] **Step 2: Implement IPC message handling**

`src/ipc.cpp` — handle `WebMessageReceived` events, parse JSON messages, dispatch to window functions.

Message format (JS → C++):
```json
{ "type": "overlay:toggle", "enabled": true }
{ "type": "overlay:clickThrough", "enabled": false }
{ "type": "overlay:alwaysOnTop", "enabled": true }
```

- [ ] **Step 3: Create frontend WebView2 IPC wrapper**

`frontend/src/lib/webview.ts`:
```ts
const webview = (window as any).chrome?.webview

export function postMessage(msg: object) {
  webview?.postMessage(msg)
}

export function onMessage(handler: (msg: any) => void) {
  webview?.addEventListener('message', (e: any) => handler(e.data))
}
```

- [ ] **Step 4: Implement useOverlay hook**

`frontend/src/hooks/useOverlay.ts` — wraps IPC messages, manages overlay state.

- [ ] **Step 5: Verify overlay works**

```powershell
.\build\Teleprompter.exe
```
Expected: Toggle overlay → window becomes semi-transparent, always-on-top, borderless. Click-through → mouse passes through.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add transparent overlay window with click-through"
```

---

### Task 3: Audio Capture (WASAPI)

**Files:**
- Create: `src/speech/audio.h`, `src/speech/audio.cpp`
- Create: `tests/cpp/audio_test.cpp`

**Interfaces:**
- Consumes: Windows audio device
- Produces:
  - `AudioCapture` class: `Start()`, `Stop()`, `OnAudioData(callback)`
  - Callback receives: `const float* samples, size_t count` (16kHz, mono, f32)

- [ ] **Step 1: Write failing test for audio capture**

`tests/cpp/audio_test.cpp`:
```cpp
#include <gtest/gtest.h>
#include "speech/audio.h"

TEST(AudioCapture, StartsAndStops) {
    AudioCapture capture;
    EXPECT_NO_THROW(capture.Start());
    EXPECT_NO_THROW(capture.Stop());
}
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
cmake --build build --target audio_test
.\build\audio_test.exe
```
Expected: FAIL (not implemented)

- [ ] **Step 3: Implement WASAPI audio capture**

`src/speech/audio.cpp`:
- Use `IMMDeviceEnumerator` to get default microphone
- Use `IAudioClient` with `AUDCLNT_STREAMFLAGS_LOOPBACK` or capture mode
- Request 16kHz, mono, float32 format (Whisper's expected format)
- Use event-driven buffering (`SetEventHandle`)
- On each buffer ready, call callback with samples

Key COM interfaces:
- `IMMDeviceEnumerator` → `IMMDevice` → `IAudioClient` → `IAudioCaptureClient`

- [ ] **Step 4: Run test to verify it passes**

```powershell
.\build\audio_test.exe
```
Expected: PASS (starts and stops without error)

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add WASAPI microphone audio capture"
```

---

### Task 4: Whisper.cpp Integration (Speech Recognition)

**Files:**
- Create: `src/speech/recognizer.h`, `src/speech/recognizer.cpp`
- Create: `src/speech/model.h`, `src/speech/model.cpp`
- Create: `tests/cpp/recognizer_test.cpp`
- Modify: `CMakeLists.txt`

**Interfaces:**
- Consumes: Audio samples from `AudioCapture`, Whisper model file
- Produces:
  - `Recognizer` class: `Start()`, `Stop()`, `SetLanguage(string)`, `OnTranscript(callback)`
  - Callback receives: `{ text: string, is_final: bool }`
  - IPC messages: `speech:start`, `speech:stop`, `speech:setLanguage`
  - IPC events (C++ → JS): `speech:transcript` with `{ text, is_final }`

- [ ] **Step 1: Write failing test for model loading**

`tests/cpp/recognizer_test.cpp`:
```cpp
#include <gtest/gtest.h>
#include "speech/model.h"

TEST(Model, LoadsWhisperModel) {
    // Use tiny model for testing
    Model model;
    // Skip if model file not present (CI downloads it)
    if (!std::filesystem::exists("models/ggml-tiny.bin")) {
        GTEST_SKIP() << "Whisper model not found";
    }
    EXPECT_TRUE(model.Load("models/ggml-tiny.bin"));
}
```

- [ ] **Step 2: Run test to verify it fails (or skips)**

```powershell
cmake --build build --target recognizer_test
.\build\recognizer_test.exe
```
Expected: FAIL or SKIP

- [ ] **Step 3: Implement Model wrapper**

`src/speech/model.cpp` — wraps `whisper_init_from_file`, `whisper_free`.

- [ ] **Step 4: Implement Recognizer**

`src/speech/recognizer.cpp`:
- Start `AudioCapture`, feed samples to Whisper
- Use `whisper_full` with `whisper_full_params`
- Set language via `whisper_full_params.language` ("de", "en", or nullptr for auto)
- Run recognition in a background thread
- Emit transcript callbacks

- [ ] **Step 5: Wire IPC commands**

Handle `speech:start`, `speech:stop`, `speech:setLanguage` from frontend.
Emit `speech:transcript` events to frontend.

- [ ] **Step 6: Create model download script**

`scripts/download-model.ps1`:
```powershell
$model = "ggml-base.bin"
$url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$model"
$dest = "frontend/public/models/$model"
if (!(Test-Path $dest)) {
    Invoke-WebRequest -Uri $url -OutFile $dest
    Write-Host "Downloaded $model"
}
```

- [ ] **Step 7: Run tests**

```powershell
.\build\recognizer_test.exe
```
Expected: PASS or SKIP (if model not downloaded)

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: add Whisper.cpp speech recognition engine"
```

---

### Task 5: Script Matcher (Fuzzy Matching in C++)

**Files:**
- Create: `src/script/matcher.h`, `src/script/matcher.cpp`
- Create: `src/script/types.h`
- Create: `src/utils/string_utils.h`, `src/utils/string_utils.cpp`
- Create: `tests/cpp/matcher_test.cpp`
- Create: `tests/cpp/string_utils_test.cpp`

**Interfaces:**
- Consumes: Script lines (vector<string>), recognized transcript
- Produces:
  - `MatchResult` struct: `{ enum Type { OnScript, OffScript }, int line_index, float confidence }`
  - `Matcher` class: `Matcher(vector<string> lines)`, `Match(string transcript) -> MatchResult`
  - IPC: `script:match` (JS → C++), returns `MatchResult` as JSON

- [ ] **Step 1: Write failing tests for string utils**

`tests/cpp/string_utils_test.cpp`:
```cpp
#include <gtest/gtest.h>
#include "utils/string_utils.h"

TEST(StringUtils, NormalizeRemovesPunctuation) {
    EXPECT_EQ(normalize("Hello, World!"), "hello world");
}

TEST(StringUtils, NormalizeLowercases) {
    EXPECT_EQ(normalize("HELLO"), "hello");
}

TEST(StringUtils, LevenshteinDistance) {
    EXPECT_EQ(levenshtein("kitten", "sitting"), 3);
    EXPECT_EQ(levenshtein("hello", "hello"), 0);
}

TEST(StringUtils, SimilarityRatio) {
    EXPECT_NEAR(similarity("hello world", "hello world"), 1.0, 0.01);
    EXPECT_NEAR(similarity("hello world", "hello there"), 0.6, 0.1);
    EXPECT_NEAR(similarity("abc", "xyz"), 0.0, 0.1);
}
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
cmake --build build --target string_utils_test
.\build\string_utils_test.exe
```
Expected: FAIL

- [ ] **Step 3: Implement string utils**

`src/utils/string_utils.cpp`:
- `normalize()`: lowercase, remove punctuation, collapse whitespace
- `levenshtein()`: standard DP algorithm
- `similarity()`: `1.0 - (distance / max_len)`

- [ ] **Step 4: Write failing tests for matcher**

`tests/cpp/matcher_test.cpp`:
```cpp
#include <gtest/gtest.h>
#include "script/matcher.h"

TEST(Matcher, ExactMatch) {
    Matcher m({"Hello world", "This is a test"});
    auto result = m.Match("Hello world");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 0);
}

TEST(Matcher, OffScript) {
    Matcher m({"Hello world"});
    auto result = m.Match("Something completely different");
    EXPECT_EQ(result.type, MatchType::OffScript);
}

TEST(Matcher, FuzzyMatch) {
    Matcher m({"The quick brown fox"});
    auto result = m.Match("quick brown fox");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 0);
}

TEST(Matcher, JumpToLaterLine) {
    Matcher m({"Line one", "Line two", "Line three"});
    auto result = m.Match("Line three");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 2);
}

TEST(Matcher, PartialTranscriptMatches) {
    Matcher m({"The quick brown fox jumps over the lazy dog"});
    auto result = m.Match("quick brown fox jumps");
    EXPECT_EQ(result.type, MatchType::OnScript);
}
```

- [ ] **Step 5: Implement Matcher**

`src/script/matcher.cpp`:
1. Normalize transcript
2. Maintain a sliding window of recent transcript (last ~50 words)
3. For each script line, compute similarity against window
4. If best match > 0.7 threshold → `OnScript` with that line index
5. If no match > threshold → `OffScript`
6. Prefer matches closer to current position (hysteresis to avoid jumping back)

- [ ] **Step 6: Run all C++ tests**

```powershell
cmake --build build
ctest --test-dir build --output-on-failure
```
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add fuzzy script matcher for off-script detection"
```

---

### Task 6: React Frontend — Prompter Core

**Files:**
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/hooks/usePrompter.ts`
- Create: `frontend/src/components/PrompterView.tsx`
- Create: `frontend/src/components/StatusBar.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/hooks/usePrompter.test.ts`

**Interfaces:**
- Consumes: Script lines (from parser or IPC)
- Produces:
  - `usePrompter` hook: `{ lines, currentIndex, isPlaying, speed, play, pause, setSpeed, jumpTo, setLines }`
  - `PrompterView` component: scrollable text, highlights current line

- [ ] **Step 1: Write failing test for usePrompter**

`frontend/src/hooks/usePrompter.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react'
import { usePrompter } from './usePrompter'

test('play/pause toggles isPlaying', () => {
  const { result } = renderHook(() => usePrompter())
  expect(result.current.isPlaying).toBe(false)
  act(() => result.current.play())
  expect(result.current.isPlaying).toBe(true)
})

test('setSpeed updates speed', () => {
  const { result } = renderHook(() => usePrompter())
  act(() => result.current.setSpeed(2.5))
  expect(result.current.speed).toBe(2.5)
})

test('jumpTo updates currentIndex', () => {
  const { result } = renderHook(() => usePrompter())
  act(() => result.current.setLines(['a', 'b', 'c']))
  act(() => result.current.jumpTo(2))
  expect(result.current.currentIndex).toBe(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
cd frontend && npm test usePrompter
```
Expected: FAIL

- [ ] **Step 3: Implement usePrompter with Zustand**

```powershell
cd frontend && npm install zustand
```

- [ ] **Step 4: Implement PrompterView and StatusBar**

- [ ] **Step 5: Wire into App.tsx**

- [ ] **Step 6: Run tests**

```powershell
cd frontend && npm test
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add prompter core with scrollable text and state"
```

---

### Task 7: Voice-Tracking Integration (Frontend ↔ Backend)

**Files:**
- Create: `frontend/src/hooks/useSpeech.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `src/ipc.cpp`
- Create: `frontend/src/hooks/useSpeech.test.ts`

**Interfaces:**
- Consumes: `usePrompter`, `useSpeech`, IPC `speech:transcript` events, `script:match` IPC
- Produces: Auto-scroll on-script, pause off-script

- [ ] **Step 1: Write failing test for useSpeech**

`frontend/src/hooks/useSpeech.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react'
import { useSpeech } from './useSpeech'

test('startListening sets isListening', () => {
  const { result } = renderHook(() => useSpeech())
  expect(result.current.isListening).toBe(false)
  act(() => result.current.startListening())
  expect(result.current.isListening).toBe(true)
})
```

- [ ] **Step 2: Implement useSpeech hook**

`frontend/src/hooks/useSpeech.ts`:
- `startListening()` → `postMessage({ type: 'speech:start' })`
- `stopListening()` → `postMessage({ type: 'speech:stop' })`
- `setLanguage(lang)` → `postMessage({ type: 'speech:setLanguage', lang })`
- `onTranscript(callback)` → listens to `speech:transcript` IPC events

- [ ] **Step 3: Add IPC handler for script:match in C++**

`src/ipc.cpp`:
```cpp
// Handle script:match from JS, return MatchResult as JSON
// Use nlohmann/json for serialization
```

- [ ] **Step 4: Wire voice-tracking in App.tsx**

```tsx
const prompter = usePrompter()
const speech = useSpeech()

useEffect(() => {
  speech.onTranscript(async (text: string) => {
    const result = await matchScript(text) // IPC call to C++
    if (result.type === 'OnScript') {
      prompter.jumpTo(result.line_index)
      prompter.play()
    } else {
      prompter.pause()
    }
  })
}, [])
```

- [ ] **Step 5: Run tests**

```powershell
cd frontend && npm test
```
Expected: PASS

- [ ] **Step 6: Verify end-to-end**

```powershell
# Terminal 1
cd frontend && npm run dev
# Terminal 2
.\build\Teleprompter.exe
```
Expected: Load script, start listening, speak on-script → scrolls. Off-script → pauses.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: integrate voice-tracking with prompter auto-scroll"
```

---

### Task 8: Script Import (MD + DOCX in Frontend)

**Files:**
- Create: `frontend/src/lib/parser.ts`
- Create: `frontend/src/components/ScriptEditor.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/lib/parser.test.ts`

**Interfaces:**
- Consumes: File input (.md, .docx)
- Produces: `Script` object `{ lines: string[], rawText: string, sourceFormat: string }`

- [ ] **Step 1: Install parser dependencies**

```powershell
cd frontend && npm install marked mammoth
```

- [ ] **Step 2: Write failing tests for parser**

`frontend/src/lib/parser.test.ts`:
```ts
import { parseMarkdown, parseDocx } from './parser'

test('parseMarkdown strips formatting', () => {
  const md = '# Title\n\nHello **world**\n\n- item 1'
  const result = parseMarkdown(md)
  expect(result.lines[0]).toBe('Title')
  expect(result.lines[1]).toBe('Hello world')
})

test('parseDocx extracts text', async () => {
  // Load test fixture
  const response = await fetch('/fixtures/sample.docx')
  const buffer = await response.arrayBuffer()
  const result = await parseDocx(buffer)
  expect(result.rawText).toContain('Hello')
})
```

- [ ] **Step 3: Implement parser**

`frontend/src/lib/parser.ts`:
```ts
import { marked } from 'marked'
import mammoth from 'mammoth'

export function parseMarkdown(text: string): Script {
  const tokens = marked.lexer(text)
  const lines: string[] = []
  // Extract text from tokens, split by paragraphs
  // ...
  return { lines, rawText: text, sourceFormat: 'markdown' }
}

export async function parseDocx(buffer: ArrayBuffer): Promise<Script> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  const lines = result.value.split('\n').filter(l => l.trim().length > 0)
  return { lines, rawText: result.value, sourceFormat: 'docx' }
}
```

- [ ] **Step 4: Implement ScriptEditor component**

File input for .md/.docx, text area for paste, preview of parsed lines.

- [ ] **Step 5: Run tests**

```powershell
cd frontend && npm test
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add script import for Markdown and DOCX"
```

---

### Task 9: On-Screen Controls + i18n (DE/EN)

**Files:**
- Create: `frontend/src/components/OverlayControls.tsx`
- Create: `frontend/src/lib/i18n.ts`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `usePrompter`, `useOverlay`, `useSpeech`
- Produces: `OverlayControls` component, i18n locale strings

- [ ] **Step 1: Create i18n locale files**

`frontend/src/lib/i18n.ts`:
```ts
export const locales = {
  de: { play: 'Abspielen', pause: 'Pause', speed: 'Geschwindigkeit', overlay: 'Overlay', settings: 'Einstellungen', import: 'Importieren', language: 'Sprache', listening: 'Zuhören', offScript: 'Abweichung erkannt' },
  en: { play: 'Play', pause: 'Pause', speed: 'Speed', overlay: 'Overlay', settings: 'Settings', import: 'Import', language: 'Language', listening: 'Listening', offScript: 'Off-script detected' },
}
```

- [ ] **Step 2: Implement OverlayControls**

Floating control bar: Play/Pause, Speed -/+, Jump to Start/End, Toggle Overlay, Settings.

- [ ] **Step 3: Wire into App.tsx**

- [ ] **Step 4: Verify in dev mode**

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add on-screen controls with DE/EN i18n"
```

---

### Task 10: Keyboard Shortcuts + Presenter Remote

**Files:**
- Create: `frontend/src/hooks/useKeyboard.ts`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes: `usePrompter`, `useOverlay`, `useSpeech`
- Produces: Global keyboard shortcuts

- [ ] **Step 1: Implement useKeyboard hook**

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Arrow Up/Down | Speed +/- |
| Home / End | Jump to start / end |
| F1 | Toggle overlay |
| F2 | Toggle click-through |
| F5 | Start/stop listening |
| Escape | Pause |

- [ ] **Step 2: Wire into App.tsx**

- [ ] **Step 3: Verify shortcuts**

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add keyboard shortcuts and presenter remote support"
```

---

### Task 11: Settings Persistence

**Files:**
- Create: `src/settings.h`, `src/settings.cpp`
- Modify: `src/ipc.cpp`
- Modify: `frontend/src/components/SettingsPanel.tsx`

**Interfaces:**
- Consumes: IPC messages `settings:get`, `settings:set`
- Produces: JSON file in `%APPDATA%/Teleprompter/settings.json`

- [ ] **Step 1: Implement C++ settings (JSON file)**

`src/settings.cpp` — load/save JSON using nlohmann/json.

- [ ] **Step 2: Add IPC handlers**

`settings:get` → returns current settings JSON.
`settings:set` → saves settings JSON.

- [ ] **Step 3: Expand SettingsPanel in frontend**

Default language, speed, font size, font family, text color, background opacity, auto-start listening.

- [ ] **Step 4: Load settings on app start**

- [ ] **Step 5: Verify persistence**

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add settings persistence (JSON in %APPDATA%)"
```

---

### Task 12: Build & Installer (CMake + WiX)

**Files:**
- Modify: `CMakeLists.txt`
- Create: `installer/teleprompter.wxs`
- Create: `scripts/build.ps1`
- Create: `README.md`

**Interfaces:**
- Produces: `.exe` (portable) and `.msi` (installer)

- [ ] **Step 1: Configure CMake for Release build**

```cmake
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    set_target_properties(Teleprompter PROPERTIES WIN32_EXECUTABLE TRUE)
endif()
```

- [ ] **Step 2: Create WiX installer definition**

`installer/teleprompter.wxs` — installs .exe, Whisper model, creates Start Menu shortcut, registers WebView2 dependency.

- [ ] **Step 3: Create build script**

`scripts/build.ps1`:
```powershell
# Build frontend
cd frontend && npm run build && cd ..
# Build C++
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
# Download Whisper model
.\scripts\download-model.ps1
# Build installer
wix build installer\teleprompter.wxs -o build\Teleprompter.msi
```

- [ ] **Step 4: Build and verify**

```powershell
.\scripts\build.ps1
```
Expected: `Teleprompter.exe` and `Teleprompter.msi` in `build/`.

- [ ] **Step 5: Write README**

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add CMake release build, WiX installer, and README"
```

---

### Task 13: E2E Tests

**Files:**
- Create: `tests/e2e/prompter.spec.ts`
- Create: `frontend/public/fixtures/test-script.md`
- Create: `frontend/public/fixtures/sample.docx`

**Interfaces:**
- Consumes: Full app (WebView2 + C++ backend)
- Produces: E2E test suite

- [ ] **Step 1: Set up E2E test harness**

Use Playwright with WebView2 debugging, or WinAppDriver.

- [ ] **Step 2: Write E2E tests**

1. Import MD → lines appear
2. Import DOCX → text extracted
3. Play → scrolls
4. Pause → stops
5. Speed change → rate changes
6. Overlay toggle → always-on-top
7. Click-through → mouse passes through
8. Settings persist across restart

- [ ] **Step 3: Run E2E tests**

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add E2E test suite"
```

---

## Summary

| Task | Component | Language | Tests |
|------|-----------|----------|-------|
| 1 | Project scaffold | C++ + React | Manual |
| 2 | Window management (overlay) | C++ (Win32) | Manual |
| 3 | Audio capture (WASAPI) | C++ | Google Test |
| 4 | Whisper.cpp integration | C++ | Google Test |
| 5 | Script matcher (fuzzy) | C++ | Google Test |
| 6 | Prompter core | React/TS | Vitest |
| 7 | Voice-tracking integration | C++ + React | Vitest + Manual |
| 8 | Script import (MD/DOCX) | React/TS | Vitest |
| 9 | On-screen controls + i18n | React/TS | Manual |
| 10 | Keyboard shortcuts | React/TS | Manual |
| 11 | Settings persistence | C++ + React | Manual |
| 12 | Build & installer | CMake + WiX | Build verify |
| 13 | E2E tests | Playwright | E2E suite |

**Critical path:** 1 → 2 → 3 → 4 → 5 → 7 (voice-tracking is the core)
**Parallelizable:** 6, 8, 9, 10, 11 alongside or after 7
