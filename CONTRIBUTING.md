# Contributing to Teleprompter

## Getting Started

```powershell
# Clone with submodules
git clone --recurse-submodules https://github.com/danieldannhofer-gif/oss-teleprompter.git
cd oss-teleprompter

# Install frontend dependencies
cd frontend && npm install && cd ..

# Setup WebView2 SDK
.\scripts\setup-webview2.ps1

# Download Whisper model
.\scripts\download-model.ps1
```

## Development Workflow

1. **Pick an issue** from the [project board](https://github.com/danieldannhofer-gif/oss-teleprompter/projects)
2. **Create a branch**: `git checkout -b feat/issue-N-short-description`
3. **Write tests first** (TDD): add failing tests, then implement
4. **Run tests**: `cd frontend && npm test` (frontend) / `ctest --test-dir build` (C++)
5. **Commit**: use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
6. **Push & PR**: open a pull request against `master`
7. **CI must pass**: frontend tests, E2E tests, C++ tests

## Code Style

- **Frontend**: TypeScript strict mode, functional React components, hooks
- **C++**: C++20, RAII, no raw `new`/`delete` where avoidable
- **Commits**: Conventional Commits format
- **Tests**: Vitest (frontend), Google Test (C++), Playwright (E2E)

## Labels

| Label | Meaning |
|-------|---------|
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Docs improvements |
| `release` | Release-related work |
| `meta` | Project management |
| `priority: high` / `medium` / `low` | Urgency |
| `area: frontend` | React/TypeScript UI |
| `area: backend` | C++ / Win32 / WebView2 |
| `area: ui` | UI/UX improvements |
| `area: devops` | CI, build, scripts |
| `area: speech` | Speech recognition |

## Project Board

The project board lives at:
https://github.com/danieldannhofer-gif/oss-teleprompter/projects

Columns: **Backlog** → **Todo** → **In Progress** → **Review** → **Done**

## License

MIT — see [LICENSE](LICENSE).
