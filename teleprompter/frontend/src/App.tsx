import { useState } from 'react';
import { useOverlay } from './hooks/useOverlay';
import { useVoiceTracking } from './hooks/useVoiceTracking';
import { usePrompter } from './hooks/usePrompter';
import { SettingsPanel } from './components/SettingsPanel';
import { PrompterView } from './components/PrompterView';
import { StatusBar } from './components/StatusBar';
import { ScriptEditor } from './components/ScriptEditor';

function App() {
  const overlay = useOverlay();
  const prompter = usePrompter();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const voice = useVoiceTracking(voiceEnabled && prompter.lines.length > 0);

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
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Teleprompter</h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Script import */}
          <button
            onClick={() => setShowEditor(true)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
            }}
          >
            Import Script
          </button>

          {/* Voice tracking toggle */}
          <button
            onClick={() => {
              if (voiceEnabled) {
                voice.stopListening();
                setVoiceEnabled(false);
              } else {
                voice.startListening();
                setVoiceEnabled(true);
              }
            }}
            disabled={prompter.lines.length === 0}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              cursor: prompter.lines.length === 0 ? 'not-allowed' : 'pointer',
              background: voice.isListening ? '#dc2626' : '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              opacity: prompter.lines.length === 0 ? 0.5 : 1,
            }}
          >
            {voice.isListening ? 'Stop Listening' : 'Start Voice Tracking'}
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => prompter.togglePlay()}
            disabled={prompter.lines.length === 0}
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
            {prompter.isPlaying ? 'Pause' : 'Play'}
          </button>

          {/* Settings */}
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
            {showSettings ? 'Hide' : 'Settings'}
          </button>
        </div>
      </div>

      {/* Voice status indicator */}
      {voice.isListening && (
        <div
          style={{
            padding: '4px 20px',
            background: 'rgba(22, 163, 74, 0.2)',
            fontSize: 12,
            color: '#4ade80',
          }}
        >
          Listening... {voice.lastTranscript && `"${voice.lastTranscript}"`}
        </div>
      )}
      {voice.error && (
        <div
          style={{
            padding: '4px 20px',
            background: 'rgba(220, 38, 38, 0.2)',
            fontSize: 12,
            color: '#f87171',
          }}
        >
          Error: {voice.error}
        </div>
      )}

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

      {/* Script editor modal */}
      {showEditor && <ScriptEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}

export default App;
