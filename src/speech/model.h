#pragma once

#include <string>

struct whisper_context;

namespace teleprompter {

class Model {
public:
    Model() = default;
    ~Model();

    Model(const Model&) = delete;
    Model& operator=(const Model&) = delete;

    bool load(const std::string& path);
    bool isLoaded() const { return ctx_ != nullptr; }
    whisper_context* raw() { return ctx_; }

private:
    whisper_context* ctx_ = nullptr;
};

}  // namespace teleprompter
