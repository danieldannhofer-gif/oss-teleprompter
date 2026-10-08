// Shared TypeScript types for the Teleprompter frontend

export interface Script {
  lines: string[];
  rawText: string;
  sourceFormat: 'markdown' | 'docx' | 'plain';
}

export interface MatchResult {
  type: 'OnScript' | 'OffScript';
  lineIndex: number;
  confidence: number;
}

export interface TranscriptEvent {
  type: 'speech:transcript';
  text: string;
  is_final: boolean;
}

export interface Settings {
  language: string;
  speed: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundOpacity: number;
  overlayEnabled: boolean;
  clickThrough: boolean;
  alwaysOnTop: boolean;
  autoStartListening: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  speed: 1.0,
  fontSize: 32,
  fontFamily: 'Segoe UI, system-ui, sans-serif',
  textColor: '#ffffff',
  backgroundOpacity: 0.85,
  overlayEnabled: false,
  clickThrough: false,
  alwaysOnTop: false,
  autoStartListening: false,
};
