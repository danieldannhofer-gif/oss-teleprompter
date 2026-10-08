import { useEffect, useState } from 'react';
import { usePrompter } from './usePrompter';
import { useOverlay } from './useOverlay';
import { setLocale, getLocale, type Locale } from '../lib/i18n';
import type { Settings } from '../lib/types';

const STORAGE_KEY = 'teleprompter-settings';

function loadSettings(): Partial<Settings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveSettings(settings: Partial<Settings>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Persists prompter settings to localStorage and applies them on load.
 */
export function useSettings() {
  const prompter = usePrompter();
  const overlay = useOverlay();
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(getLocale());

  // Load settings on mount
  useEffect(() => {
    const saved = loadSettings();
    if (saved.speed !== undefined) prompter.setSpeed(saved.speed);
    if (saved.fontSize !== undefined) prompter.setFontSize(saved.fontSize);
    if (saved.fontFamily !== undefined) prompter.setFontFamily(saved.fontFamily);
    if (saved.textColor !== undefined) prompter.setTextColor(saved.textColor);
    if (saved.language) {
      setLocale(saved.language === 'de' ? 'de' : 'en');
      setCurrentLanguage(saved.language === 'de' ? 'de' : 'en');
    }
  }, []);

  // Save settings on change
  useEffect(() => {
    saveSettings({
      speed: prompter.speed,
      fontSize: prompter.fontSize,
      fontFamily: prompter.fontFamily,
      textColor: prompter.textColor,
      language: currentLanguage,
      overlayEnabled: overlay.isOverlay,
      clickThrough: overlay.isClickThrough,
      alwaysOnTop: overlay.isAlwaysOnTop,
    });
  }, [prompter.speed, prompter.fontSize, prompter.fontFamily, prompter.textColor, currentLanguage, overlay]);

  const setLanguage = (lang: Locale) => {
    setLocale(lang);
    setCurrentLanguage(lang);
    saveSettings({ language: lang });
  };

  return { setLanguage, currentLanguage };
}
