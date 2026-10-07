import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [backendReady, setBackendReady] = useState(false)

  useEffect(() => {
    const w = window as unknown as {
      chrome?: {
        webview?: {
          addEventListener: (t: string, l: () => void) => void
          postMessage: (m: string) => void
        }
      }
    }
    const webview = w.chrome?.webview
    if (webview) {
      webview.addEventListener('message', () => setBackendReady(true))
      webview.postMessage(JSON.stringify({ type: 'frontend:ready' }))
    }
  }, [])

  return (
    <main className="prompter">
      <h1>Teleprompter</h1>
      <p>{backendReady ? 'Connected to native host' : 'Standalone dev mode'}</p>
    </main>
  )
}

export default App
