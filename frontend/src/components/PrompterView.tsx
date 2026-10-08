import { useEffect, useRef } from 'react';
import { usePrompter } from '../hooks/usePrompter';

export function PrompterView() {
  const { lines, currentIndex, isPlaying, speed, fontSize, fontFamily, textColor } = usePrompter();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to current line
  useEffect(() => {
    const el = lineRefs.current[currentIndex];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: isPlaying ? 'smooth' : 'auto', block: 'center' });
    }
  }, [currentIndex, isPlaying]);

  // Auto-advance when playing (simple timer-based advance for now)
  useEffect(() => {
    if (!isPlaying || lines.length === 0) return;

    const interval = setInterval(() => {
      const prompter = usePrompter.getState();
      if (prompter.currentIndex < prompter.lines.length - 1) {
        prompter.next();
      } else {
        prompter.pause();
      }
    }, 3000 / speed); // Base: 3 seconds per line, adjusted by speed

    return () => clearInterval(interval);
  }, [isPlaying, speed, lines.length]);

  if (lines.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: 18,
        }}
      >
        No script loaded. Import a Markdown or Word file to begin.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '40px 60px',
        scrollBehavior: isPlaying ? 'smooth' : 'auto',
      }}
    >
      {lines.map((line, index) => {
        const isCurrent = index === currentIndex;
        const distance = Math.abs(index - currentIndex);

        return (
          <div
            key={index}
            ref={(el) => { lineRefs.current[index] = el; }}
            style={{
              fontSize,
              fontFamily,
              color: textColor,
              lineHeight: 1.6,
              marginBottom: 8,
              padding: '4px 12px',
              borderRadius: 4,
              opacity: isCurrent ? 1 : Math.max(0.3, 1 - distance * 0.15),
              background: isCurrent ? 'rgba(255,255,255,0.1)' : 'transparent',
              fontWeight: isCurrent ? 600 : 400,
              transition: 'opacity 0.3s, background 0.3s',
            }}
          >
            {line || '\u00A0'}
          </div>
        );
      })}
    </div>
  );
}
