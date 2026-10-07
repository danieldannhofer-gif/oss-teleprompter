#pragma once

namespace teleprompter {

enum class MatchType { OnScript, OffScript };

struct MatchResult {
    MatchType type = MatchType::OffScript;
    int lineIndex = -1;
    double confidence = 0.0;
};

}  // namespace teleprompter
