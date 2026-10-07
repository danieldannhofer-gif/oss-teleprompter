#include "utils/string_utils.h"

#include <algorithm>
#include <cctype>

namespace teleprompter {

std::string normalize(const std::string& text) {
    std::string out;
    out.reserve(text.size());
    bool last_was_space = true;
    for (unsigned char c : text) {
        if (std::isalpha(c) || std::isdigit(c)) {
            out.push_back(static_cast<char>(std::tolower(c)));
            last_was_space = false;
        } else if (!last_was_space) {
            out.push_back(' ');
            last_was_space = true;
        }
    }
    while (!out.empty() && out.back() == ' ') out.pop_back();
    return out;
}

size_t levenshtein(const std::string& a, const std::string& b) {
    const size_t n = a.size();
    const size_t m = b.size();
    if (n == 0) return m;
    if (m == 0) return n;
    std::vector<size_t> prev(m + 1), cur(m + 1);
    for (size_t j = 0; j <= m; ++j) prev[j] = j;
    for (size_t i = 1; i <= n; ++i) {
        cur[0] = i;
        for (size_t j = 1; j <= m; ++j) {
            size_t cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            cur[j] = std::min({prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost});
        }
        std::swap(prev, cur);
    }
    return prev[m];
}

double similarity(const std::string& a, const std::string& b) {
    const size_t max_len = std::max(a.size(), b.size());
    if (max_len == 0) return 1.0;
    return 1.0 - static_cast<double>(levenshtein(a, b)) / static_cast<double>(max_len);
}

std::vector<std::string> tokenize(const std::string& text) {
    std::vector<std::string> words;
    const std::string norm = normalize(text);
    size_t pos = 0;
    while (pos < norm.size()) {
        size_t space = norm.find(' ', pos);
        if (space == std::string::npos) space = norm.size();
        if (space > pos) words.push_back(norm.substr(pos, space - pos));
        pos = space + 1;
    }
    return words;
}

std::string recent_window(const std::string& text, size_t max_words) {
    const std::vector<std::string> words = tokenize(text);
    if (words.size() <= max_words) return normalize(text);
    std::string out;
    for (size_t i = words.size() - max_words; i < words.size(); ++i) {
        if (!out.empty()) out.push_back(' ');
        out += words[i];
    }
    return out;
}

} // namespace teleprompter
