#pragma once
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#include <windows.h>
#include <string>
#include <functional>
#include <memory>

// Callback for remote commands received via WebSocket
// message format: {"type":"remote:command","command":"play"|"pause"|"speedUp"|"speedDown"|"prevSection"|"nextSection"}
using RemoteCommandCallback = std::function<void(const std::string& command)>;

// Callback for broadcasting state to connected remotes
// state format: {"type":"remote:state","isPlaying":bool,"speed":float,"currentSection":string,"scrollPosition":float}
using RemoteStateCallback = std::function<std::string()>;

class RemoteServer {
public:
    RemoteServer();
    ~RemoteServer();

    // Start the server on the given port. Binds to local interface only.
    // pin: optional PIN code for authentication (empty = no PIN)
    bool Start(int port, const std::string& pin);

    // Stop the server
    void Stop();

    // Check if server is running
    bool IsRunning() const;

    // Set the command callback (called when a remote sends a command)
    void SetCommandCallback(RemoteCommandCallback cb);

    // Set the state callback (called to get current state for broadcasting)
    void SetStateCallback(RemoteStateCallback cb);

    // Broadcast state to all connected remotes
    void BroadcastState();

    // Get the local IP address for display
    std::string GetLocalIP() const;

private:
    struct Impl;
    std::unique_ptr<Impl> pImpl;
};
