# Release Process

## Version Numbering

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (incompatible API/script format changes)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

## Pre-Release Checklist

1. **Feature freeze** — 1 week before release, only bug fixes
2. **Bug triage** — all P0/P1 issues closed
3. **Test suite** — CI green (frontend unit + E2E + C++ tests)
4. **Documentation** — user guide, FAQ, changelog up to date
5. **ROADMAP** — updated with completed items

## Release Steps

1. **Bump version** in:
   - `frontend/package.json`
   - `CMakeLists.txt`
   - `installer/teleprompter.wxs`
2. **Commit**: `chore: bump version to X.Y.Z`
3. **Tag**: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. **CI builds** automatically:
   - Frontend build + tests
   - C++ build + tests
   - MSI installer
   - SHA256 checksum
   - Auto-generated changelog from merged PR titles
5. **GitHub Release** created automatically with:
   - MSI installer
   - SHA256 checksum file
   - Changelog
   - Release notes (manual summary of features and breaking changes)

## Post-Release

1. Update `docs/ROADMAP.md` — mark completed issues
2. Announce on GitHub (Release notes serve as announcement)
3. Monitor GitHub Issues for bug reports

## Rollback

If a critical issue is found post-release:
1. Fix the issue on master
2. Bump PATCH version
3. Follow normal release process
4. Mark the broken release as pre-release on GitHub

## Verifying Downloads

Users can verify the MSI integrity:
```powershell
Get-FileHash Teleprompter.msi -Algorithm SHA256
# Compare with the .sha256 file from the release
```
