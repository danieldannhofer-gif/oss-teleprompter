#include "string_utils.h"

#include <algorithm>
#include <cctype>
#include <vector>

namespace teleprompter {

std::string normalize(const std::string& text) {
    std::string out;
    out.reserve(text.size());
    bool lastWasSpace = true;
    for (unsigned char c : text) {
        if (std::isalnum(c)) {
            out.push_back(static_cast<char>(std::tolower(c)));
            lastWasSpace = false;
        } else if (!lastWasSpace && !out.empty()) {
            out.push_back(' ');
            lastWasSpace = true;
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

    std::vector<size_t> prev(m + 1);
    std::vector<size_t> curr(m + 1);
    for (size_t j = 0; j <= m; ++j) prev[j] = j;

    for (size_t i = 1; i <= n; ++i) {
        curr[0] = i;
        for (size_t j = 1; j <= m; ++j) {
            size_t cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            curr[j] = std::min({prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost});
        }
        std::swap(prev, curr);
    }
    return prev[m];
}

double similarity(const std::string& a, const std::string& b) {
    if (a.empty() && b.empty()) return 1.0;
    const size_t maxLen = std::max(a.size(), b.size());
    if (maxLen == 0) return 1.0;
    const size_t dist = levenshtein(a, b);
    return 1.0 - static_cast<double>(dist) / static_cast<double>(maxLen);
}

}  // namespace teleprompter
