type MessageHandler = (msg: unknown) => void

interface ChromeWebview {
  postMessage: (msg: string) => void
  addEventListener: (t: 'message', l: (e: { data: string }) => void) => void
}

function getWebview(): ChromeWebview | undefined {
  return (window as unknown as { chrome?: { webview?: ChromeWebview } }).chrome?.webview
}

export function postMessage(msg: object): void {
  getWebview()?.postMessage(JSON.stringify(msg))
}

export function onMessage(handler: MessageHandler): void {
  getWebview()?.addEventListener('message', (e) => handler(JSON.parse(e.data)))
}
