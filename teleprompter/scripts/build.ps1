# Full build script for Teleprompter
# Builds frontend, C++ backend, downloads Whisper model, and creates installer
#
# Usage:
#   .\scripts\build.ps1              # Debug build
#   .\scripts\build.ps1 -Release     # Release build
#   .\scripts\build.ps1 -SkipTests   # Skip running tests
#   .\scripts\build.ps1 -SkipInstaller  # Skip WiX installer step

param(
    [switch]$Release,
    [switch]$SkipTests,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$projectDir = Split-Path $scriptDir -Parent
$buildType = if ($Release) { "Release" } else { "Debug" }

Write-Host "=== Teleprompter Build ($buildType) ===" -ForegroundColor Cyan

# --- Step 1: Build frontend ---
Write-Host "`n[1/5] Building frontend..." -ForegroundColor Yellow
Push-Location "$projectDir\frontend"
try {
    npm install
    if (-not $SkipTests) {
        Write-Host "  Running frontend tests..."
        npm test
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
} finally {
    Pop-Location
}
Write-Host "  Frontend build OK" -ForegroundColor Green

# --- Step 2: Setup WebView2 SDK ---
Write-Host "`n[2/5] Setting up WebView2 SDK..." -ForegroundColor Yellow
& "$scriptDir\setup-webview2.ps1"
if ($LASTEXITCODE -ne 0) { throw "WebView2 setup failed" }

# --- Step 3: Configure and build C++ ---
Write-Host "`n[3/5] Building C++ backend..." -ForegroundColor Yellow
Push-Location $projectDir
try {
    cmake -B build -DCMAKE_BUILD_TYPE=$buildType
    if ($LASTEXITCODE -ne 0) { throw "CMake configure failed" }

    cmake --build build --config $buildType
    if ($LASTEXITCODE -ne 0) { throw "C++ build failed" }

    if (-not $SkipTests) {
        Write-Host "  Running C++ tests..."
        ctest --test-dir build --output-on-failure -C $buildType
    }
} finally {
    Pop-Location
}
Write-Host "  C++ build OK" -ForegroundColor Green

# --- Step 4: Download Whisper model ---
Write-Host "`n[4/5] Downloading Whisper model..." -ForegroundColor Yellow
& "$scriptDir\download-model.ps1" "ggml-base.bin"
Write-Host "  Model ready" -ForegroundColor Green

# --- Step 5: Build installer (Release only) ---
if (-not $SkipInstaller -and $Release) {
    Write-Host "`n[5/5] Building installer..." -ForegroundColor Yellow
    $exePath = "$projectDir\build\$buildType\Teleprompter.exe"
    if (-not (Test-Path $exePath)) {
        $exePath = "$projectDir\build\Teleprompter.exe"
    }

    wix build "$projectDir\installer\teleprompter.wxs" `
        -arch x64 `
        -d "TeleprompterExe=$exePath" `
        -o "$projectDir\build\Teleprompter.msi"
    if ($LASTEXITCODE -ne 0) { throw "Installer build failed" }
    Write-Host "  Installer: build\Teleprompter.msi" -ForegroundColor Green
} else {
    Write-Host "`n[5/5] Skipping installer (use -Release to build MSI)" -ForegroundColor DarkGray
}

Write-Host "`n=== Build complete ===" -ForegroundColor Cyan
$exeOut = "$projectDir\build\$buildType\Teleprompter.exe"
if (-not (Test-Path $exeOut)) { $exeOut = "$projectDir\build\Teleprompter.exe" }
Write-Host "Executable: $exeOut"
