import { marked } from 'marked';
import mammoth from 'mammoth';
import type { Script } from './types';

/**
 * Parse Markdown text into script lines.
 * Strips formatting, preserves paragraph structure.
 */
export function parseMarkdown(text: string): Script {
  // Use marked to tokenize, then extract text per block
  const tokens = marked.lexer(text);
  const lines: string[] = [];

  for (const token of tokens) {
    if (token.type === 'paragraph' || token.type === 'heading' || token.type === 'text') {
      const raw = 'raw' in token ? token.raw : '';
      // Strip markdown formatting from raw text
      const plain = raw
        .replace(/^#+\s*/, '')           // headings
        .replace(/\*\*(.+?)\*\*/g, '$1') // bold
        .replace(/\*(.+?)\*/g, '$1')     // italic
        .replace(/`(.+?)`/g, '$1')       // code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
        .replace(/^\s*[-*+]\s+/gm, '')   // list markers
        .replace(/^\s*\d+\.\s+/gm, '')   // numbered lists
        .trim();

      if (plain) {
        // Split multi-line paragraphs into separate lines
        for (const line of plain.split('\n')) {
          const trimmed = line.trim();
          if (trimmed) lines.push(trimmed);
        }
      }
    } else if (token.type === 'space') {
      // paragraph break — already handled by line splitting
    } else if (token.type === 'list') {
      for (const item of token.items) {
        const plain = item.text
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .trim();
        if (plain) lines.push(plain);
      }
    }
  }

  return { lines, rawText: text, sourceFormat: 'markdown' };
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

  return { lines, rawText: result.value, sourceFormat: 'docx' };
}

/**
 * Parse plain text into script lines.
 */
export function parsePlainText(text: string): Script {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return { lines, rawText: text, sourceFormat: 'plain' };
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
