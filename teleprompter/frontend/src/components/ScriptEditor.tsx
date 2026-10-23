import { useState, useRef, useEffect } from 'react';
import { usePrompter } from '../hooks/usePrompter';
import { parseMarkdown, parseDocx, parsePlainText } from '../lib/parser';
import {
  getScripts,
  saveScript,
  deleteScript,
  renameScript,
  deriveScriptName,
} from '../lib/scriptLibrary';
import type { SavedScript, ScriptFormat } from '../lib/scriptLibrary';

interface ScriptEditorProps {
  onClose: () => void;
}

export function ScriptEditor({ onClose }: ScriptEditorProps) {
  const prompter = usePrompter();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setScripts(getScripts());
    return () => {
      if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    };
  }, []);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      let rawContent: string;
      let format: ScriptFormat;
      if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const script = await parseDocx(buffer);
        prompter.setLines(script.lines, script.sections);
        rawContent = script.rawText;
        format = 'docx';
      } else {
        const content = await file.text();
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
          const script = parseMarkdown(content);
          prompter.setLines(script.lines, script.sections);
          format = 'markdown';
        } else {
          const script = parsePlainText(content);
          prompter.setLines(script.lines, script.sections);
          format = 'plain';
        }
        rawContent = content;
      }
      // Save to the recent-scripts library, named after the file
      saveScript(rawContent, format, file.name.replace(/\.[^.]+$/, ''));
      onClose();
    } catch (err) {
      setError(`Failed to import: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePaste = () => {
    try {
      const script = parsePlainText(text);
      prompter.setLines(script.lines, script.sections);
      saveScript(text, 'plain');
      onClose();
    } catch (err) {
      setError(`Failed to parse: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    const content = prompter.lines.join('\n');
    if (!content.trim()) return;

    const baseName =
      deriveScriptName(content, 'script')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'script';
    const filename = `${baseName}.md`;

    // Browser download via Blob + anchor; the .md file can be re-imported
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setExportMessage(`Exported ${filename}`);
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    exportTimerRef.current = setTimeout(() => setExportMessage(null), 3000);
  };

  const handleLoadSaved = (saved: SavedScript) => {
    try {
      const script =
        saved.format === 'markdown'
          ? parseMarkdown(saved.content)
          : parsePlainText(saved.content);
      prompter.setLines(script.lines, script.sections);
      onClose();
    } catch (err) {
      setError(`Failed to load: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = (id: string) => {
    setScripts(deleteScript(id));
    if (renamingId === id) {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleRenameStart = (saved: SavedScript) => {
    setRenamingId(saved.id);
    setRenameValue(saved.name);
  };

  const handleRenameCommit = () => {
    if (renamingId) {
      setScripts(renameScript(renamingId, renameValue));
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRenameCommit();
    if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const hasScript = prompter.lines.length > 0;

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
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>Import Script</h2>

        {/* File import + export */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
          <button
            onClick={handleExport}
            disabled={!hasScript}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              cursor: hasScript ? 'pointer' : 'not-allowed',
              background: hasScript ? '#7c3aed' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              opacity: hasScript ? 1 : 0.5,
            }}
          >
            Export Current Script (.md)
          </button>
          {exportMessage && (
            <span style={{ fontSize: 12, color: '#4ade80' }}>{exportMessage}</span>
          )}
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

        {/* Recent scripts */}
        <div>
          <h3 style={{ margin: 0, fontSize: 14, color: '#999' }}>Recent Scripts</h3>
          {scripts.length === 0 ? (
            <div style={{ fontSize: 13, color: '#666', padding: '8px 0' }}>
              No saved scripts yet. Imported or pasted scripts are saved automatically.
            </div>
          ) : (
            <div
              style={{
                marginTop: 8,
                maxHeight: 180,
                overflowY: 'auto',
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: 6,
              }}
            >
              {scripts.map((saved) => (
                <div
                  key={saved.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderBottom: '1px solid #262626',
                  }}
                >
                  {renamingId === saved.id ? (
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={handleRenameCommit}
                      autoFocus
                      style={{
                        flex: 1,
                        minWidth: 0,
                        boxSizing: 'border-box',
                        background: '#0a0a0a',
                        color: '#fff',
                        border: '1px solid #2563eb',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 13,
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => handleLoadSaved(saved)}
                      title="Load this script"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: '#e5e5e5',
                        fontSize: 13,
                        cursor: 'pointer',
                        padding: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {saved.name}
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap' }}>
                    {new Date(saved.savedAt).toLocaleDateString()}
                  </span>
                  {renamingId !== saved.id && (
                    <>
                      <button
                        onClick={() => handleRenameStart(saved)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                          background: '#333',
                          color: '#fff',
                          border: '1px solid #555',
                          borderRadius: 4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(saved.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                          background: '#7f1d1d',
                          color: '#fff',
                          border: '1px solid #991b1b',
                          borderRadius: 4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
