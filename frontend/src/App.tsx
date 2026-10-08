import { useEffect, useState } from 'react'
import { PrompterView } from './components/PrompterView'
import { StatusBar } from './components/StatusBar'
import { OverlayControls } from './components/OverlayControls'
import { ScriptEditor } from './components/ScriptEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { usePrompter } from './hooks/usePrompter'
import { useKeyboard } from './hooks/useKeyboard'
import { useSpeech } from './hooks/useSpeech'
import { onMessage, postMessage } from './lib/webview'
import { locales, type Locale } from './lib/i18n'
import type { AppSettings } from './lib/types'

const defaultSettings: AppSettings = {
  language: 'de',
  speed: 1,
  fontSize: 48,
  fontFamily: 'Segoe UI',
  textColor: '#ffffff',
  backgroundOpacity: 0.6,
  autoStartListening: false,
}

export default function App() {
  const [ui, setUi] = useState<'none' | 'editor' | 'settings'>('none')
  const [offScript, setOffScript] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const t = locales[settings.language as Locale]
  const prompter = usePrompter()
  const speech = useSpeech()
  useKeyboard()

  useEffect(() => {
    const unsubscribe = speech.onTranscript((text) => {
      postMessage({ type: 'script:match', transcript: text })
    })
    const unsubscribeMatch = onMessage((msg) => {
      if (msg?.type === 'script:matchResult') {
        if (msg.onScript) {
          setOffScript(false)
          prompter.jumpTo(msg.lineIndex)
          prompter.play()
        } else {
          setOffScript(true)
          prompter.pause()
        }
      }
    })
    return () => {
      unsubscribe()
      unsubscribeMatch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="app"
      style={{
        fontSize: settings.fontSize,
        color: settings.textColor,
        fontFamily: settings.fontFamily,
        backgroundColor: `rgba(0, 0, 0, ${settings.backgroundOpacity})`,
      }}
    >
      <PrompterView />
      <StatusBar t={t} offScript={offScript} />
      <OverlayControls t={t} onOpenSettings={() => setUi(ui === 'settings' ? 'none' : 'settings')} />
      {ui === 'editor' && <ScriptEditor t={t} onClose={() => setUi('none')} />}
      {ui === 'settings' && (
        <SettingsPanel t={t} settings={settings} onChange={setSettings} onClose={() => setUi('none')} />
      )}
    </div>
  )
}
