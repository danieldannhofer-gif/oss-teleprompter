#include <cmath>
#include <cstdio>

#include "utils/string_utils.h"

static int failures = 0;

#define EXPECT_EQ(a, b)                                     \
    do {                                                    \
        if (!((a) == (b))) {                                \
            std::printf("FAIL %s:%d: %s != %s\n", __FILE__, __LINE__, \
                        #a, #b);                            \
            ++failures;                                     \
        }                                                   \
    } while (0)

#define EXPECT_NEAR(a, b, tol)                                          \
    do {                                                                \
        if (std::abs((a) - (b)) > (tol)) {                              \
            std::printf("FAIL %s:%d: %s != %s (+-%s)\n", __FILE__, __LINE__, \
                        #a, #b, #tol);                                  \
            ++failures;                                                 \
        }                                                               \
    } while (0)

int main() {
    EXPECT_EQ(teleprompter::normalize("Hello, World!"), std::string("hello world"));
    EXPECT_EQ(teleprompter::normalize("HELLO"), std::string("hello"));
    EXPECT_EQ(teleprompter::normalize("  Multiple   spaces  "), std::string("multiple spaces"));

    EXPECT_EQ(teleprompter::levenshtein("kitten", "sitting"), size_t(3));
    EXPECT_EQ(teleprompter::levenshtein("hello", "hello"), size_t(0));

    EXPECT_NEAR(teleprompter::similarity("hello world", "hello world"), 1.0, 0.01);
    EXPECT_NEAR(teleprompter::similarity("hello world", "hello there"), 0.6, 0.1);
    EXPECT_NEAR(teleprompter::similarity("abc", "xyz"), 0.0, 0.1);

    if (failures == 0) {
        std::printf("string_utils_test PASS\n");
        return 0;
    }
    std::printf("string_utils_test FAIL (%d)\n", failures);
    return 1;
}
