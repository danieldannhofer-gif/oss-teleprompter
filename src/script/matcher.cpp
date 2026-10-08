#include "matcher.h"
#include "../utils/string_utils.h"
#include <algorithm>
#include <cmath>

ScriptMatcher::ScriptMatcher(const std::vector<std::string>& lines)
    : m_lines(lines)
{
    // Pre-normalize all lines
    m_normalizedLines.reserve(lines.size());
    for (const auto& line : lines) {
        m_normalizedLines.push_back(normalize(line));
    }
}

MatchResult ScriptMatcher::Match(const std::string& transcript) {
    // Normalize and add to sliding window
    std::string normalized = normalize(transcript);
    if (!normalized.empty()) {
        // Split into words and add to window
        auto words = tokenize(normalized);
        for (const auto& word : words) {
            m_recentTranscript.push_back(word);
        }
        while (m_recentTranscript.size() > MAX_RECENT_WORDS) {
            m_recentTranscript.pop_front();
        }
    }

    // Build the recent transcript string
    std::string recentText = GetRecentTranscript();
    if (recentText.empty()) {
        return {MatchType::OffScript, -1, 0.0f};
    }

    return FindBestMatch(recentText);
}

void ScriptMatcher::SetCurrentPosition(int lineIndex) {
    m_currentPosition = lineIndex;
}

void ScriptMatcher::SetThreshold(float threshold) {
    m_threshold = threshold;
}

std::string ScriptMatcher::GetRecentTranscript() const {
    std::string result;
    for (const auto& word : m_recentTranscript) {
        if (!result.empty()) result += " ";
        result += word;
    }
    return result;
}

MatchResult ScriptMatcher::FindBestMatch(const std::string& normalizedText) const {
    auto transcriptTokens = tokenize(normalizedText);
    if (transcriptTokens.empty()) {
        return {MatchType::OffScript, -1, 0.0f};
    }

    float bestScore = 0.0f;
    int bestIndex = -1;

    for (size_t i = 0; i < m_normalizedLines.size(); i++) {
        const auto& line = m_normalizedLines[i];
        if (line.empty()) continue;

        // Compute similarity using multiple metrics
        float sim1 = similarity(normalizedText, line);

        // Also check if transcript is a substring of the line (or vice versa)
        float substringScore = 0.0f;
        if (line.find(normalizedText) != std::string::npos) {
            substringScore = static_cast<float>(normalizedText.size()) / static_cast<float>(line.size());
        } else if (normalizedText.find(line) != std::string::npos) {
            substringScore = static_cast<float>(line.size()) / static_cast<float>(normalizedText.size());
        }

        // Token-based Jaccard similarity
        auto lineTokens = tokenize(line);
        float jacScore = jaccardSimilarity(transcriptTokens, lineTokens);

        // Combined score (weighted)
        float score = std::max({sim1, substringScore, jacScore * 0.9f});

        // Hysteresis: prefer lines near current position
        int distance = std::abs(static_cast<int>(i) - m_currentPosition);
        float distancePenalty = 1.0f - std::min(0.3f, distance * 0.01f);
        score *= distancePenalty;

        if (score > bestScore) {
            bestScore = score;
            bestIndex = static_cast<int>(i);
        }
    }

    if (bestScore >= m_threshold && bestIndex >= 0) {
        return {MatchType::OnScript, bestIndex, bestScore};
    }

    return {MatchType::OffScript, -1, bestScore};
}
