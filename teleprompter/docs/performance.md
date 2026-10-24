# Performance Targets

## Targets (v1.0)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Startup time | < 3 seconds | Cold start on SSD, from double-click to window visible |
| Idle memory | < 200 MB | Task Manager, after script loaded, voice tracking off |
| Voice-to-scroll latency | < 500 ms | Time from speech end to prompter scroll action |

## Methodology

- **Startup**: `Measure-Command { Start-Process Teleprompter.exe }` (PowerShell)
- **Memory**: Task Manager → Details → Teleprompter.exe → Working set
- **Latency**: Manual measurement with stopwatch, or automated test with known audio input

## Measured Results

| Metric | Measured | Date | Hardware |
|--------|----------|------|----------|
| Startup | TBD | — | — |
| Memory | TBD | — | — |
| Latency | TBD | — | — |

*Results to be filled after Windows testing (issue #27).*

## Optimization Tips

- Use `ggml-base.bin` (default) for best balance of speed and accuracy
- Use `ggml-tiny.bin` for weaker machines (faster but less accurate)
- Use `ggml-small.bin` for maximum accuracy (slower)
- Close other applications during presentations for best performance
