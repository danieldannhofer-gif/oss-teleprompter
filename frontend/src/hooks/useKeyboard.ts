import { useEffect } from 'react'
import { usePrompter } from './usePrompter'
import { useOverlay } from './useOverlay'
import { useSpeech } from './useSpeech'

export function useKeyboard() {
  const { isPlaying, play, pause, setSpeed, jumpTo, lines } = usePrompter()
  const { toggleOverlay, toggleClickThrough } = useOverlay()
  const { isListening, startListening, stopListening } = useSpeech()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          isPlaying ? pause() : play()
          break
        case 'ArrowUp':
          e.preventDefault()
          setSpeed(Math.min(4, (usePrompter.getState().speed) + 0.5))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSpeed(Math.max(0.5, (usePrompter.getState().speed) - 0.5))
          break
        case 'Home':
          jumpTo(0)
          break
        case 'End':
          jumpTo(lines.length - 1)
          break
        case 'F1':
          e.preventDefault()
          toggleOverlay()
          break
        case 'F2':
          e.preventDefault()
          toggleClickThrough()
          break
        case 'F5':
          e.preventDefault()
          isListening ? stopListening() : startListening()
          break
        case 'Escape':
          pause()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, isListening, play, pause, setSpeed, jumpTo, lines.length, toggleOverlay, toggleClickThrough, startListening, stopListening])
}
