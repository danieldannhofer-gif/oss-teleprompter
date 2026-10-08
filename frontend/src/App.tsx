import { useState } from 'react';
import { useOverlay } from './hooks/useOverlay';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const overlay = useOverlay();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      style={{
        color: 'white',
        background: 'black',
        minHeight: '100vh',
        padding: 40,
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <h1>Teleprompter</h1>
      <p>Voice-tracking teleprompter with transparent overlay.</p>

      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          padding: '8px 16px',
          fontSize: 14,
          cursor: 'pointer',
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: 4,
        }}
      >
        {showSettings ? 'Hide Settings' : 'Show Settings'}
      </button>

      {showSettings && (
        <div style={{ position: 'absolute', top: 100, right: 40, zIndex: 100 }}>
          <SettingsPanel overlay={overlay} />
        </div>
      )}
    </div>
  );
}

export default App;
