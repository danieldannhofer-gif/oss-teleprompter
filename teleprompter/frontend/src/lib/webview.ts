// WebView2 IPC wrapper
// Provides typed message passing between React frontend and C++ backend

interface WebView2 {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (e: { data: unknown }) => void): void;
  removeEventListener(type: 'message', listener: (e: { data: unknown }) => void): void;
}

declare global {
  interface Window {
    chrome?: {
      webview?: WebView2;
    };
  }
}

function getWebView(): WebView2 | null {
  return window.chrome?.webview ?? null;
}

/**
 * Send a message to the C++ backend.
 * Message format: { type: string, ...payload }
 */
export function postToBackend(message: Record<string, unknown>): void {
  const wv = getWebView();
  if (wv) {
    wv.postMessage(message);
  } else {
    console.warn('[webview] Not running in WebView2, message not sent:', message);
  }
}

/**
 * Listen for messages from the C++ backend.
 * Returns an unsubscribe function.
 */
export function onBackendMessage(
  handler: (message: Record<string, unknown>) => void
): () => void {
  const wv = getWebView();
  if (!wv) {
    console.warn('[webview] Not running in WebView2, cannot listen for messages');
    return () => {};
  }

  const listener = (e: { data: unknown }) => {
    if (typeof e.data === 'string') {
      try {
        handler(JSON.parse(e.data) as Record<string, unknown>);
      } catch {
        handler({ raw: e.data });
      }
    } else {
      handler(e.data as Record<string, unknown>);
    }
  };

  wv.addEventListener('message', listener);
  return () => wv.removeEventListener('message', listener);
}

// --- Typed message helpers ---

export const overlayMessages = {
  toggle: (enabled: boolean) => postToBackend({ type: 'overlay:toggle', enabled }),
  clickThrough: (enabled: boolean) => postToBackend({ type: 'overlay:clickThrough', enabled }),
  alwaysOnTop: (enabled: boolean) => postToBackend({ type: 'overlay:alwaysOnTop', enabled }),
};

export const windowMessages = {
  dock: (position: 'none' | 'top' | 'bottom', heightPercent: number) =>
    postToBackend({ type: 'window:dock', position, heightPercent }),
};

export const speechMessages = {
  start: () => postToBackend({ type: 'speech:start' }),
  stop: () => postToBackend({ type: 'speech:stop' }),
  setLanguage: (lang: string) => postToBackend({ type: 'speech:setLanguage', lang }),
};

export const scriptMessages = {
  match: (transcript: string) => postToBackend({ type: 'script:match', transcript }),
};

export const settingsMessages = {
  get: () => postToBackend({ type: 'settings:get' }),
  set: (settings: Record<string, unknown>) => postToBackend({ type: 'settings:set', ...settings }),
};
