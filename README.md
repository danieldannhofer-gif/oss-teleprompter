# Teleprompter

A local, on-device Windows teleprompter with voice-tracking. The prompter listens to your voice via Whisper.cpp speech recognition and auto-scrolls when you're on-script, pauses when you deviate.

## Features

- **Voice-tracking auto-scroll** — Speaks on-script, scrolls automatically. Goes off-script, pauses.
- **Fuzzy script matching** — Tolerates mispronunciations, filler words, and minor deviations.
- **Transparent overlay mode** — Semi-transparent, always-on-top, click-through for use over Teams/PowerPoint.
- **Script import** — Markdown (`.md`), Word (`.docx`), and plain text (`.txt`).
- **Multi-language** — German and English speech recognition with UI localization.
- **100% offline** — All speech recognition runs locally via Whisper.cpp. No cloud API calls.
- **Keyboard shortcuts** — Space (play/pause), arrows (speed), F1 (overlay), F5 (listen), Esc (pause).

## Requirements

- Windows 10/11 (x64)
- [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (pre-installed on Windows 11)
- Microphone

## Quick Start

### Development

```powershell
# 1. Clone with submodules
git clone --recurse-submodules <repo-url>
cd teleprompter

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Setup WebView2 SDK
.\scripts\setup-webview2.ps1

# 4. Download Whisper model (~150 MB)
.\scripts\download-model.ps1

# 5. Terminal 1: Start Vite dev server
cd frontend && npm run dev

# 6. Terminal 2: Build and run C++ app
cmake -B build && cmake --build build
.\build\Debug\Teleprompter.exe
```

### Production Build

```powershell
.\scripts\build.ps1 -Release
```

This builds the frontend, compiles the C++ backend, runs all tests, downloads the Whisper model, and creates an MSI installer at `build\Teleprompter.msi`.

## Usage

1. **Import a script** — Click "Import" and select a `.md`, `.docx`, or `.txt` file, or paste text directly.
2. **Start voice tracking** — Click the green "Start Voice Tracking" button (or press F5).
3. **Speak** — The prompter scrolls as you speak on-script. If you deviate, it pauses. Return to the script and it resumes.
4. **Overlay mode** — Press F1 to toggle transparent always-on-top overlay. Enable click-through in Settings to interact with apps underneath.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Arrow Up / Down | Speed + / - |
| Home / End | Jump to start / end |
| F1 | Toggle overlay |
| F2 | Toggle click-through |
| F5 | Start / stop listening |
| Escape | Pause |

## Architecture

```
teleprompter/
├── src/                    # C++ backend (Win32 + WebView2)
│   ├── main.cpp            # Entry point, WebView2 init
│   ├── window.cpp          # Window management (overlay, click-through)
│   ├── webview.cpp         # WebView2 host, navigation, IPC
│   ├── ipc.cpp             # Message routing C++ ↔ JavaScript
│   ├── speech/             # Whisper.cpp wrapper + WASAPI audio capture
│   ├── script/             # Fuzzy script matcher (Levenshtein)
│   └── utils/              # String utilities
├── frontend/               # React/TypeScript frontend (rendered in WebView2)
│   ├── src/
│   │   ├── components/     # PrompterView, ScriptEditor, SettingsPanel, StatusBar
│   │   ├── hooks/          # usePrompter, useSpeech, useVoiceTracking, etc.
│   │   └── lib/            # webview IPC, i18n, parser, matcher
│   └── public/models/      # Whisper model files (downloaded)
├── third_party/
│   ├── whisper.cpp/        # Speech recognition (git submodule)
│   └── nlohmann_json/      # JSON library (git submodule)
├── tests/
│   ├── cpp/                # C++ unit tests (Google Test)
│   └── frontend tests are in frontend/src/**/*.test.ts (Vitest)
├── installer/              # WiX installer definition
└── scripts/                # Build and setup scripts
```

## Tech Stack

- **C++ 20** / Win32 API / WebView2
- **React 18** / TypeScript 5 / Vite 5
- **Whisper.cpp** (local speech recognition)
- **WASAPI** (microphone capture)
- **Zustand** (state management)
- **Google Test** (C++ tests) / **Vitest** (frontend tests)
- **CMake** / **WiX Toolset 4** (build & installer)

## Testing

```powershell
# Frontend tests
cd frontend && npm test

# C++ tests
cmake --build build
ctest --test-dir build --output-on-failure

# Full build with tests
.\scripts\build.ps1 -Release
```

## License

MIT
