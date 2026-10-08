#include "settings.h"
#ifdef _WIN32

#include <filesystem>
#include <fstream>

namespace teleprompter {

Settings& Settings::Instance() {
    static Settings instance;
    return instance;
}

std::string Settings::FilePath() const {
    const char* appdata = std::getenv("APPDATA");
    std::filesystem::path dir = appdata ? appdata : std::filesystem::temp_dir_path();
    dir /= "Teleprompter";
    std::filesystem::create_directories(dir);
    return (dir / "settings.json").string();
}

nlohmann::json Settings::Load() {
    std::ifstream in(FilePath());
    if (!in) return nlohmann::json::object();
    try {
        return nlohmann::json::parse(in);
    } catch (...) {
        return nlohmann::json::object();
    }
}

void Settings::Save(const nlohmann::json& settings) {
    std::ofstream out(FilePath());
    out << settings.dump(2);
}

} // namespace teleprompter

#endif // _WIN32
