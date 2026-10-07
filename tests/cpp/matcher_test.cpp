#include <cstdio>
#include <string>
#include <vector>

#include "script/matcher.h"

static int failures = 0;

#define EXPECT_EQ(a, b)                                     \
    do {                                                    \
        if (!((a) == (b))) {                                \
            std::printf("FAIL %s:%d: %s != %s\n", __FILE__, __LINE__, \
                        #a, #b);                            \
            ++failures;                                     \
        }                                                   \
    } while (0)

int main() {
    {
        teleprompter::Matcher m({"Hello world", "This is a test"});
        auto r = m.match("Hello world");
        EXPECT_EQ(r.type, teleprompter::MatchType::OnScript);
        EXPECT_EQ(r.lineIndex, 0);
    }
    {
        teleprompter::Matcher m({"Hello world"});
        auto r = m.match("Something completely different");
        EXPECT_EQ(r.type, teleprompter::MatchType::OffScript);
    }
    {
        teleprompter::Matcher m({"The quick brown fox"});
        auto r = m.match("quick brown fox");
        EXPECT_EQ(r.type, teleprompter::MatchType::OnScript);
        EXPECT_EQ(r.lineIndex, 0);
    }
    {
        teleprompter::Matcher m({"Line one", "Line two", "Line three"});
        auto r = m.match("Line three");
        EXPECT_EQ(r.type, teleprompter::MatchType::OnScript);
        EXPECT_EQ(r.lineIndex, 2);
    }
    {
        teleprompter::Matcher m({"The quick brown fox jumps over the lazy dog"});
        auto r = m.match("quick brown fox jumps");
        EXPECT_EQ(r.type, teleprompter::MatchType::OnScript);
    }

    if (failures == 0) {
        std::printf("matcher_test PASS\n");
        return 0;
    }
    std::printf("matcher_test FAIL (%d)\n", failures);
    return 1;
}
