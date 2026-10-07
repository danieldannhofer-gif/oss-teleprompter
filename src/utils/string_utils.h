#pragma once
#include <string>
#include <vector>

namespace teleprompter {

// Lowercase, strip punctuation, collapse whitespace.
std::string normalize(const std::string& text);

// Standard DP Levenshtein edit distance on normalized tokens.
size_t levenshtein(const std::string& a, const std::string& b);

// Similarity ratio in [0, 1]: 1 - distance / max_len.
double similarity(const std::string& a, const std::string& b);

// Split normalized text into words.
std::vector<std::string> tokenize(const std::string& text);

// Keep the last `max_words` words of normalized text (sliding window).
std::string recent_window(const std::string& text, size_t max_words);

} // namespace teleprompter
