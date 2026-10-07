import { useState } from 'react'
import { onMessage, postMessage } from '../lib/webview'
import type { SpeechLanguage } from '../lib/types'

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [language, setLanguageState] = useState<SpeechLanguage>('de')

  const startListening = () => {
    postMessage({ type: 'speech:start' })
    setIsListening(true)
  }
  const stopListening = () => {
    postMessage({ type: 'speech:stop' })
    setIsListening(false)
  }
  const setLanguage = (lang: SpeechLanguage) => {
    setLanguageState(lang)
    postMessage({ type: 'speech:setLanguage', lang })
  }
  const onTranscript = (callback: (text: string, isFinal: boolean) => void) =>
    onMessage((msg) => {
      if (msg?.type === 'speech:transcript') callback(msg.text, msg.isFinal)
    })

  return { isListening, language, startListening, stopListening, setLanguage, onTranscript }
}
