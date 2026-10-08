#include <gtest/gtest.h>
#include "../src/utils/string_utils.h"

TEST(StringUtils, NormalizeRemovesPunctuation) {
    EXPECT_EQ(normalize("Hello, World!"), "hello world");
}

TEST(StringUtils, NormalizeLowercases) {
    EXPECT_EQ(normalize("HELLO"), "hello");
}

TEST(StringUtils, NormalizeCollapsesWhitespace) {
    EXPECT_EQ(normalize("hello   world"), "hello world");
}

TEST(StringUtils, NormalizeEmptyString) {
    EXPECT_EQ(normalize(""), "");
}

TEST(StringUtils, NormalizeOnlyPunctuation) {
    EXPECT_EQ(normalize("!!! ??? ..."), "");
}

TEST(StringUtils, LevenshteinIdentical) {
    EXPECT_EQ(levenshtein("hello", "hello"), 0);
}

TEST(StringUtils, LevenshteinEmpty) {
    EXPECT_EQ(levenshtein("", "abc"), 3);
    EXPECT_EQ(levenshtein("abc", ""), 3);
}

TEST(StringUtils, LevenshteinClassic) {
    EXPECT_EQ(levenshtein("kitten", "sitting"), 3);
}

TEST(StringUtils, SimilarityIdentical) {
    EXPECT_NEAR(similarity("hello world", "hello world"), 1.0f, 0.01f);
}

TEST(StringUtils, SimilarityCompletelyDifferent) {
    EXPECT_NEAR(similarity("abc", "xyz"), 0.0f, 0.1f);
}

TEST(StringUtils, SimilarityPartial) {
    float sim = similarity("hello world", "hello there");
    EXPECT_GT(sim, 0.5f);
    EXPECT_LT(sim, 1.0f);
}

TEST(StringUtils, Tokenize) {
    auto tokens = tokenize("hello world test");
    ASSERT_EQ(tokens.size(), 3u);
    EXPECT_EQ(tokens[0], "hello");
    EXPECT_EQ(tokens[1], "world");
    EXPECT_EQ(tokens[2], "test");
}

TEST(StringUtils, JaccardIdentical) {
    std::vector<std::string> a = {"hello", "world"};
    EXPECT_NEAR(jaccardSimilarity(a, a), 1.0f, 0.01f);
}

TEST(StringUtils, JaccardDisjoint) {
    std::vector<std::string> a = {"hello"};
    std::vector<std::string> b = {"world"};
    EXPECT_NEAR(jaccardSimilarity(a, b), 0.0f, 0.01f);
}
