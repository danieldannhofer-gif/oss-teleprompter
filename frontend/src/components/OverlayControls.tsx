import { usePrompter } from '../hooks/usePrompter'
import { useOverlay } from '../hooks/useOverlay'
import { useSpeech } from '../hooks/useSpeech'
import type { LocaleStrings } from '../lib/i18n'

export function OverlayControls({ t, onOpenSettings }: { t: LocaleStrings; onOpenSettings: () => void }) {
  const { isPlaying, play, pause, setSpeed, speed, jumpTo, lines } = usePrompter()
  const { overlay, clickThrough, toggleOverlay, toggleClickThrough } = useOverlay()
  const { isListening, startListening, stopListening } = useSpeech()

  return (
    <div className="overlay-controls">
      <button onClick={() => (isPlaying ? pause() : play())} aria-label={isPlaying ? t.pause : t.play}>
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button onClick={() => setSpeed(Math.max(0.5, speed - 0.5))} aria-label="slower">−</button>
      <span className="speed">{speed.toFixed(1)}×</span>
      <button onClick={() => setSpeed(Math.min(4, speed + 0.5))} aria-label="faster">+</button>
      <button onClick={() => jumpTo(0)} aria-label={t.start}>⇤</button>
      <button onClick={() => jumpTo(lines.length - 1)} aria-label={t.end}>⇥</button>
      <button onClick={toggleOverlay} aria-label={t.overlay} data-active={overlay}>
        {t.overlay}
      </button>
      <button onClick={toggleClickThrough} aria-label={t.clickThrough} data-active={clickThrough}>
        {t.clickThrough}
      </button>
      <button onClick={() => (isListening ? stopListening() : startListening())} data-active={isListening}>
        {t.listening}
      </button>
      <button onClick={onOpenSettings} aria-label={t.settings}>{t.settings}</button>
    </div>
  )
}
