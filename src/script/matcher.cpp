#include "matcher.h"

#include <cmath>
#include <sstream>

#include "utils/string_utils.h"

namespace teleprompter {

Matcher::Matcher(std::vector<std::string> lines) : lines_(std::move(lines)) {
    for (auto& line : lines_) line = normalize(line);
}

MatchResult Matcher::match(const std::string& transcript) {
    const std::string norm = normalize(transcript);
    if (norm.empty()) return {};

    std::vector<std::string> words;
    {
        std::istringstream iss(window_);
        std::string w;
        while (iss >> w) words.push_back(w);
    }
    {
        std::istringstream iss(norm);
        std::string w;
        while (iss >> w) words.push_back(w);
    }
    if (words.size() > kWindowWords) {
        words.erase(words.begin(), words.end() - kWindowWords);
    }
    std::ostringstream joined;
    for (size_t i = 0; i < words.size(); ++i) {
        if (i) joined << ' ';
        joined << words[i];
    }
    window_ = joined.str();

    int bestIndex = -1;
    double bestScore = 0.0;
    for (size_t i = 0; i < lines_.size(); ++i) {
        if (lines_[i].empty()) continue;

        double score = similarity(window_, lines_[i]);
        const std::string& shorter = window_.size() <= lines_[i].size() ? window_ : lines_[i];
        const std::string& longer = window_.size() <= lines_[i].size() ? lines_[i] : window_;
        if (shorter.size() < longer.size() && !shorter.empty()) {
            double bestSub = 0.0;
            for (size_t start = 0; start + shorter.size() <= longer.size(); ++start) {
                double s = similarity(longer.substr(start, shorter.size()), shorter);
                if (s > bestSub) bestSub = s;
            }
            score = bestSub;
        }

        const double distancePenalty =
            std::abs(static_cast<int>(i) - currentPosition_) * 0.02;
        const double adjusted = score - distancePenalty;

        if (adjusted > bestScore) {
            bestScore = adjusted;
            bestIndex = static_cast<int>(i);
        }
    }

    if (bestScore >= kThreshold) {
        currentPosition_ = bestIndex;
        return {MatchType::OnScript, bestIndex, bestScore};
    }
    return {MatchType::OffScript, bestIndex, bestScore};
}

}  // namespace teleprompter
