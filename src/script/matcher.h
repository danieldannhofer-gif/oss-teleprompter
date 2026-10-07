#pragma once

#include <string>
#include <vector>

#include "types.h"

namespace teleprompter {

class Matcher {
public:
    explicit Matcher(std::vector<std::string> lines);

    MatchResult match(const std::string& transcript);

    int currentPosition() const { return currentPosition_; }

    static constexpr double kThreshold = 0.7;
    static constexpr size_t kWindowWords = 50;

private:
    std::vector<std::string> lines_;
    std::string window_;
    int currentPosition_ = 0;
};

}  // namespace teleprompter
