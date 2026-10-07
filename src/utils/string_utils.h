#pragma once

#include <string>

namespace teleprompter {

std::string normalize(const std::string& text);
size_t levenshtein(const std::string& a, const std::string& b);
double similarity(const std::string& a, const std::string& b);

}  // namespace teleprompter
