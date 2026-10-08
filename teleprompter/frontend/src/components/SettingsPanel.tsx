import { useOverlay } from '../hooks/useOverlay';

interface SettingsPanelProps {
  overlay: ReturnType<typeof useOverlay>;
}

export function SettingsPanel({ overlay }: SettingsPanelProps) {
  const {
    isOverlay,
    isClickThrough,
    isAlwaysOnTop,
    toggleOverlay,
    toggleClickThrough,
    toggleAlwaysOnTop,
  } = overlay;

  const checkboxStyle = {
    marginRight: 8,
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center' as const,
    marginBottom: 12,
    cursor: 'pointer',
    fontSize: 14,
  };

  return (
    <div
      style={{
        padding: 16,
        background: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 8,
        color: '#fff',
        minWidth: 240,
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Overlay Settings</h3>

      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={isOverlay}
          onChange={toggleOverlay}
          style={checkboxStyle}
        />
        Transparent Overlay Mode
      </label>

      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={isAlwaysOnTop}
          onChange={toggleAlwaysOnTop}
          style={checkboxStyle}
        />
        Always on Top
      </label>

      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={isClickThrough}
          onChange={toggleClickThrough}
          style={checkboxStyle}
          disabled={!isOverlay}
        />
        Click-Through (mouse passes through)
      </label>

      {isOverlay && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>
          Overlay mode is active. The window is semi-transparent and borderless.
        </p>
      )}
    </div>
  );
}
