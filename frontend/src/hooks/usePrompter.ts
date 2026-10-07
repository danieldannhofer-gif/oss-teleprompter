import { create } from 'zustand'

interface PrompterState {
  lines: string[]
  currentIndex: number
  isPlaying: boolean
  speed: number
  setLines: (lines: string[]) => void
  play: () => void
  pause: () => void
  setSpeed: (speed: number) => void
  jumpTo: (index: number) => void
}

export const usePrompter = create<PrompterState>((set) => ({
  lines: [],
  currentIndex: 0,
  isPlaying: false,
  speed: 1,
  setLines: (lines) => set({ lines, currentIndex: 0, isPlaying: false }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setSpeed: (speed) => set({ speed }),
  jumpTo: (index) =>
    set((state) => ({
      currentIndex: Math.max(0, Math.min(index, Math.max(0, state.lines.length - 1))),
    })),
}))


