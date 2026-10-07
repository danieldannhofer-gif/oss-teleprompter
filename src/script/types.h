#pragma once
#include <string>

namespace teleprompter {

enum class MatchType { OnScript, OffScript };

struct MatchResult {
    MatchType type = MatchType::OffScript;
    int line_index = -1;
    double confidence = 0.0;
};

} // namespace teleprompter
