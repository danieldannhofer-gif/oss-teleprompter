import { useState, useCallback, useRef, useEffect } from 'react';
import { speechMessages, onBackendMessage } from '../lib/webview';

interface SpeechState {
  isListening: boolean;
  language: string;
  lastTranscript: string;
  error: string | null;
}

type TranscriptHandler = (text: string, isFinal: boolean) => void;

export function useSpeech() {
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    language: 'auto',
    lastTranscript: '',
    error: null,
  });

  const handlerRef = useRef<TranscriptHandler | null>(null);

  // Listen for transcript events from C++ backend
  useEffect(() => {
    const unsubscribe = onBackendMessage((msg) => {
      if (msg.type === 'speech:transcript') {
        const text = msg.text as string;
        const isFinal = msg.is_final as boolean;
        setState((s) => ({ ...s, lastTranscript: text }));
        handlerRef.current?.(text, isFinal);
      } else if (msg.type === 'speech:started') {
        setState((s) => ({ ...s, isListening: true, error: null }));
      } else if (msg.type === 'speech:stopped') {
        setState((s) => ({ ...s, isListening: false }));
      } else if (msg.type === 'speech:error') {
        setState((s) => ({ ...s, isListening: false, error: msg.message as string }));
      }
    });
    return unsubscribe;
  }, []);

  const startListening = useCallback(() => {
    speechMessages.start();
  }, []);

  const stopListening = useCallback(() => {
    speechMessages.stop();
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setState((s) => ({ ...s, language: lang }));
    speechMessages.setLanguage(lang);
  }, []);

  const onTranscript = useCallback((handler: TranscriptHandler) => {
    handlerRef.current = handler;
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    setLanguage,
    onTranscript,
  };
}
