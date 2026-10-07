param(
    [string]$Model = "ggml-base.bin"
)

$url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$Model"
$dest = Join-Path $PSScriptRoot "..\models\$Model"
$destDir = Split-Path $dest -Parent

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

if (Test-Path $dest) {
    Write-Host "Model $Model already downloaded"
    exit 0
}

Invoke-WebRequest -Uri $url -OutFile $dest
Write-Host "Downloaded $Model to $dest"
