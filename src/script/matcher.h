#pragma once
#include "types.h"
#include <string>
#include <vector>
#include <deque>

// Fuzzy script matcher: compares recognized speech against script lines
class ScriptMatcher {
public:
    explicit ScriptMatcher(const std::vector<std::string>& lines);

    // Match a transcript chunk against the script
    // Returns OnScript with line index if matched, OffScript otherwise
    MatchResult Match(const std::string& transcript);

    // Set the current position (for hysteresis — prefer nearby lines)
    void SetCurrentPosition(int lineIndex);

    // Set the matching threshold (default 0.7)
    void SetThreshold(float threshold);

private:
    std::vector<std::string> m_lines;
    std::vector<std::string> m_normalizedLines;
    std::deque<std::string> m_recentTranscript; // sliding window of recent words
    int m_currentPosition = 0;
    float m_threshold = 0.7f;
    static constexpr size_t MAX_RECENT_WORDS = 50;

    // Build the sliding window string from recent transcript
    std::string GetRecentTranscript() const;

    // Find the best matching line for the given text
    MatchResult FindBestMatch(const std::string& normalizedText) const;
};
