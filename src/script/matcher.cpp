#include "script/matcher.h"
#include "utils/string_utils.h"

#include <algorithm>
#include <limits>

namespace teleprompter {

Matcher::Matcher(std::vector<std::string> lines, double threshold)
    : lines_(std::move(lines)), threshold_(threshold) {
    normalized_.reserve(lines_.size());
    for (const auto& line : lines_) normalized_.push_back(normalize(line));
}

void Matcher::set_current_line(int line) {
    if (line >= 0 && line < static_cast<int>(lines_.size())) current_line_ = line;
}

MatchResult Matcher::Match(const std::string& transcript) {
    if (lines_.empty()) return {};
    const std::string window = recent_window(transcript, kWindowWords);
    if (window.empty()) return {};

    int best_index = -1;
    double best_score = 0.0;
    for (int i = 0; i < static_cast<int>(normalized_.size()); ++i) {
        const std::string& line = normalized_[i];
        if (line.empty()) continue;
        double score = similarity(window, line);
        // Containment bonus: a partial transcript that matches part of the
        // line is still on-script.
        if (window.size() <= line.size() && line.find(window) != std::string::npos) {
            score = std::max(score, 0.5 + 0.5 * static_cast<double>(window.size()) / line.size());
        }
        // Hysteresis: slightly penalize lines behind the current position so
        // the matcher does not jump backwards on repeated phrases.
        if (i < current_line_) score -= kBackPenalty;
        if (score > best_score) {
            best_score = score;
            best_index = i;
        }
    }

    if (best_index >= 0 && best_score >= threshold_) {
        current_line_ = best_index;
        return {MatchType::OnScript, best_index, best_score};
    }
    return {MatchType::OffScript, best_index, best_score};
}

} // namespace teleprompter
