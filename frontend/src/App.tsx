import { useOverlay } from './hooks/useOverlay'
import './App.css'

function App() {
  const { overlay, clickThrough, alwaysOnTop, toggleOverlay, toggleClickThrough, toggleAlwaysOnTop } =
    useOverlay()

  return (
    <main className="prompter">
      <h1>Teleprompter</h1>
      <div className="controls">
        <button type="button" onClick={toggleOverlay}>
          Overlay: {overlay ? 'on' : 'off'}
        </button>
        <button type="button" onClick={toggleClickThrough}>
          Click-through: {clickThrough ? 'on' : 'off'}
        </button>
        <button type="button" onClick={toggleAlwaysOnTop}>
          Always on top: {alwaysOnTop ? 'on' : 'off'}
        </button>
      </div>
    </main>
  )
}

export default App
