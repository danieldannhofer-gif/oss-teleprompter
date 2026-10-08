#pragma once
#include <string>
#include <vector>

// Normalize text: lowercase, remove punctuation, collapse whitespace
std::string normalize(const std::string& text);

// Compute Levenshtein edit distance between two strings
int levenshtein(const std::string& a, const std::string& b);

// Compute similarity ratio (0.0 - 1.0) between two strings
float similarity(const std::string& a, const std::string& b);

// Tokenize text into words
std::vector<std::string> tokenize(const std::string& text);

// Compute Jaccard similarity between two token sets
float jaccardSimilarity(const std::vector<std::string>& a, const std::vector<std::string>& b);
