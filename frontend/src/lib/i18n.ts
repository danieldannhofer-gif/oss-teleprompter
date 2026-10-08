// Simple i18n for DE/EN

export type Locale = 'de' | 'en';

export const locales: Record<Locale, Record<string, string>> = {
  de: {
    appName: 'Teleprompter',
    importScript: 'Skript importieren',
    startVoiceTracking: 'Sprachsteuerung starten',
    stopListening: 'Zuhören stoppen',
    play: 'Abspielen',
    pause: 'Pause',
    settings: 'Einstellungen',
    hide: 'Ausblenden',
    listening: 'Zuhören...',
    error: 'Fehler',
    noScriptLoaded: 'Kein Skript geladen. Importiere eine Markdown- oder Word-Datei.',
    overlaySettings: 'Overlay-Einstellungen',
    transparentOverlay: 'Transparenter Overlay-Modus',
    alwaysOnTop: 'Immer im Vordergrund',
    clickThrough: 'Click-Through (Maus geht durch)',
    overlayActive: 'Overlay-Modus ist aktiv. Das Fenster ist halbtransparent und rahmenlos.',
    importFile: 'Datei importieren (.md, .docx, .txt)',
    pasteText: '— oder Text einfügen —',
    pastePlaceholder: 'Füge dein Skript hier ein...',
    cancel: 'Abbrechen',
    loadScript: 'Skript laden',
    line: 'Zeile',
    speed: 'Geschwindigkeit',
    playing: 'Wiedergabe',
    paused: 'Pausiert',
  },
  en: {
    appName: 'Teleprompter',
    importScript: 'Import Script',
    startVoiceTracking: 'Start Voice Tracking',
    stopListening: 'Stop Listening',
    play: 'Play',
    pause: 'Pause',
    settings: 'Settings',
    hide: 'Hide',
    listening: 'Listening...',
    error: 'Error',
    noScriptLoaded: 'No script loaded. Import a Markdown or Word file to begin.',
    overlaySettings: 'Overlay Settings',
    transparentOverlay: 'Transparent Overlay Mode',
    alwaysOnTop: 'Always on Top',
    clickThrough: 'Click-Through (mouse passes through)',
    overlayActive: 'Overlay mode is active. The window is semi-transparent and borderless.',
    importFile: 'Import File (.md, .docx, .txt)',
    pasteText: '— or paste text —',
    pastePlaceholder: 'Paste your script here...',
    cancel: 'Cancel',
    loadScript: 'Load Script',
    line: 'Line',
    speed: 'Speed',
    playing: 'Playing',
    paused: 'Paused',
  },
};

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  return locales[currentLocale][key] ?? locales.en[key] ?? key;
}
