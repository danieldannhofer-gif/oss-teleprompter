import { marked } from 'marked';
import mammoth from 'mammoth';
import type { Script, Section } from './types';

/**
 * Extract timecode from a heading title.
 * Supports: "(5 min)", "(5m)", "[0:00-5:00]", "[10:00-20:00]"
 * Returns { title, durationMinutes, timeCode }.
 */
function extractTimeCode(rawTitle: string): {
  title: string;
  durationMinutes?: number;
  timeCode?: string;
} {
  let title = rawTitle;
  let durationMinutes: number | undefined;
  let timeCode: string | undefined;

  // Pattern 1: [0:00-5:00] or [10:00-20:00] — time range
  const rangeMatch = title.match(/\s*\[(\d{1,2}:\d{2}(?::\d{2})?\s*-\s*\d{1,2}:\d{2}(?::\d{2})?)\]\s*$/);
  if (rangeMatch) {
    timeCode = rangeMatch[1].replace(/\s/g, '');
    title = title.slice(0, rangeMatch.index).trim();
    // Calculate duration from range
    const parts = timeCode.split('-');
    const parseTime = (t: string): number => {
      const segs = t.split(':').map(Number);
      if (segs.length === 3) return segs[0] * 3600 + segs[1] * 60 + segs[2];
      return segs[0] * 60 + segs[1];
    };
    const startSec = parseTime(parts[0]);
    const endSec = parseTime(parts[1]);
    durationMinutes = Math.round((endSec - startSec) / 60);
  }

  // Pattern 2: (5 min) or (5m) — duration
  const durMatch = title.match(/\s*\((\d+)\s*(?:min|m)\)\s*$/i);
  if (durMatch) {
    durationMinutes = parseInt(durMatch[1], 10);
    timeCode = timeCode ?? `${durationMinutes}m`;
    title = title.slice(0, durMatch.index).trim();
  }

  return { title, durationMinutes, timeCode };
}

/**
 * Parse Markdown text into script lines.
 * Strips formatting, preserves paragraph structure.
 * Detects headings (h1-h3) as sections for timeline navigation.
 * Extracts timecodes from headings: "## Intro (5 min)" or "## Intro [0:00-5:00]"
 */
export function parseMarkdown(text: string): Script {
  const tokens = marked.lexer(text);
  const lines: string[] = [];
  const sections: Section[] = [];

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth <= 3) {
      // Heading h1-h3 — strip markdown, extract timecode, record as section
      const rawTitle = token.text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .trim();
      const { title, durationMinutes, timeCode } = extractTimeCode(rawTitle);
      if (title) {
        lines.push(title);
        const section: Section = { title, startLine: lines.length - 1, endLine: lines.length - 1 };
        if (durationMinutes !== undefined) section.durationMinutes = durationMinutes;
        if (timeCode !== undefined) section.timeCode = timeCode;
        sections.push(section);
      }
    } else if (token.type === 'heading') {
      // Heading h4+ — treat as regular text line (no section)
      const title = token.text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .trim();
      if (title) {
        lines.push(title);
        if (sections.length > 0) {
          sections[sections.length - 1].endLine = lines.length - 1;
        }
      }
    } else if (token.type === 'paragraph' || token.type === 'text') {
      const raw = 'raw' in token ? token.raw : '';
      const plain = raw
        .replace(/^#+\s*/, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .trim();

      if (plain) {
        for (const line of plain.split('\n')) {
          const trimmed = line.trim();
          if (trimmed) lines.push(trimmed);
        }
        // Extend the last section's endLine to cover these lines
        if (sections.length > 0) {
          sections[sections.length - 1].endLine = lines.length - 1;
        }
      }
    } else if (token.type === 'list') {
      for (const item of token.items) {
        const plain = item.text
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .trim();
        if (plain) {
          lines.push(plain);
          if (sections.length > 0) {
            sections[sections.length - 1].endLine = lines.length - 1;
          }
        }
      }
    }
  }

  // If no headings found, create a single implicit section
  if (sections.length === 0 && lines.length > 0) {
    sections.push({ title: 'Script', startLine: 0, endLine: lines.length - 1 });
  }

  return { lines, sections, rawText: text, sourceFormat: 'markdown' };
}

/**
 * Parse DOCX (Word) file into script lines.
 */
export async function parseDocx(buffer: ArrayBuffer): Promise<Script> {
  // mammoth.js uses { arrayBuffer } in browsers (WebView2) and { buffer } in Node.js (tests)
  const input = typeof Buffer !== 'undefined'
    ? { buffer: Buffer.from(buffer) }
    : { arrayBuffer: buffer };
  const result = await mammoth.extractRawText(input as Parameters<typeof mammoth.extractRawText>[0]);
  const lines = result.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sections: Section[] = lines.length > 0
    ? [{ title: 'Document', startLine: 0, endLine: lines.length - 1 }]
    : [];

  return { lines, sections, rawText: result.value, sourceFormat: 'docx' };
}

/**
 * Parse plain text into script lines.
 */
export function parsePlainText(text: string): Script {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sections: Section[] = lines.length > 0
    ? [{ title: 'Script', startLine: 0, endLine: lines.length - 1 }]
    : [];

  return { lines, sections, rawText: text, sourceFormat: 'plain' };
}

/**
 * Auto-detect format and parse.
 */
export async function parseScript(content: string | ArrayBuffer, filename: string): Promise<Script> {
  if (typeof content === 'string') {
    if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
      return parseMarkdown(content);
    }
    return parsePlainText(content);
  }

  // ArrayBuffer — assume DOCX
  return parseDocx(content);
}
