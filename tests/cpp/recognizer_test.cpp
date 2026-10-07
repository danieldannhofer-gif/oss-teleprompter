#include <cstdio>
#include <filesystem>
#include <string>

#include "speech/model.h"

int main() {
    const std::string tinyModel = "models/ggml-tiny.bin";
    if (!std::filesystem::exists(tinyModel)) {
        std::printf("SKIP: whisper model not found at %s\n", tinyModel.c_str());
        return 0;
    }

    teleprompter::Model model;
    if (!model.load(tinyModel)) {
        std::printf("FAIL: model.load() returned false\n");
        return 1;
    }
    if (!model.isLoaded()) {
        std::printf("FAIL: model not loaded\n");
        return 1;
    }
    std::printf("recognizer_test PASS\n");
    return 0;
}
