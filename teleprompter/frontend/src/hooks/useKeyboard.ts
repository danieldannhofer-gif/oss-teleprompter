import { useEffect } from 'react';
import { usePrompter } from './usePrompter';

interface KeyboardHandlers {
  onTogglePlay?: () => void;
  onToggleOverlay?: () => void;
  onToggleClickThrough?: () => void;
  onStartStopListening?: () => void;
}

/**
 * Global keyboard shortcuts for the teleprompter.
 *
 * | Key | Action |
 * |-----|--------|
 * | Space | Play/Pause |
 * | Arrow Up/Down | Speed +/- |
 * | Home / End | Jump to start / end |
 * | F1 | Toggle overlay |
 * | F2 | Toggle click-through |
 * | F5 | Start/stop listening |
 * | Escape | Pause |
 */
export function useKeyboard(handlers: KeyboardHandlers) {
  const prompter = usePrompter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          prompter.togglePlay();
          break;
        case 'ArrowUp':
          e.preventDefault();
          prompter.setSpeed(prompter.speed + 0.25);
          break;
        case 'ArrowDown':
          e.preventDefault();
          prompter.setSpeed(prompter.speed - 0.25);
          break;
        case 'Home':
          e.preventDefault();
          prompter.jumpTo(0);
          break;
        case 'End':
          e.preventDefault();
          prompter.jumpTo(prompter.lines.length - 1);
          break;
        case 'F1':
          e.preventDefault();
          handlers.onToggleOverlay?.();
          break;
        case 'F2':
          e.preventDefault();
          handlers.onToggleClickThrough?.();
          break;
        case 'F5':
          e.preventDefault();
          handlers.onStartStopListening?.();
          break;
        case 'Escape':
          prompter.pause();
          break;
        case 'PageUp':
          e.preventDefault();
          prompter.prev();
          break;
        case 'PageDown':
          e.preventDefault();
          prompter.next();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompter, handlers]);
}
