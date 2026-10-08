import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeech } from './useSpeech';
import { simulateBackendMessage, getSentMessages, clearSentMessages } from '../test/setup';

describe('useSpeech', () => {
  beforeEach(() => {
    clearSentMessages();
  });

  test('initial state', () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.isListening).toBe(false);
    expect(result.current.language).toBe('auto');
    expect(result.current.lastTranscript).toBe('');
    expect(result.current.error).toBeNull();
  });

  test('startListening sends speech:start message', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.startListening());
    const messages = getSentMessages();
    expect(messages).toContainEqual({ type: 'speech:start' });
  });

  test('stopListening sends speech:stop message', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.stopListening());
    const messages = getSentMessages();
    expect(messages).toContainEqual({ type: 'speech:stop' });
  });

  test('setLanguage sends speech:setLanguage message', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => result.current.setLanguage('de'));
    const messages = getSentMessages();
    expect(messages).toContainEqual({ type: 'speech:setLanguage', lang: 'de' });
    expect(result.current.language).toBe('de');
  });

  test('receives speech:started event', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });
    expect(result.current.isListening).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('receives speech:stopped event', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });
    expect(result.current.isListening).toBe(true);
    act(() => {
      simulateBackendMessage({ type: 'speech:stopped' });
    });
    expect(result.current.isListening).toBe(false);
  });

  test('receives speech:error event', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => {
      simulateBackendMessage({ type: 'speech:error', message: 'Microphone not found' });
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBe('Microphone not found');
  });

  test('receives speech:transcript event', () => {
    const { result } = renderHook(() => useSpeech());
    act(() => {
      simulateBackendMessage({ type: 'speech:transcript', text: 'Hello world', is_final: true });
    });
    expect(result.current.lastTranscript).toBe('Hello world');
  });

  test('onTranscript callback fires on transcript events', () => {
    const { result } = renderHook(() => useSpeech());
    const received: Array<{ text: string; isFinal: boolean }> = [];
    act(() => {
      result.current.onTranscript((text, isFinal) => {
        received.push({ text, isFinal });
      });
    });
    act(() => {
      simulateBackendMessage({ type: 'speech:transcript', text: 'Hello', is_final: false });
    });
    act(() => {
      simulateBackendMessage({ type: 'speech:transcript', text: 'Hello world', is_final: true });
    });
    expect(received).toEqual([
      { text: 'Hello', isFinal: false },
      { text: 'Hello world', isFinal: true },
    ]);
  });

  test('onTranscript callback only fires for final transcripts when filtered', () => {
    const { result } = renderHook(() => useSpeech());
    const finals: string[] = [];
    act(() => {
      result.current.onTranscript((text, isFinal) => {
        if (isFinal) finals.push(text);
      });
    });
    act(() => {
      simulateBackendMessage({ type: 'speech:transcript', text: 'Hel', is_final: false });
      simulateBackendMessage({ type: 'speech:transcript', text: 'Hello', is_final: true });
    });
    expect(finals).toEqual(['Hello']);
  });
});
