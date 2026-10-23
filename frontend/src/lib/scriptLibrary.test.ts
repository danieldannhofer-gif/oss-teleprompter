import { describe, test, expect, beforeEach } from 'vitest';
import {
  SCRIPT_LIBRARY_KEY,
  MAX_SAVED_SCRIPTS,
  getScripts,
  saveScript,
  deleteScript,
  renameScript,
  deriveScriptName,
} from './scriptLibrary';

describe('scriptLibrary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and retrieves a script with metadata', () => {
    const saved = saveScript('# My Talk\nHello world', 'markdown', 'my-talk-file');
    const scripts = getScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].id).toBe(saved.id);
    expect(scripts[0].name).toBe('my-talk-file');
    expect(scripts[0].content).toBe('# My Talk\nHello world');
    expect(scripts[0].format).toBe('markdown');
    expect(typeof scripts[0].savedAt).toBe('number');
  });

  test('derives name from first line when no explicit name given', () => {
    const saved = saveScript('# Keynote 2026\nWelcome', 'markdown');
    expect(saved.name).toBe('Keynote 2026');
  });

  test('falls back to Untitled Script for empty content', () => {
    const saved = saveScript('   \n  ', 'plain');
    expect(saved.name).toBe('Untitled Script');
  });

  test('keeps most recent first and caps the list', () => {
    for (let i = 0; i < MAX_SAVED_SCRIPTS + 3; i++) {
      saveScript(`Content ${i}`, 'plain', `Script ${i}`);
    }
    const scripts = getScripts();
    expect(scripts).toHaveLength(MAX_SAVED_SCRIPTS);
    expect(scripts[0].name).toBe(`Script ${MAX_SAVED_SCRIPTS + 2}`);
    expect(scripts[scripts.length - 1].name).toBe('Script 3');
  });

  test('deletes a script by id', () => {
    const a = saveScript('A', 'plain', 'A');
    saveScript('B', 'plain', 'B');
    const remaining = deleteScript(a.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('B');
    expect(getScripts()).toHaveLength(1);
  });

  test('renames a script and trims whitespace', () => {
    const a = saveScript('A', 'plain', 'Old Name');
    const updated = renameScript(a.id, '  New Name  ');
    expect(updated[0].name).toBe('New Name');
    expect(getScripts()[0].name).toBe('New Name');
  });

  test('rename with empty name keeps the old name', () => {
    const a = saveScript('A', 'plain', 'Old Name');
    const updated = renameScript(a.id, '   ');
    expect(updated[0].name).toBe('Old Name');
  });

  test('returns empty array for corrupted storage', () => {
    localStorage.setItem(SCRIPT_LIBRARY_KEY, 'not json{{{');
    expect(getScripts()).toEqual([]);
  });

  test('returns empty array when storage holds a non-array', () => {
    localStorage.setItem(SCRIPT_LIBRARY_KEY, '{"foo":1}');
    expect(getScripts()).toEqual([]);
  });

  test('filters out malformed entries', () => {
    localStorage.setItem(
      SCRIPT_LIBRARY_KEY,
      JSON.stringify([
        { id: 'ok', name: 'Good', content: 'text', format: 'plain', savedAt: 1 },
        { id: 'bad' },
        null,
      ])
    );
    const scripts = getScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].id).toBe('ok');
  });

  test('deriveScriptName strips markdown markers', () => {
    expect(deriveScriptName('## **Big** Talk `2026`', 'fallback')).toBe('Big Talk 2026');
  });

  test('deriveScriptName truncates long lines and uses fallback', () => {
    const long = 'A'.repeat(60);
    const name = deriveScriptName(long);
    expect(name.length).toBe(43); // 40 chars + '...'
    expect(deriveScriptName('', 'fallback')).toBe('fallback');
    expect(deriveScriptName('###', 'fallback')).toBe('fallback');
  });
});
