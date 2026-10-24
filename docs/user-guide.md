# Teleprompter User Guide

## Installation

1. Download the latest MSI installer from [GitHub Releases](https://github.com/danieldannhofer-gif/oss-teleprompter/releases)
2. Run the installer — requires Windows 10/11 (x64)
3. The installer checks for the Microsoft Edge WebView2 Runtime. If missing, download it from [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/)
4. Launch Teleprompter from the Start Menu

## Quick Start

1. **Import a script** — Click "Import Script" and select a `.md`, `.docx`, or `.txt` file, or paste text directly
2. **Start voice tracking** — Click the green "Start Voice Tracking" button (or press F5)
3. **Speak** — The prompter scrolls as you speak on-script. If you deviate, it pauses. Return to the script and it resumes
4. **Overlay mode** — Press F1 to toggle transparent always-on-top overlay for use over Teams/PowerPoint

## Script Import

Supported formats:
- **Markdown (.md)** — Section headings (`## Section Name`) create navigable sections. Timecodes (`0:00-5:00`) and durations (`5 min`) are parsed
- **Word (.docx)** — Text is extracted; formatting is stripped
- **Plain text (.txt)** — Each line is a separate line in the prompter

### Section headings

```
## Introduction (5 min)
Welcome everyone...

## Main Content (15 min)
Today we discuss...
```

### Timecodes

```
## Intro [0:00-5:00]
## Body [5:00-20:00]
```

## Voice Tracking

Voice tracking uses Whisper.cpp for local speech recognition. No internet connection required.

- **Languages**: German and English (auto-detected or manually selected in Settings)
- **Model**: `ggml-base.bin` (multilingual, ~150 MB) is downloaded automatically
- **Accuracy tips**: Speak clearly, use a good microphone, minimize background noise
- **Off-script detection**: The fuzzy matcher tolerates minor mispronunciations and filler words

## Overlay Mode

- **Toggle overlay**: F1
- **Click-through**: F2 (lets you interact with apps underneath)
- **Always-on-top**: Enabled in Settings
- **Docking**: F3 (top), F4 (bottom), F6 (undock) — docks the window to screen edge

## Facilitation Mode

- **Timeline**: Shows all sections with durations and timecodes
- **Section navigation**: Click a section in the timeline to jump to it
- **Timebar**: Shows elapsed vs. planned time; shrinks as time runs out
- **Timecodes**: Sections with `[0:00-5:00]` show planned time ranges

## Remote Control

Control the teleprompter from your phone on the same WiFi network.

1. Enable in **Settings → Remote Control → Enable phone remote**
2. Optionally set a PIN code
3. On your phone, open `http://<this-pc-ip>:8765/remote`
4. Use the on-screen controls: play/pause, speed, section navigation, scroll position

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Arrow Up / Down | Speed + / - |
| Home / End | Jump to start / end |
| F1 | Toggle overlay |
| F2 | Toggle click-through |
| F3 | Dock to top |
| F4 | Dock to bottom |
| F5 | Start / stop voice tracking |
| F6 | Undock |
| Escape | Pause |

## Settings

| Setting | Description |
|---------|-------------|
| Language | UI language (DE/EN) |
| Speed | Scroll speed multiplier |
| Font size | Prompter text size (16-72px) |
| Font family | Prompter font |
| Text color | Prompter text color |
| Background opacity | Prompter background transparency |
| Auto-start listening | Start voice tracking automatically when script loads |
| High contrast mode | High-contrast colors for visibility |
| Show timeline | Show/hide the facilitation timeline |
| Dock position | Dock window to top/bottom/none |
| Dock height | Docked window height (% of screen) |
| Remote control | Enable phone remote + PIN |

## Troubleshooting

See the [FAQ and Troubleshooting section](../README.md#faq) in the README.
