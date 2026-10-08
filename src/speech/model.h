#pragma once
#ifdef _WIN32

#include <string>

struct whisper_context;

namespace teleprompter {

// Owns a loaded whisper.cpp model.
class Model {
public:
    ~Model();

    bool Load(const std::string& path);
    bool IsLoaded() const { return ctx_ != nullptr; }
    whisper_context* ctx() { return ctx_; }

private:
    whisper_context* ctx_ = nullptr;
};

} // namespace teleprompter

#endif // _WIN32
