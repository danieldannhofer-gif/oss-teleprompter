#pragma once
#ifdef _WIN32

#include <nlohmann/json.hpp>
#include <string>

namespace teleprompter {

// Loads/saves the settings JSON in %APPDATA%/Teleprompter/settings.json.
class Settings {
public:
    static Settings& Instance();

    nlohmann::json Load();
    void Save(const nlohmann::json& settings);

private:
    std::string FilePath() const;
};

} // namespace teleprompter

#endif // _WIN32
