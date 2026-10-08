import { useState, useRef } from 'react';
import { usePrompter } from '../hooks/usePrompter';
import { parseMarkdown, parseDocx, parsePlainText } from '../lib/parser';

interface ScriptEditorProps {
  onClose: () => void;
}

export function ScriptEditor({ onClose }: ScriptEditorProps) {
  const prompter = usePrompter();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const script = await parseDocx(buffer);
        prompter.setLines(script.lines, script.sections);
      } else {
        const content = await file.text();
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
          const script = parseMarkdown(content);
          prompter.setLines(script.lines, script.sections);
        } else {
          const script = parsePlainText(content);
          prompter.setLines(script.lines, script.sections);
        }
      }
      onClose();
    } catch (err) {
      setError(`Failed to import: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePaste = () => {
    try {
      const script = parsePlainText(text);
      prompter.setLines(script.lines, script.sections);
      onClose();
    } catch (err) {
      setError(`Failed to parse: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          width: '90%',
          maxWidth: 700,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>Import Script</h2>

        {/* File import */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.docx"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              cursor: 'pointer',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
            }}
          >
            Import File (.md, .docx, .txt)
          </button>
        </div>

        <div style={{ textAlign: 'center', color: '#666' }}>— or paste text —</div>

        {/* Text paste */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your script here..."
          style={{
            width: '100%',
            minHeight: 200,
            padding: 12,
            fontSize: 14,
            fontFamily: 'monospace',
            background: '#0a0a0a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: 6,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              cursor: 'pointer',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 6,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePaste}
            disabled={!text.trim()}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              background: text.trim() ? '#16a34a' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              opacity: text.trim() ? 1 : 0.5,
            }}
          >
            Load Script
          </button>
        </div>
      </div>
    </div>
  );
}
