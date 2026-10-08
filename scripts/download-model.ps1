param(
    [string]$Model = "ggml-base.bin"
)

$url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$Model"
$dest = Join-Path $PSScriptRoot "..\build\models\$Model"

if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Invoke-WebRequest -Uri $url -OutFile $dest
    Write-Host "Downloaded $Model"
} else {
    Write-Host "$Model already present"
}
