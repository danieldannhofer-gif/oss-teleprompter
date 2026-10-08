import { create } from 'zustand';
import type { Section } from '../lib/types';

interface PrompterState {
  lines: string[];
  sections: Section[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;

  // Actions
  setLines: (lines: string[], sections?: Section[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  jumpTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setTextColor: (color: string) => void;
  reset: () => void;
}

export const usePrompter = create<PrompterState>((set) => ({
  lines: [],
  sections: [],
  currentIndex: 0,
  isPlaying: false,
  speed: 1.0,
  fontSize: 32,
  fontFamily: 'Segoe UI, system-ui, sans-serif',
  textColor: '#ffffff',

  setLines: (lines, sections) => set({
    lines,
    sections: sections ?? (lines.length > 0 ? [{ title: 'Script', startLine: 0, endLine: lines.length - 1 }] : []),
    currentIndex: 0,
  }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed: Math.max(0.1, Math.min(5.0, speed)) }),
  jumpTo: (index) => set((s) => ({
    currentIndex: Math.max(0, Math.min(s.lines.length - 1, index))
  })),
  next: () => set((s) => ({
    currentIndex: Math.min(s.lines.length - 1, s.currentIndex + 1)
  })),
  prev: () => set((s) => ({
    currentIndex: Math.max(0, s.currentIndex - 1)
  })),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setTextColor: (textColor) => set({ textColor }),
  reset: () => set({ currentIndex: 0, isPlaying: false }),
}));
