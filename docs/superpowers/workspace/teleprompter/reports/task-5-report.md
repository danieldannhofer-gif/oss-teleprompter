# Task 5 Report: Script Matcher (Fuzzy)

**Status:** Complete — all tests pass on Linux
**Branch:** `vibe/task-1-scaffold-a3a1fc`

## Delivered

- `src/utils/string_utils.h/cpp`: `normalize` (lowercase, strip punctuation, collapse whitespace), `levenshtein` (DP), `similarity` (1 - dist/maxLen)
- `src/script/types.h`: `MatchType { OnScript, OffScript }`, `MatchResult { type, lineIndex, confidence }`
- `src/script/matcher.h/cpp`: sliding-window fuzzy matcher
  - Window of last 50 words of transcript
  - Best sliding substring similarity when window/line lengths differ (handles both partial transcript vs long line, and long window vs short line)
  - 0.7 threshold → OnScript
  - Position hysteresis: 0.02/line distance penalty from current position prevents jumping back
- IPC: `script:load` (set lines), `script:match` → emits `script:matchResult { matchType, lineIndex, confidence }`
- `tests/cpp/string_utils_test.cpp`, `tests/cpp/matcher_test.cpp` — all plan test cases
- CMake: matcher/string_utils in `teleprompter_core`, `string_utils_test`/`matcher_test` targets + CTest registration

## Verification

- `string_utils_test`: PASS (normalize, levenshtein kitten/sitting=3, similarity cases)
- `matcher_test`: PASS (exact, off-script, fuzzy, jump-to-later-line, partial-transcript)
- `ipc.cpp` syntax check with whisper + json + matcher includes: PASS
- One bug found & fixed during TDD: partial transcript ("quick brown fox jumps" vs longer line) initially scored 0.49 — fixed by sliding the *shorter* string against the longer one in both directions

## Notes

- gtest replaced with portable plain-C++ tests (no gtest vendored; same assertions, same cases).
