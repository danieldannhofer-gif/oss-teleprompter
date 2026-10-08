import { usePrompter } from '../hooks/usePrompter';
import type { Section } from '../lib/types';

/**
 * Timeline — horizontal section progress bar at the bottom of the screen.
 * Shows all script sections, highlights the current one, displays progress.
 * Clicking a section jumps to its start line.
 */
export function Timeline() {
  const { sections, lines, currentIndex, jumpTo } = usePrompter();

  if (sections.length === 0 || lines.length === 0) return null;

  // Find which section the current line belongs to
  const currentSectionIndex = sections.findIndex(
    (s) => currentIndex >= s.startLine && currentIndex <= s.endLine
  );

  // Calculate progress percentage
  const progress = lines.length > 0 ? (currentIndex + 1) / lines.length : 0;

  const getSectionStatus = (_section: Section, idx: number): 'done' | 'current' | 'upcoming' => {
    if (idx < currentSectionIndex) return 'done';
    if (idx === currentSectionIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div
      style={{
        flexShrink: 0,
        background: 'rgba(0,0,0,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          height: 3,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: '#16a34a',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Section pills */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflow: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        {sections.map((section, idx) => {
          const status = getSectionStatus(section, idx);
          const lineCount = section.endLine - section.startLine + 1;

          return (
            <button
              key={idx}
              onClick={() => jumpTo(section.startLine)}
              title={`${section.title} (${lineCount} lines)`}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                fontSize: 11,
                cursor: 'pointer',
                border: 'none',
                borderRadius: 4,
                fontFamily: 'inherit',
                transition: 'background 0.2s, color 0.2s',
                ...(status === 'current'
                  ? { background: '#2563eb', color: '#fff', fontWeight: 600 }
                  : status === 'done'
                    ? { background: 'rgba(22,163,74,0.2)', color: '#4ade80' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#888' }),
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    status === 'current' ? '#fff'
                    : status === 'done' ? '#4ade80'
                    : '#555',
                }}
              />
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Progress text */}
      <div
        style={{
          fontSize: 10,
          color: '#555',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {currentSectionIndex >= 0
            ? sections[currentSectionIndex].title
            : '—'}
        </span>
        <span>
          {currentIndex + 1} / {lines.length}
        </span>
      </div>
    </div>
  );
}
