// Script library: persists recently loaded scripts to localStorage
// so users can quickly reload them without re-importing files.

export const SCRIPT_LIBRARY_KEY = 'teleprompter-script-library';
export const MAX_SAVED_SCRIPTS = 10;

export type ScriptFormat = 'markdown' | 'plain' | 'docx';

export interface SavedScript {
  id: string;
  name: string;
  content: string;
  format: ScriptFormat;
  savedAt: number;
}

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Read all saved scripts, most recent first.
 * Returns [] when storage is unavailable or corrupted.
 */
export function getScripts(): SavedScript[] {
  if (!storageAvailable()) return [];
  try {
    const raw = localStorage.getItem(SCRIPT_LIBRARY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is SavedScript =>
        !!s &&
        typeof (s as SavedScript).id === 'string' &&
        typeof (s as SavedScript).name === 'string' &&
        typeof (s as SavedScript).content === 'string' &&
        typeof (s as SavedScript).savedAt === 'number'
    );
  } catch {
    return [];
  }
}

function writeScripts(scripts: SavedScript[]): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(SCRIPT_LIBRARY_KEY, JSON.stringify(scripts));
  } catch {
    // QuotaExceededError / SecurityError — library is best-effort
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `script-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Derive a display name from the script content: first non-empty line
 * with markdown heading/emphasis markers stripped, truncated to 40 chars.
 */
export function deriveScriptName(content: string, fallback = 'Untitled Script'): string {
  const firstLine = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return fallback;
  const cleaned = firstLine
    .replace(/^#+\s*/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}...` : cleaned;
}

/**
 * Save a script to the library. New entries go to the front;
 * the list is capped at MAX_SAVED_SCRIPTS. Returns the saved entry.
 */
export function saveScript(content: string, format: ScriptFormat, name?: string): SavedScript {
  const entry: SavedScript = {
    id: generateId(),
    name: name?.trim() || deriveScriptName(content),
    content,
    format,
    savedAt: Date.now(),
  };
  writeScripts([entry, ...getScripts()].slice(0, MAX_SAVED_SCRIPTS));
  return entry;
}

/**
 * Delete a script by id. Returns the updated list.
 */
export function deleteScript(id: string): SavedScript[] {
  const scripts = getScripts().filter((s) => s.id !== id);
  writeScripts(scripts);
  return scripts;
}

/**
 * Rename a script. Empty names are ignored. Returns the updated list.
 */
export function renameScript(id: string, name: string): SavedScript[] {
  const trimmed = name.trim();
  const scripts = getScripts().map((s) =>
    s.id === id && trimmed ? { ...s, name: trimmed } : s
  );
  writeScripts(scripts);
  return scripts;
}
