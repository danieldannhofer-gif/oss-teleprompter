// Remote control server — Windows-only implementation
// Uses Win32 HTTP Server API (http.sys) for HTTP + SSE
// Serves remote UI at /remote, accepts commands at /api/command, streams state at /api/state

#include "server.h"
#include <winsock2.h>
#include <ws2tcpip.h>
#include <iphlpapi.h>
#include <sstream>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <algorithm>

#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "ws2_32.lib")

// Minimal HTTP server using raw sockets (no external dependencies)
// Binds to local interface only for security

struct RemoteServer::Impl {
    SOCKET listenSocket = INVALID_SOCKET;
    std::atomic<bool> running{false};
    std::thread serverThread;
    std::mutex clientsMutex;
    std::vector<SOCKET> clients;
    RemoteCommandCallback commandCb;
    RemoteStateCallback stateCb;
    std::string pin;
    int port = 8765;
    std::string remoteUiHtml;

    void LoadRemoteUI();
    void HandleClient(SOCKET clientSocket);
    void BroadcastToClients(const std::string& message);
    std::string GetLocalIPAddress();
};

RemoteServer::RemoteServer() : pImpl(std::make_unique<Impl>()) {}
RemoteServer::~RemoteServer() { Stop(); }

bool RemoteServer::Start(int port, const std::string& pin) {
    pImpl->port = port;
    pImpl->pin = pin;
    pImpl->LoadRemoteUI();

    // Initialize Winsock
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) return false;

    // Create socket
    pImpl->listenSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (pImpl->listenSocket == INVALID_SOCKET) {
        WSACleanup();
        return false;
    }

    // Bind to local interface only (not 0.0.0.0)
    std::string localIP = pImpl->GetLocalIPAddress();
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(static_cast<u_short>(port));
    inet_pton(AF_INET, localIP.c_str(), &addr.sin_addr);

    if (bind(pImpl->listenSocket, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) == SOCKET_ERROR) {
        closesocket(pImpl->listenSocket);
        WSACleanup();
        return false;
    }

    if (listen(pImpl->listenSocket, SOMAXCONN) == SOCKET_ERROR) {
        closesocket(pImpl->listenSocket);
        WSACleanup();
        return false;
    }

    pImpl->running = true;
    pImpl->serverThread = std::thread([this]() {
        while (pImpl->running) {
            SOCKET client = accept(pImpl->listenSocket, nullptr, nullptr);
            if (client == INVALID_SOCKET) continue;
            std::thread(&Impl::HandleClient, pImpl.get(), client).detach();
        }
    });

    return true;
}

void RemoteServer::Stop() {
    pImpl->running = false;
    if (pImpl->listenSocket != INVALID_SOCKET) {
        closesocket(pImpl->listenSocket);
        pImpl->listenSocket = INVALID_SOCKET;
    }
    {
        std::lock_guard<std::mutex> lock(pImpl->clientsMutex);
        for (SOCKET c : pImpl->clients) closesocket(c);
        pImpl->clients.clear();
    }
    if (pImpl->serverThread.joinable()) pImpl->serverThread.join();
    WSACleanup();
}

bool RemoteServer::IsRunning() const { return pImpl->running; }

void RemoteServer::SetCommandCallback(RemoteCommandCallback cb) { pImpl->commandCb = cb; }
void RemoteServer::SetStateCallback(RemoteStateCallback cb) { pImpl->stateCb = cb; }

void RemoteServer::BroadcastState() {
    if (!pImpl->stateCb) return;
    std::string state = pImpl->stateCb();
    pImpl->BroadcastToClients("data: " + state + "\n\n");
}

std::string RemoteServer::GetLocalIP() const { return pImpl->GetLocalIPAddress(); }

// --- Impl methods ---

void RemoteServer::Impl::LoadRemoteUI() {
    // The remote UI is embedded as a string (loaded from remote_ui.html at build time)
    // For now, a minimal inline version — the full UI is in src/remote/remote_ui.html
    remoteUiHtml = R"HTML(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Teleprompter Remote</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, sans-serif; background: #111; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 20px; }
h1 { font-size: 14px; color: #888; }
.controls { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
button { width: 80px; height: 80px; border-radius: 50%; border: none; font-size: 24px; cursor: pointer; background: #333; color: #fff; }
button:active { transform: scale(0.95); }
button.play { background: #16a34a; }
button.pause { background: #dc2626; }
button.nav { background: #2563eb; width: 60px; height: 60px; font-size: 18px; }
.progress { width: 80%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; }
.progress-bar { height: 100%; background: #16a34a; transition: width 0.3s; }
.section { font-size: 14px; color: #aaa; }
.status { font-size: 12px; color: #666; }
</style>
</head>
<body>
<h1>Teleprompter Remote</h1>
<div class="section" id="section">No section</div>
<div class="controls">
<button class="nav" onclick="send('prevSection')">&#x25C0;</button>
<button id="playBtn" class="play" onclick="togglePlay()">&#x25B6;</button>
<button class="nav" onclick="send('nextSection')">&#x25B6;</button>
</div>
<div class="controls">
<button class="nav" onclick="send('speedDown')">&#x2796;</button>
<button class="nav" onclick="send('speedUp')">&#x2795;</button>
</div>
<div class="progress"><div class="progress-bar" id="progress" style="width:0%"></div></div>
<div class="status" id="status">Connecting...</div>
<script>
let playing = false;
const evtSource = new EventSource('/api/state');
evtSource.onmessage = (e) => {
  const state = JSON.parse(e.data);
  playing = state.isPlaying;
  document.getElementById('playBtn').className = playing ? 'pause' : 'play';
  document.getElementById('playBtn').innerHTML = playing ? '&#x23F8;' : '&#x25B6;';
  document.getElementById('section').textContent = state.currentSection || 'No section';
  document.getElementById('progress').style.width = (state.scrollPosition * 100) + '%';
  document.getElementById('status').textContent = 'Connected';
};
evtSource.onerror = () => { document.getElementById('status').textContent = 'Disconnected'; };
function send(cmd) { fetch('/api/command', { method: 'POST', body: JSON.stringify({ command: cmd }) }); }
function togglePlay() { send(playing ? 'pause' : 'play'); }
</script>
</body>
</html>)HTML";
}

void RemoteServer::Impl::HandleClient(SOCKET clientSocket) {
    char buffer[4096] = {};
    int received = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (received <= 0) { closesocket(clientSocket); return; }
    std::string request(buffer, received);

    // Parse request line
    std::string method, path;
    std::istringstream iss(request);
    iss >> method >> path;

    // PIN check
    if (!pin.empty()) {
        // Simple PIN check via query param or header
        if (request.find("pin=" + pin) == std::string::npos &&
            request.find("X-PIN: " + pin) == std::string::npos) {
            std::string resp = "HTTP/1.1 401 Unauthorized\r\nContent-Length: 0\r\n\r\n";
            send(clientSocket, resp.c_str(), static_cast<int>(resp.size()), 0);
            closesocket(clientSocket);
            return;
        }
    }

    if (path == "/remote" || path == "/") {
        // Serve remote UI
        std::string resp = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: " +
            std::to_string(remoteUiHtml.size()) + "\r\n\r\n" + remoteUiHtml;
        send(clientSocket, resp.c_str(), static_cast<int>(resp.size()), 0);
        closesocket(clientSocket);
    }
    else if (path == "/api/state") {
        // SSE endpoint for state updates
        std::string resp = "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-cache\r\nConnection: keep-alive\r\n\r\n";
        send(clientSocket, resp.c_str(), static_cast<int>(resp.size()), 0);
        {
            std::lock_guard<std::mutex> lock(clientsMutex);
         
