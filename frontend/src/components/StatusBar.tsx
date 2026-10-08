import { usePrompter } from '../hooks/usePrompter'
import type { LocaleStrings } from '../lib/i18n'

export function StatusBar({ t, offScript }: { t: LocaleStrings; offScript: boolean }) {
  const { isPlaying, currentIndex, lines, isOffScript } = useStatusBarState(offScript)
  return (
    <div className="status-bar">
      <span>{isPlaying ? t.pause : t.play}</span>
      <span>
        {lines.length > 0 ? `${currentIndex + 1} / ${lines.length}` : '0 / 0'}
      </span>
      <span className={offScript ? 'off-script' : 'on-script'}>
        {isOffScript ? t.offScript : t.onScript}
      </span>
    </div>
  )
}

function useStatusBarState(offScript: boolean) {
  const { isPlaying, currentIndex, lines } = usePrompter()
  return { isPlaying, currentIndex, lines, isOffScript: offScript }
}
