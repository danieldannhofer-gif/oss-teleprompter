import { useSectionTimer, formatTime } from '../hooks/useSectionTimer';

/**
 * TimeBar — visual countdown bar for the current section.
 * Shows a shrinking bar (green → yellow → red) with remaining time.
 * Only renders when the current section has a timecode.
 */
export function TimeBar() {
  const timer = useSectionTimer();

  if (!timer.hasTimeCode || !timer.section) return null;

  const { remainingSeconds, totalSeconds, progress, isOvertime, isRunning } = timer;

  // Color based on remaining progress
  const getColor = (): string => {
    if (isOvertime) return '#dc2626'; // red — overtime
    if (progress > 0.5) return '#16a34a'; // green — plenty of time
    if (progress > 0.25) return '#eab308'; // yellow — running low
    return '#f97316'; // orange — almost up
  };

  const color = getColor();
  const barWidth = Math.max(0, Math.min(100, progress * 100));

  return (
    <div
      style={{
        flexShrink: 0,
        background: 'rgba(0,0,0,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Section title + time */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
        }}
      >
        <span style={{ color: '#888' }}>
          {timer.section.title}
          {timer.section.timeCode && (
            <span style={{ color: '#555', marginLeft: 6 }}>
              ({timer.section.timeCode})
            </span>
          )}
        </span>
        <span
          style={{
            color,
            fontWeight: 600,
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          {isOvertime ? '+' : ''}{formatTime(remainingSeconds)}
          <span style={{ color: '#555', fontWeight: 400, marginLeft: 4 }}>
            / {formatTime(totalSeconds)}
          </span>
        </span>
      </div>

      {/* Shrinking bar */}
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidth}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 1s linear, background 0.5s',
          }}
        />
        {/* Overtime pulse indicator */}
        {isOvertime && (
          <div
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#dc2626',
              animation: 'pulse 1s infinite',
            }}
          />
        )}
      </div>

      {/* Status text */}
      <div
        style={{
          fontSize: 9,
          color: '#555',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {isOvertime
            ? 'Overtime'
            : isRunning
              ? 'Running'
              : 'Paused'}
        </span>
        <span>{Math.round(barWidth)}%</span>
      </div>
    </div>
  );
}
