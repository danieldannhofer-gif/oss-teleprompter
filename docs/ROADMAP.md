# Teleprompter Roadmap

## v0.1.0 — First Public Release (in progress)

Core teleprompter with voice tracking. Target: ship an MSI installer.

| Issue | Title | Status |
|-------|-------|--------|
| #10 | Embed frontend for production | Done |
| #5 | WebView2 runtime error handling | Done |
| #11 | Verify Windows build end-to-end | Pending (needs Windows) |
| #7 | Cut v0.1.0 release | Pending (depends on #11) |

## v0.2.0 — Polish & Script Management

Quality-of-life improvements for daily use.

| Issue | Title | Status |
|-------|-------|--------|
| #12 | Expose all settings in SettingsPanel | Done |
| #6 | Script library — save & quick-reload | In Progress |
| #8 | Script export | In Progress |
| #9 | Accessibility — ARIA, keyboard nav, high-contrast | Backlog |
| #4 | C++ IPC integration tests | Backlog |

## v1.0.0 — Stable Release

Production-ready. All high-priority issues resolved, full test coverage,
documented, accessible.

## Future Ideas (not yet scoped)

- Multi-monitor support (dock to secondary display)
- Cloud sync for scripts (optional, opt-in)
- Plugin/extension system for custom scroll behaviors
- macOS / Linux port (would require different UI layer)
- Teleprompter remote control (phone as remote via local network)
- Rehearsal mode with recording & playback
- Speaker notes / hidden notes view
- PDF script import
- Rich text formatting in scripts (bold, italic, color)
