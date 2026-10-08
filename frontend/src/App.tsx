import { useState, useEffect } from 'react';
import { useOverlay } from './hooks/useOverlay';
import { useVoiceTracking } from './hooks/useVoiceTracking';
import { usePrompter } from './hooks/usePrompter';
import { useKeyboard } from './hooks/useKeyboard';
import { useSettings } from './hooks/useSettings';
import { t } from './lib/i18n';
import { windowMessages } from './lib/webview';
import { SettingsPanel } from './components/SettingsPanel';
import { PrompterView } from './components/PrompterView';
import { StatusBar } from './components/StatusBar';
import { ScriptEditor } from './components/ScriptEditor';
import { Timeline } from './components/Timeline';

type DockPosition = 'none' | 'top' | 'bottom';

function App() {
  const overlay = useOverlay();
  const prompter = usePrompter();
  const { setLanguage, currentLanguage } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [dockPosition, setDockPosition] = useState<DockPosition>(() => {
    try {
      const raw = localStorage.getItem('teleprompter-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.dockPosition ?? 'none';
      }
    } catch { /* ignore */ }
    return 'none';
  });
  const [showTimeline, setShowTimeline] = useState(() => {
    try {
      const raw = localStorage.getItem('teleprompter-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.showTimeline !== false;
      }
    } catch { /* ignore */ }
    return true;
  });

  // Apply dock on mount
  useEffect(() => {
    if (dockPosition !== 'none') {
      const height = (() => {
        try {
          const raw = localStorage.getItem('teleprompter-settings');
          if (raw) return JSON.parse(raw).dockHeightPercent ?? 60;
        } catch { /* ignore */ }
        return 60;
      })();
      windowMessages.dock(dockPosition, height);
    }
  }, []);

  // Listen for timeline toggle from SettingsPanel
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ show: boolean }>).detail;
      setShowTimeline(detail.show);
    };
    window.addEventListener('teleprompter:timelineToggle', handler);
    return () => window.removeEventListener('teleprompter:timelineToggle', handler);
  }, []);

  const voice = useVoiceTracking(voiceEnabled && prompter.lines.length > 0);

  const handleDock = (pos: DockPosition) => {
    setDockPosition(pos);
    let height = 60;
    try {
      const raw = localStorage.getItem('teleprompter-settings');
      if (raw) height = JSON.parse(raw).dockHeightPercent ?? 60;
    } catch { /* ignore */ }
    windowMessages.dock(pos, height);
    // Persist
    try {
      const raw = localStorage.getItem('teleprompter-settings');
      const settings = raw ? JSON.parse(raw) : {};
      settings.dockPosition = pos;
      localStorage.setItem('teleprompter-settings', JSON.stringify(settings));
    } catch { /* ignore */ }
  };

  // Keyboard shortcuts
  useKeyboard({
    onToggleOverlay: overlay.toggleOverlay,
    onToggleClickThrough: overlay.toggleClickThrough,
    onDockTop: () => handleDock(dockPosition === 'top' ? 'none' : 'top'),
    onDockBottom: () => handleDock(dockPosition === 'bottom' ? 'none' : 'bottom'),
    onDockNone: () => handleDock('none'),
    onStartStopListening: () => {
      if (voiceEnabled) {
        voice.stopListening();
        setVoiceEnabled(false);
      } else {
        voice.startListening();
        setVoiceEnabled(true);
      }
    },
  });

  const toggleVoice = () => {
    if (voiceEnabled) {
      voice.stopListening();
      setVoiceEnabled(false);
    } else {
      voice.startListening();
      setVoiceEnabled(true);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>{t('appName')}</h1>
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(currentLanguage === 'en' ? 'de' : 'en')}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              cursor: 'pointer',
              background: '#333',
              color: '#aaa',
              border: '1px solid #444',
              borderRadius: 4,
            }}
          >
            {currentLanguage.toUpperCase()}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Dock toggle */}
          <button
            onClick={() => handleDock(dockPosition === 'top' ? 'none' : 'top')}
            title="Dock to top (F3)"
            style={{
              padding: '6px 10px', fontSize: 13, cursor: 'pointer',
              background: dockPosition === 'top' ? '#2563eb' : '#333',
              color: '#fff', border: '1px solid #555', borderRadius: 4,
            }}
          >
            {dockPosition === 'top' ? '⬆ Docked' : '⬆ Dock'}
          </button>

          <button
            onClick={() => setShowEditor(true)}
            style={{
              padding: '6px 14px', fontSize: 13, cursor: 'pointer',
              background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4,
            }}
          >
            {t('importScript')}
          </button>

          <button
            onClick={toggleVoice}
            disabled={prompter.lines.length === 0}
            style={{
              padding: '6px 14px', fontSize: 13,
              cursor: prompter.lines.length === 0 ? 'not-allowed' : 'pointer',
              background: voice.isListening ? '#dc2626' : '#16a34a',
              color: '#fff', border: 'none', borderRadius: 4,
              opacity: prompter.lines.length === 0 ? 0.5 : 1,
            }}
          >
            {voice.isListening ? t('stopListening') : t('startVoiceTracking')}
          </button>

          <button
            onClick={() => prompter.togglePlay()}
            disabled={prompter.lines.length === 0}
            style={{
              padding: '6px 14px', fontSize: 13, cursor: 'pointer',
              background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4,
            }}
          >
            {prompter.isPlaying ? t('pause') : t('play')}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '6px 14px', fontSize: 13, cursor: 'pointer',
              background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4,
            }}
          >
            {showSettings ? t('hide') : t('settings')}
          </button>
        </div>
      </div>

      {/* Voice status */}
      {voice.isListening && (
        <div style={{ padding: '4px 20px', background: 'rgba(22,163,74,0.2)', fontSize: 12, color: '#4ade80' }}>
          {t('listening')} {voice.lastTranscript && `"${voice.lastTranscript}"`}
        </div>
      )}
      {voice.error && (
        <div style={{ padding: '4px 20px', background: 'rgba(220,38,38,0.2)', fontSize: 12, color: '#f87171' }}>
          {t('error')}: {voice.error}
        </div>
      )}

      <PrompterView />
      <StatusBar />
      {showTimeline && <Timeline />}

      {showSettings && (
        <div style={{ position: 'absolute', top: 60, right: 20, zIndex: 100 }}>
          <SettingsPanel overlay={overlay} />
        </div>
      )}

      {showEditor && <ScriptEditor onClose={() => setShowEditor(false)} />}

      {/* Keyboard shortcut hint */}
      <div style={{ position: 'fixed', bottom: showTimeline ? 70 : 40, left: 20, fontSize: 10, color: '#444', pointerEvents: 'none' }}>
        Space: Play/Pause | ↑↓: Speed | F1: Overlay | F2: Click-Through | F3: Dock Top | F4: Dock Bottom | F5: Listen | F6: Undock | Esc: Pause
      </div>
    </div>
  );
}

export default App;
