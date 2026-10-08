export type SpeechLanguage = 'de' | 'en'

export interface Script {
  lines: string[]
  rawText: string
  sourceFormat: 'markdown' | 'docx' | 'text'
}

export interface MatchResult {
  onScript: boolean
  lineIndex: number
  confidence: number
}

export interface AppSettings {
  language: SpeechLanguage
  speed: number
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundOpacity: number
  autoStartListening: boolean
}
