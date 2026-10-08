#pragma once
#include "script/types.h"
#include <string>
#include <vector>

namespace teleprompter {

// Fuzzy script matcher: compares a sliding window of the recent transcript
// against the script lines and reports the best on-script line, or off-script.
class Matcher {
public:
    static constexpr double kDefaultThreshold = 0.7;
    static constexpr double kBackPenalty = 0.05;
    static constexpr size_t kWindowWords = 50;

    explicit Matcher(std::vector<std::string> lines, double threshold = kDefaultThreshold);

    MatchResult Match(const std::string& transcript);

    void set_current_line(int line);
    int current_line() const { return current_line_; }
    const std::vector<std::string>& lines() const { return lines_; }

private:
    std::vector<std::string> lines_;
    std::vector<std::string> normalized_;
    double threshold_;
    int current_line_ = 0;
};

} // namespace teleprompter
