import { usePrompter } from '../hooks/usePrompter';

export function StatusBar() {
  const { lines, currentIndex, isPlaying, speed } = usePrompter();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.5)',
        fontSize: 13,
        color: '#aaa',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ color: isPlaying ? '#4ade80' : '#888' }}>
        {isPlaying ? 'Playing' : 'Paused'}
      </span>
      <span>Line {lines.length > 0 ? currentIndex + 1 : 0} / {lines.length}</span>
      <span>Speed: {speed.toFixed(1)}x</span>
    </div>
  );
}
