import { useRef, useState } from 'react'
import { usePrompter } from '../hooks/usePrompter'
import { parseDocx, parseMarkdown, parsePlainText, splitIntoPrompterLines } from '../lib/parser'
import type { LocaleStrings } from '../lib/i18n'

export function ScriptEditor({ t, onClose }: { t: LocaleStrings; onClose: () => void }) {
  const { setLines } = usePrompter()
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = async (file: File) => {
    let lines: string[]
    if (file.name.endsWith('.docx')) {
      const script = await parseDocx(await file.arrayBuffer())
      lines = splitIntoPrompterLines(script)
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      lines = splitIntoPrompterLines(parseMarkdown(await file.text()))
    } else {
      lines = splitIntoPrompterLines(parsePlainText(await file.text()))
    }
    setPreview(lines)
  }

  const loadPasted = () => {
    setPreview(splitIntoPrompterLines(parseMarkdown(text)))
  }

  const confirm = () => {
    setLines(preview)
    onClose()
  }

  return (
    <div className="script-editor">
      <h2>{t.scriptTitle}</h2>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.docx,.txt"
        onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.noScript}
        rows={8}
      />
      <div className="script-editor-buttons">
        <button onClick={loadPasted}>{t.import}</button>
        <button onClick={confirm} disabled={preview.length === 0}>OK</button>
        <button onClick={onClose}>{t.close}</button>
      </div>
      {preview.length > 0 && (
        <div className="script-preview">
          {preview.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  )
}
