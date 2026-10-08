#include "speech/model.h"
#ifdef _WIN32

#include <whisper.h>

namespace teleprompter {

Model::~Model() {
    if (ctx_) whisper_free(ctx_);
}

bool Model::Load(const std::string& path) {
    if (ctx_) {
        whisper_free(ctx_);
        ctx_ = nullptr;
    }
    ctx_ = whisper_init_from_file_with_params(path.c_str(), whisper_init_default_params());
    return ctx_ != nullptr;
}

} // namespace teleprompter

#endif // _WIN32
