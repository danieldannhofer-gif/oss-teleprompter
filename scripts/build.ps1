$ErrorActionPreference = "Stop"

# Build frontend
Push-Location "$PSScriptRoot\..\frontend"
npm install
npm run build
Pop-Location

# Configure + build C++ (Release)
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

# Download Whisper model
& "$PSScriptRoot\download-model.ps1"

# Build installer if WiX is available
if (Get-Command wix -ErrorAction SilentlyContinue) {
    wix build installer\teleprompter.wxs -o build\Teleprompter.msi
    Write-Host "Installer: build\Teleprompter.msi"
} else {
    Write-Host "WiX not found - skipped installer build"
}

Write-Host "Done. Executable: build\Release\Teleprompter.exe"
