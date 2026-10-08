#include "ipc/ipc.h"
#include <script/types.h>
#include <nlohmann/json.hpp>

namespace teleprompter {

void IpcRouter::Register(const std::string& type, Handler handler) {
    handlers_[type] = std::move(handler);
}

bool IpcRouter::Has(const std::string& type) const {
    return handlers_.find(type) != handlers_.end();
}

std::string IpcRouter::Dispatch(const std::string& message) {
    auto json = nlohmann::json::parse(message, nullptr, false);
    if (json.is_discarded() || !json.contains("type")) return {};
    const std::string type = json["type"].get<std::string>();
    auto it = handlers_.find(type);
    if (it == handlers_.end()) return {};
    return it->second(json.dump());
}

std::string IpcRouter::Dispatch(const std::string& type, const std::string& payload) {
    auto it = handlers_.find(type);
    if (it == handlers_.end()) return {};
    return it->second(payload);
}

std::string MakeReply(const std::string& type, const MatchResult& result) {
    nlohmann::json j;
    j["type"] = type;
    j["onScript"] = result.type == MatchType::OnScript;
    j["lineIndex"] = result.line_index;
    j["confidence"] = result.confidence;
    return j.dump();
}

std::string MakeEvent(const std::string& type, const std::string& payload_json) {
    nlohmann::json j = nlohmann::json::parse(payload_json, nullptr, false);
    if (j.is_discarded()) j = nlohmann::json::object();
    j["type"] = type;
    return j.dump();
}

} // namespace teleprompter
