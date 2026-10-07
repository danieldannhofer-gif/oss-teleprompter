type WebView2 = {
  postMessage: (msg: unknown) => void
  addEventListener: (type: 'message', cb: (e: { data: unknown }) => void) => void
  removeEventListener: (type: 'message', cb: (e: { data: unknown }) => void) => void
}

const webview = (): WebView2 | undefined =>
  (window as unknown as { chrome?: { webview?: WebView2 } }).chrome?.webview

export function postMessage(msg: object): void {
  webview()?.postMessage(msg)
}

export function onMessage(handler: (msg: any) => void): () => void {
  const wv = webview()
  if (!wv) return () => {}
  const listener = (e: { data: unknown }) => handler(e.data)
  wv.addEventListener('message', listener)
  return () => wv.removeEventListener('message', listener)
}

export const isHosted = () => webview() !== undefined
