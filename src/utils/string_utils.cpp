#include "string_utils.h"
#include <algorithm>
#include <cctype>
#include <sstream>
#include <set>

std::string normalize(const std::string& text) {
    std::string result;
    result.reserve(text.size());

    bool lastWasSpace = true; // collapse leading spaces

    for (char c : text) {
        if (std::isalnum(static_cast<unsigned char>(c))) {
            result += static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            lastWasSpace = false;
        } else if (!lastWasSpace) {
            result += ' ';
            lastWasSpace = true;
        }
    }

    // Trim trailing space
    while (!result.empty() && result.back() == ' ') {
        result.pop_back();
    }

    return result;
}

int levenshtein(const std::string& a, const std::string& b) {
    const size_t m = a.size();
    const size_t n = b.size();

    if (m == 0) return static_cast<int>(n);
    if (n == 0) return static_cast<int>(m);

    std::vector<int> prev(n + 1);
    std::vector<int> curr(n + 1);

    for (size_t j = 0; j <= n; j++) {
        prev[j] = static_cast<int>(j);
    }

    for (size_t i = 1; i <= m; i++) {
        curr[0] = static_cast<int>(i);
        for (size_t j = 1; j <= n; j++) {
            int cost = (a[i - 1] == b[j - 1]) ? 0 : 1;
            curr[j] = std::min({prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost});
        }
        std::swap(prev, curr);
    }

    return prev[n];
}

float similarity(const std::string& a, const std::string& b) {
    if (a.empty() && b.empty()) return 1.0f;
    if (a.empty() || b.empty()) return 0.0f;

    int dist = levenshtein(a, b);
    size_t maxLen = std::max(a.size(), b.size());
    return 1.0f - static_cast<float>(dist) / static_cast<float>(maxLen);
}

std::vector<std::string> tokenize(const std::string& text) {
    std::vector<std::string> tokens;
    std::istringstream iss(text);
    std::string token;
    while (iss >> token) {
        tokens.push_back(token);
    }
    return tokens;
}

float jaccardSimilarity(const std::vector<std::string>& a, const std::vector<std::string>& b) {
    if (a.empty() && b.empty()) return 1.0f;
    if (a.empty() || b.empty()) return 0.0f;

    std::set<std::string> setA(a.begin(), a.end());
    std::set<std::string> setB(b.begin(), b.end());

    size_t intersection = 0;
    for (const auto& item : setA) {
        if (setB.count(item) > 0) {
            intersection++;
        }
    }

    size_t unionSize = setA.size() + setB.size() - intersection;
    if (unionSize == 0) return 0.0f;

    return static_cast<float>(intersection) / static_cast<float>(unionSize);
}
