import { useState, useEffect } from 'react';
import { useOverlay } from '../hooks/useOverlay';
import { usePrompter } from '../hooks/usePrompter';
import { windowMessages } from '../lib/webview';
import { t } from '../lib/i18n';

interface SettingsPanelProps {
  overlay: ReturnType<typeof useOverlay>;
}

type DockPosition = 'none' | 'top' | 'bottom';

const STORAGE_KEY = 'teleprompter-settings';

function loadSetting<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[key] !== undefined) return parsed[key] as T;
    }
  } catch { /* ignore */ }
  return fallback;
}

function saveSetting(key: string, value: unknown): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    settings[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function SettingsPanel({ overlay }: SettingsPanelProps) {
  const prompter = usePrompter();
  const {
    isOverlay,
    isClickThrough,
    isAlwaysOnTop,
    toggleOverlay,
    toggleClickThrough,
    toggleAlwaysOnTop,
  } = overlay;

  const [dockPosition, setDockPosition] = useState<DockPosition>(
    () => loadSetting<DockPosition>('dockPosition', 'none')
  );
  const [dockHeight, setDockHeight] = useState<number>(
    () => loadSetting<number>('dockHeightPercent', 60)
  );
  const [showTimeline, setShowTimeline] = useState<boolean>(
    () => loadSetting<boolean>('showTimeline', true)
  );

  // Apply dock on mount
  useEffect(() => {
    if (dockPosition !== 'none') {
      windowMessages.dock(dockPosition, dockHeight);
    }
  }, []);

  const handleDockChange = (pos: DockPosition) => {
    setDockPosition(pos);
    saveSetting('dockPosition', pos);
    windowMessages.dock(pos, dockHeight);
  };

  const handleHeightChange = (height: number) => {
    setDockHeight(height);
    saveSetting('dockHeightPercent', height);
    if (dockPosition !== 'none') {
      windowMessages.dock(dockPosition, height);
    }
  };

  const handleTimelineToggle = (show: boolean) => {
    setShowTimeline(show);
    saveSetting('showTimeline', show);
    // Dispatch event so App can react
    window.dispatchEvent(new CustomEvent('teleprompter:timelineToggle', { detail: { show } }));
  };

  const checkboxStyle = { marginRight: 8 };
  const labelStyle = {
    display: 'flex',
    alignItems: 'center' as const,
    marginBottom: 12,
    cursor: 'pointer',
    fontSize: 14,
  };
  const sectionStyle = {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  };
  const selectStyle = {
    padding: '4px 8px',
    fontSize: 13,
    background: '#333',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: 4,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        padding: 16,
        background: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 8,
        color: '#fff',
        minWidth: 260,
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{t('overlaySettings')}</h3>

      <label style={labelStyle}>
        <input type="checkbox" checked={isOverlay} onChange={toggleOverlay} style={checkboxStyle} />
        {t('transparentOverlay')}
      </label>

      <label style={labelStyle}>
        <input type="checkbox" checked={isAlwaysOnTop} onChange={toggleAlwaysOnTop} style={checkboxStyle} />
        {t('alwaysOnTop')}
      </label>

      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={isClickThrough}
          onChange={toggleClickThrough}
          style={checkboxStyle}
          disabled={!isOverlay}
        />
        {t('clickThrough')}
      </label>

      {/* Dock settings */}
      <div style={sectionStyle}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#aaa' }}>
            {t('dockSettings')}
        </h4>

        <div style={{ ...labelStyle, justifyContent: 'space-between' }}>
          <span>{t('dockPosition')}</span>
          <select
            value={dockPosition}
            onChange={(e) => handleDockChange(e.target.value as DockPosition)}
            style={selectStyle}
          >
            <option value="none">{t('dockNone')}</option>
            <option value="top">{t('dockTop')}</option>
            <option value="bottom">{t('dockBottom')}</option>
          </select>
        </div>

        {dockPosition !== 'none' && (
          <div style={{ ...labelStyle, justifyContent: 'space-between' }}>
            <span>{t('dockHeight')}: {dockHeight}%</span>
            <input
              type="range"
              min={20}
              max={90}
              value={dockHeight}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              style={{ width: 100, cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Display settings */}
      <div style={sectionStyle}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#aaa' }}>
          {t('displaySettings')}
        </h4>

        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={showTimeline}
            onChange={(e) => handleTimelineToggle(e.target.checked)}
            style={checkboxStyle}
          />
          {t('showTimeline')}
        </label>

        <div style={{ ...labelStyle, justifyContent: 'space-between' }}>
          <span>{t('fontSize')}: {prompter.fontSize}px</span>
          <input
            type="range"
            min={16}
            max={72}
            value={prompter.fontSize}
            onChange={(e) => prompter.setFontSize(Number(e.target.value))}
            style={{ width: 100, cursor: 'pointer' }}
          />
        </div>
      </div>

      {isOverlay && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>
          {t('overlayActive')}
        </p>
      )}
    </div>
  );
}
