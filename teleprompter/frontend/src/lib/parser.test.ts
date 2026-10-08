import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseMarkdown, parsePlainText, parseDocx, parseScript } from './parser';

function loadDocxFixture(): ArrayBuffer {
  const buf = readFileSync(resolve(__dirname, '../../public/fixtures/sample.docx'));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

describe('parseMarkdown', () => {
  test('strips heading markers', () => {
    const result = parseMarkdown('# Title\n\nHello world');
    expect(result.lines).toContain('Title');
    expect(result.lines).toContain('Hello world');
    expect(result.sourceFormat).toBe('markdown');
  });

  test('strips bold formatting', () => {
    const result = parseMarkdown('Hello **world**');
    expect(result.lines).toContain('Hello world');
  });

  test('strips italic formatting', () => {
    const result = parseMarkdown('Hello *world*');
    expect(result.lines).toContain('Hello world');
  });

  test('strips inline code', () => {
    const result = parseMarkdown('Use `npm install` to install');
    expect(result.lines).toContain('Use npm install to install');
  });

  test('strips links keeping text', () => {
    const result = parseMarkdown('Visit [Google](https://google.com) today');
    expect(result.lines).toContain('Visit Google today');
  });

  test('strips list markers', () => {
    const result = parseMarkdown('- item 1\n- item 2\n- item 3');
    expect(result.lines).toEqual(['item 1', 'item 2', 'item 3']);
  });

  test('strips numbered list markers', () => {
    const result = parseMarkdown('1. first\n2. second\n3. third');
    expect(result.lines).toEqual(['first', 'second', 'third']);
  });

  test('splits multi-line paragraphs into separate lines', () => {
    const result = parseMarkdown('Line one\nLine two\nLine three');
    expect(result.lines).toEqual(['Line one', 'Line two', 'Line three']);
  });

  test('preserves rawText', () => {
    const md = '# Title\n\nHello **world**';
    const result = parseMarkdown(md);
    expect(result.rawText).toBe(md);
  });

  test('handles empty input', () => {
    const result = parseMarkdown('');
    expect(result.lines).toEqual([]);
  });

  test('handles complex markdown', () => {
    const md = [
      '# Presentation Title',
      '',
      'Welcome everyone to this talk.',
      '',
      '## Agenda',
      '',
      '- Introduction',
      '- Main topic',
      '- Conclusion',
      '',
      'Let us begin with the **introduction**.',
    ].join('\n');

    const result = parseMarkdown(md);
    expect(result.lines).toContain('Presentation Title');
    expect(result.lines).toContain('Welcome everyone to this talk.');
    expect(result.lines).toContain('Agenda');
    expect(result.lines).toContain('Introduction');
    expect(result.lines).toContain('Main topic');
    expect(result.lines).toContain('Conclusion');
    expect(result.lines).toContain('Let us begin with the introduction.');
  });
});

describe('parseMarkdown sections', () => {
  test('detects headings as sections', () => {
    const md = [
      '## Introduction',
      'Welcome everyone.',
      'Today we talk about X.',
      '',
      '## Main Content',
      'Here is the main part.',
      '',
      '## Conclusion',
      'Thank you.',
    ].join('\n');

    const result = parseMarkdown(md);
    expect(result.sections).toHaveLength(3);
    expect(result.sections[0].title).toBe('Introduction');
    expect(result.sections[1].title).toBe('Main Content');
    expect(result.sections[2].title).toBe('Conclusion');
  });

  test('section startLine and endLine are correct', () => {
    const md = '## Intro\nLine A\nLine B\n## Body\nLine C\nLine D\nLine E';
    const result = parseMarkdown(md);

    expect(result.sections).toHaveLength(2);
    // Intro: heading at line 0, then Line A (1), Line B (2)
    expect(result.sections[0].startLine).toBe(0);
    expect(result.sections[0].endLine).toBe(2);
    // Body: heading at line 3, then Line C (4), Line D (5), Line E (6)
    expect(result.sections[1].startLine).toBe(3);
    expect(result.sections[1].endLine).toBe(6);
  });

  test('h1 and h2 both create sections', () => {
    const md = '# Title\nSome text\n## Subtitle\nMore text';
    const result = parseMarkdown(md);
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].title).toBe('Title');
    expect(result.sections[1].title).toBe('Subtitle');
  });

  test('h4+ does not create sections', () => {
    const md = '#### Deep heading\nSome text';
    const result = parseMarkdown(md);
    // h4 is not a section, but should still appear as a line
    expect(result.lines).toContain('Deep heading');
    // Falls back to single implicit section
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBe('Script');
  });

  test('no headings creates single implicit section', () => {
    const result = parseMarkdown('Just some text\nMore text here');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBe('Script');
    expect(result.sections[0].startLine).toBe(0);
    expect(result.sections[0].endLine).toBe(result.lines.length - 1);
  });

  test('empty markdown has no sections', () => {
    const result = parseMarkdown('');
    expect(result.sections).toEqual([]);
  });

  test('strips formatting from section titles', () => {
    const md = '## **Bold** and *italic* title';
    const result = parseMarkdown(md);
    expect(result.sections[0].title).toBe('Bold and italic title');
  });
});

describe('parsePlainText', () => {
  test('splits by newlines', () => {
    const result = parsePlainText('Line 1\nLine 2\nLine 3');
    expect(result.lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
    expect(result.sourceFormat).toBe('plain');
  });

  test('trims whitespace', () => {
    const result = parsePlainText('  hello  \n  world  ');
    expect(result.lines).toEqual(['hello', 'world']);
  });

  test('filters empty lines', () => {
    const result = parsePlainText('Line 1\n\n\nLine 2\n   \nLine 3');
    expect(result.lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
  });

  test('preserves rawText', () => {
    const text = 'Hello\nWorld';
    const result = parsePlainText(text);
    expect(result.rawText).toBe(text);
  });

  test('handles empty input', () => {
    const result = parsePlainText('');
    expect(result.lines).toEqual([]);
  });
});

describe('parseScript', () => {
  test('detects markdown by .md extension', async () => {
    const result = await parseScript('# Title\n\nHello', 'script.md');
    expect(result.sourceFormat).toBe('markdown');
    expect(result.lines).toContain('Title');
  });

  test('detects markdown by .markdown extension', async () => {
    const result = await parseScript('# Title', 'script.markdown');
    expect(result.sourceFormat).toBe('markdown');
  });

  test('falls back to plain text for .txt', async () => {
    const result = await parseScript('Hello\nWorld', 'script.txt');
    expect(result.sourceFormat).toBe('plain');
    expect(result.lines).toEqual(['Hello', 'World']);
  });

  test('falls back to plain text for unknown extensions', async () => {
    const result = await parseScript('Hello', 'script.xyz');
    expect(result.sourceFormat).toBe('plain');
  });
});

describe('parseDocx', () => {
  test('extracts text from DOCX fixture', async () => {
    const buffer = loadDocxFixture();
    const result = await parseDocx(buffer);
    expect(result.sourceFormat).toBe('docx');
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.rawText).toContain('Welcome to the teleprompter test document');
    expect(result.rawText).toContain('quick brown fox');
    expect(result.rawText).toContain('Thank you for your attention');
  });

  test('DOCX lines are non-empty and trimmed', async () => {
    const buffer = loadDocxFixture();
    const result = await parseDocx(buffer);
    for (const line of result.lines) {
      expect(line.length).toBeGreaterThan(0);
      expect(line).toBe(line.trim());
    }
  });

  test('parseScript detects DOCX by ArrayBuffer', async () => {
    const buffer = loadDocxFixture();
    const result = await parseScript(buffer, 'document.docx');
    expect(result.sourceFormat).toBe('docx');
    expect(result.lines.length).toBeGreaterThan(0);
  });
});
