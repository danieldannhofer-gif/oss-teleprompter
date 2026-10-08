import { marked } from 'marked';
import mammoth from 'mammoth';
import type { Script, Section } from './types';

/**
 * Parse Markdown text into script lines.
 * Strips formatting, preserves paragraph structure.
 * Detects headings (h1-h3) as sections for timeline navigation.
 */
export function parseMarkdown(text: string): Script {
  const tokens = marked.lexer(text);
  const lines: string[] = [];
  const sections: Section[] = [];

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth <= 3) {
      // Heading h1-h3 — strip markdown, record as section start
      const title = token.text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .trim();
      if (title) {
        lines.push(title);
        sections.push({ title, startLine: lines.length - 1, endLine: lines.length - 1 });
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
