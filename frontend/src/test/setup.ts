import { beforeEach } from 'vitest';

// Test setup: mock WebView2 IPC and browser APIs not available in jsdom

interface MockWebView {
  postMessage: (message: unknown) => void;
  addEventListener: (type: 'message', listener: (e: { data: unknown }) => void) => void;
  removeEventListener: (type: 'message', listener: (e: { data: unknown }) => void) => void;
  _listeners: Array<(e: { data: unknown }) => void>;
  _sentMessages: unknown[];
}

function createMockWebView(): MockWebView {
  const listeners: Array<(e: { data: unknown }) => void> = [];
  const sentMessages: unknown[] = [];

  return {
    postMessage: (message: unknown) => {
      sentMessages.push(message);
    },
    addEventListener: (_type: 'message', listener: (e: { data: unknown }) => void) => {
      listeners.push(listener);
    },
    removeEventListener: (_type: 'message', listener: (e: { data: unknown }) => void) => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    _listeners: listeners,
    _sentMessages: sentMessages,
  };
}

// Install mock on window before each test
beforeEach(() => {
  const mock = createMockWebView();
  (window as unknown as { chrome: { webview: MockWebView } }).chrome = { webview: mock };
});

// Helper to simulate a message from the C++ backend
export function simulateBackendMessage(data: unknown): void {
  const wv = (window as unknown as { chrome: { webview: MockWebView } }).chrome?.webview;
  if (!wv) throw new Error('WebView2 mock not installed');
  for (const listener of [...wv._listeners]) {
    listener({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }
}

// Helper to get messages sent to the backend
export function getSentMessages(): unknown[] {
  const wv = (window as unknown as { chrome: { webview: MockWebView } }).chrome?.webview;
  if (!wv) throw new Error('WebView2 mock not installed');
  return wv._sentMessages;
}

// Helper to clear sent messages
export function clearSentMessages(): void {
  const wv = (window as unknown as { chrome: { webview: MockWebView } }).chrome?.webview;
  if (!wv) throw new Error('WebView2 mock not installed');
  wv._sentMessages.length = 0;
}
