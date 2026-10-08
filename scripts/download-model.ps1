# Download Whisper model for speech recognition
$ErrorActionPreference = "Stop"

$modelName = if ($args.Count -gt 0) { $args[0] } else { "ggml-base.bin" }
$modelDir = "$PSScriptRoot\..\frontend\public\models"
$modelPath = "$modelDir\$modelName"

$modelUrls = @{
    "ggml-tiny.bin"   = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
    "ggml-tiny.en.bin" = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin"
    "ggml-base.bin"   = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
    "ggml-base.en.bin" = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
    "ggml-small.bin"  = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
    "ggml-small.en.bin" = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin"
    "ggml-medium.bin" = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin"
}

if (Test-Path $modelPath) {
    Write-Host "Model already exists: $modelPath"
    exit 0
}

if (-not $modelUrls.ContainsKey($modelName)) {
    Write-Error "Unknown model: $modelName. Available: $($modelUrls.Keys -join ', ')"
    exit 1
}

New-Item -ItemType Directory -Force -Path $modelDir | Out-Null

$url = $modelUrls[$modelName]
Write-Host "Downloading $modelName from $url ..."
Write-Host "This may take a while depending on your connection..."

Invoke-WebRequest -Uri $url -OutFile $modelPath -UseBasicParsing

$size = (Get-Item $modelPath).Length / 1MB
Write-Host "Downloaded $modelName ($([math]::Round($size, 1)) MB) to $modelPath"
