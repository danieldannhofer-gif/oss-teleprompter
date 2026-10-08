#include <gtest/gtest.h>
#include "../src/script/matcher.h"

TEST(Matcher, ExactMatch) {
    ScriptMatcher m({"Hello world", "This is a test"});
    auto result = m.Match("Hello world");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.lineIndex, 0);
}

TEST(Matcher, OffScript) {
    ScriptMatcher m({"Hello world"});
    auto result = m.Match("Something completely different");
    EXPECT_EQ(result.type, MatchType::OffScript);
}

TEST(Matcher, FuzzyMatch) {
    ScriptMatcher m({"The quick brown fox"});
    auto result = m.Match("quick brown fox");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.lineIndex, 0);
}

TEST(Matcher, JumpToLaterLine) {
    ScriptMatcher m({"Line one", "Line two", "Line three"});
    auto result = m.Match("Line three");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.lineIndex, 2);
}

TEST(Matcher, PartialTranscriptMatches) {
    ScriptMatcher m({"The quick brown fox jumps over the lazy dog"});
    auto result = m.Match("quick brown fox jumps");
    EXPECT_EQ(result.type, MatchType::OnScript);
}

TEST(Matcher, GermanText) {
    ScriptMatcher m({"Guten Tag und herzlich willkommen"});
    auto result = m.Match("Guten Tag willkommen");
    EXPECT_EQ(result.type, MatchType::OnScript);
}

TEST(Matcher, CaseInsensitive) {
    ScriptMatcher m({"Hello World"});
    auto result = m.Match("hello world");
    EXPECT_EQ(result.type, MatchType::OnScript);
}

TEST(Matcher, PunctuationIgnored) {
    ScriptMatcher m({"Hello, world!"});
    auto result = m.Match("Hello world");
    EXPECT_EQ(result.type, MatchType::OnScript);
}

TEST(Matcher, SlidingWindowAccumulates) {
    ScriptMatcher m({"The quick brown fox jumps over the lazy dog"});
    // Feed words one at a time
    m.Match("The");
    m.Match("quick");
    auto result = m.Match("brown fox jumps");
    EXPECT_EQ(result.type, MatchType::OnScript);
}

TEST(Matcher, EmptyTranscript) {
    ScriptMatcher m({"Hello world"});
    auto result = m.Match("");
    EXPECT_EQ(result.type, MatchType::OffScript);
}
