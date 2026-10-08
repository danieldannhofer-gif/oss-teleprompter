import { parseMarkdown, parsePlainText, splitIntoPrompterLines } from './parser'

describe('parseMarkdown', () => {
  test('strips formatting', () => {
    const md = '# Title\n\nHello **world**\n\n- item 1'
    const result = parseMarkdown(md)
    expect(result.lines[0]).toBe('Title')
    expect(result.lines[1]).toBe('Hello world')
    expect(result.lines).toContain('item 1')
    expect(result.sourceFormat).toBe('markdown')
  })

  test('keeps raw text', () => {
    const md = '# Title\n\nHello **world**'
    const result = parseMarkdown(md)
    expect(result.rawText).toBe(md)
  })
})

describe('parsePlainText', () => {
  test('splits non-empty lines', () => {
    const result = parsePlainText('a\n\nb\n  \nc')
    expect(result.lines).toEqual(['a', 'b', 'c'])
    expect(result.sourceFormat).toBe('text')
  })
})

describe('splitIntoPrompterLines', () => {
  test('chunks long paragraphs', () => {
    const long = 'word '.repeat(40).trim()
    const out = splitIntoPrompterLines({ lines: [long], rawText: long, sourceFormat: 'text' }, 60)
    expect(out.length).toBeGreaterThan(1)
    for (const line of out) expect(line.length).toBeLessThanOrEqual(60)
  })

  test('keeps short lines as-is', () => {
    const out = splitIntoPrompterLines({ lines: ['kurz', 'auch kurz'], rawText: '', sourceFormat: 'text' })
    expect(out).toEqual(['kurz', 'auch kurz'])
  })
})
