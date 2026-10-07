#include <gtest/gtest.h>
#include "utils/string_utils.h"

using namespace teleprompter;

TEST(StringUtils, NormalizeRemovesPunctuation) {
    EXPECT_EQ(normalize("Hello, World!"), "hello world");
}

TEST(StringUtils, NormalizeLowercases) {
    EXPECT_EQ(normalize("HELLO"), "hello");
}

TEST(StringUtils, NormalizeCollapsesWhitespace) {
    EXPECT_EQ(normalize("  Hello   world  "), "hello world");
}

TEST(StringUtils, LevenshteinDistance) {
    EXPECT_EQ(levenshtein("kitten", "sitting"), 3);
    EXPECT_EQ(levenshtein("hello", "hello"), 0);
}

TEST(StringUtils, SimilarityRatio) {
    EXPECT_NEAR(similarity("hello world", "hello world"), 1.0, 0.01);
    EXPECT_NEAR(similarity("hello world", "hello there"), 0.6, 0.1);
    EXPECT_NEAR(similarity("abc", "xyz"), 0.0, 0.1);
}

TEST(StringUtils, Tokenize) {
    EXPECT_EQ(tokenize("The quick, brown fox!"), (std::vector<std::string>{"the", "quick", "brown", "fox"}));
}

TEST(StringUtils, RecentWindowKeepsLastWords) {
    EXPECT_EQ(recent_window("one two three four five", 2), "four five");
    EXPECT_EQ(recent_window("one two", 10), "one two");
}
