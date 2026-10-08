#pragma once
#include <string>
#include <vector>

// A loaded script, split into lines
struct Script {
    std::vector<std::string> lines;
    std::string rawText;
    std::string sourceFormat; // "markdown", "docx", "plain"
};

// Result of matching a transcript against the script
enum class MatchType {
    OnScript,
    OffScript
};

struct MatchResult {
    MatchType type;
    int lineIndex;      // valid when type == OnScript
    float confidence;   // 0.0 - 1.0
};
