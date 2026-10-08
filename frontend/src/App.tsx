import { useState } from 'react';
import { useOverlay } from './hooks/useOverlay';
import { SettingsPanel } from './components/SettingsPanel';
import { PrompterView } from './components/PrompterView';
import { StatusBar } from './components/StatusBar';

function App() {
  const overlay = useOverlay();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'black',
        color: 'white',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Teleprompter</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: 4,
          }}
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>

      {/* Main prompter view */}
      <PrompterView />

      {/* Status bar */}
      <StatusBar />

      {/* Settings panel (overlay) */}
      {showSettings && (
        <div style={{ position: 'absolute', top: 60, right: 20, zIndex: 100 }}>
          <SettingsPanel overlay={overlay} />
        </div>
      )}
    </div>
  );
}

export default App;
