#pragma once
#include "script/types.h"
#include <functional>
#include <map>
#include <string>

namespace teleprompter {

// Routes JSON messages between the native host and the web frontend.
// Transport-agnostic: the platform layer feeds strings in and gets strings out.
class IpcRouter {
public:
    using Handler = std::function<std::string(const std::string&)>;

    void Register(const std::string& type, Handler handler);
    bool Has(const std::string& type) const;
    // Returns the JSON reply produced by the handler ("" if none).
    std::string Dispatch(const std::string& message);
    // Convenience overload for tests / direct calls.
    std::string Dispatch(const std::string& type, const std::string& payload);

private:
    std::map<std::string, Handler> handlers_;
};

// Shared helpers for message serialization (nlohmann/json based).
std::string MakeReply(const std::string& type, const MatchResult& result);
std::string MakeEvent(const std::string& type, const std::string& payload_json);

} // namespace teleprompter
