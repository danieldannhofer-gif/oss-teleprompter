import { usePrompter } from '../hooks/usePrompter'
import { useSpeech } from '../hooks/useSpeech'
import type { AppSettings, SpeechLanguage } from '../lib/types'
import type { LocaleStrings } from '../lib/i18n'

export function SettingsPanel({
  t,
  settings,
  onChange,
  onClose,
}: {
  t: LocaleStrings
  settings: AppSettings
  onChange: (s: AppSettings) => void
  onClose: () => void
}) {
  const { setSpeed } = usePrompter()
  const { setLanguage } = useSpeech()

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    if (patch.speed !== undefined) setSpeed(patch.speed)
    if (patch.language !== undefined) setLanguage(patch.language as SpeechLanguage)
    onChange(next)
  }

  return (
    <div className="settings-panel">
      <h2>{t.settings}</h2>
      <label>
        {t.language}
        <select value={settings.language} onChange={(e) => update({ language: e.target.value as SpeechLanguage })}>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </label>
      <label>
        {t.speed}
        <input
          type="range" min="0.5" max="4" step="0.5" value={settings.speed}
          onChange={(e) => update({ speed: Number(e.target.value) })}
        />
      </label>
      <label>
        {t.fontSize}
        <input
          type="range" min="24" max="96" step="4" value={settings.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
        />
      </label>
      <label>
        {t.autoStart}
        <input
          type="checkbox" checked={settings.autoStartListening}
          onChange={(e) => update({ autoStartListening: e.target.checked })}
        />
      </label>
      <button onClick={onClose}>{t.close}</button>
    </div>
  )
}
