import { marked } from 'marked'
import mammoth from 'mammoth'
import type { Script } from './types'

export function parseMarkdown(text: string): Script {
  const tokens = marked.lexer(text)
  const lines: string[] = []
  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === 'heading' || node.type === 'paragraph') {
        const line = (node.text ?? '').replace(/[*_`~]/g, '').trim()
        if (line.length > 0) lines.push(line)
      } else if (node.type === 'list_item') {
        const line = (node.text ?? '').replace(/[*_`~]/g, '').trim()
        if (line.length > 0) lines.push(line)
        if (node.items) walk(node.items)
      } else if (node.tokens) {
        walk(node.tokens)
      } else if (node.items) {
        walk(node.items)
      }
    }
  }
  walk(tokens)
  return { lines, rawText: text, sourceFormat: 'markdown' }
}

export function parsePlainText(text: string): Script {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  return { lines, rawText: text, sourceFormat: 'text' }
}

export async function parseDocx(buffer: ArrayBuffer): Promise<Script> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  const lines = result.value.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  return { lines, rawText: result.value, sourceFormat: 'docx' }
}

export function splitIntoPrompterLines(script: Script, maxChars = 120): string[] {
  // Long paragraphs are chunked into prompter-friendly lines.
  const out: string[] = []
  for (const line of script.lines) {
    if (line.length <= maxChars) {
      out.push(line)
      continue
    }
    const words = line.split(' ')
    let cur = ''
    for (const w of words) {
      if (cur.length + w.length + 1 > maxChars && cur.length > 0) {
        out.push(cur)
        cur = w
      } else {
        cur = cur.length ? `${cur} ${w}` : w
      }
    }
    if (cur.length) out.push(cur)
  }
  return out
}
