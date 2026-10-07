# OSS Teleprompter

Local, on-device Windows teleprompter (C++/Win32 + WebView2 + React) with
voice tracking via [whisper.cpp](https://github.com/ggerganov/whisper.cpp):
auto-scrolls while you are on-script, pauses when you deviate — completely
offline, German and English.

## Features

- **Voice tracking** — whisper.cpp runs locally; a fuzzy matcher keeps the
  prompter in sync with what you say and pauses when you go off-script.
- **Transparent overlay** — borderless, semi-transparent, always-on-top,
  click-through window over Teams/PowerPoint.
- **DE + EN** recognition, switchable mid-session.
- **Markdown and Word (.docx) import**, plus paste-as-text.
- **Controls** — on-screen bar, keyboard shortcuts (presenter remotes work
  via PageUp/PageDown-style keys), persistent settings.

## Requirements (Windows 10/11 x64)

- CMake 3.27+, Visual Studio 2022 (C++20), Node.js 18+
- WebView2 Runtime (pre-installed on Windows 11)
- Whisper model (`ggml-base.bin` ~150 MB or `ggml-small.bin` ~500 MB)

## Build

```powershell
git clone --recurse-submodules <repo>
cd teleprompter
.\scripts\build.ps1          # frontend + C++ + model download + optional MSI
.\scripts\download-model.ps1 # model only
```

For development with hot reload:

```powershell
# Terminal 1
cd frontend && npm run dev
# Terminal 2
cmake -B build && cmake --build build
.\build\Teleprompter.exe     # or build\Release\Teleprompter.exe
```

## Usage

1. Import a script (.md / .docx / .txt) or paste text — **Import** opens the editor.
2. Start listening (**F5** or the *Listening* button). The current line is
   highlighted; the prompter follows your voice.
3. **F1** toggles the transparent overlay, **F2** click-through, Space
   play/pause, Arrow Up/Down speed, Home/End jump to start/end, Esc pause.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Play / Pause |
| Arrow Up/Down | Speed +/− |
| Home / End | Jump to start / end |
| F1 | Toggle overlay |
| F2 | Toggle click-through |
| F5 | Start/stop listening |
| Escape | Pause |

## Tests

```powershell
cmake -B build && cmake --build build
ctest --test-dir build --output-on-failure   # C++ (matcher, string utils, IPC)
cd frontend && npm test                       # React (Vitest)
```

The C++ core (fuzzy matcher, normalization, IPC routing) is platform-
independent and is tested on any OS; the Win32/WebView2/WASAPI layer builds
only on Windows.

## License

MIT
