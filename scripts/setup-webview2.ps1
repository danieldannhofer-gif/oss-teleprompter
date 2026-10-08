# Download and extract WebView2 SDK for CMake
$ErrorActionPreference = "Stop"

$buildDir = "$PSScriptRoot\..\build"
$webview2Dir = "$buildDir\webview2"
$nupkgPath = "$buildDir\webview2.nupkg"
$zipPath = "$buildDir\webview2.zip"

New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
New-Item -ItemType Directory -Force -Path $webview2Dir | Out-Null

if (Test-Path "$webview2Dir\build\native\include\WebView2.h") {
    Write-Host "WebView2 SDK already present."
    exit 0
}

Write-Host "Downloading WebView2 SDK..."
Invoke-WebRequest -Uri "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/1.0.2903.40" -OutFile $nupkgPath

Write-Host "Extracting..."
Copy-Item $nupkgPath $zipPath -Force
Expand-Archive -Path $zipPath -DestinationPath $webview2Dir -Force
Remove-Item $zipPath -Force

Write-Host "WebView2 SDK ready at $webview2Dir"
