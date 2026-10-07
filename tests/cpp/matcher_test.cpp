#include <gtest/gtest.h>
#include "script/matcher.h"

using namespace teleprompter;

TEST(Matcher, ExactMatch) {
    Matcher m({"Hello world", "This is a test"});
    auto result = m.Match("Hello world");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 0);
}

TEST(Matcher, OffScript) {
    Matcher m({"Hello world"});
    auto result = m.Match("Something completely different");
    EXPECT_EQ(result.type, MatchType::OffScript);
}

TEST(Matcher, FuzzyMatch) {
    Matcher m({"The quick brown fox"});
    auto result = m.Match("quick brown fox");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 0);
}

TEST(Matcher, JumpToLaterLine) {
    Matcher m({"Line one", "Line two", "Line three"});
    auto result = m.Match("Line three");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 2);
}

TEST(Matcher, PartialTranscriptMatches) {
    Matcher m({"The quick brown fox jumps over the lazy dog"});
    auto result = m.Match("quick brown fox jumps");
    EXPECT_EQ(result.type, MatchType::OnScript);
}

TEST(Matcher, RecoversAfterOffScript) {
    Matcher m({"Line one", "Line two", "Line three"});
    EXPECT_EQ(m.Match("completely unrelated rambling").type, MatchType::OffScript);
    auto result = m.Match("Line three");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 2);
}

TEST(Matcher, PrefersForwardProgress) {
    Matcher m({"Repeat this", "Repeat this", "Repeat this again"});
    m.set_current_line(1);
    auto result = m.Match("Repeat this again");
    EXPECT_EQ(result.type, MatchType::OnScript);
    EXPECT_EQ(result.line_index, 2);
}

TEST(Matcher, EmptyScriptIsOffScript) {
    Matcher m({});
    EXPECT_EQ(m.Match("anything").type, MatchType::OffScript);
}
