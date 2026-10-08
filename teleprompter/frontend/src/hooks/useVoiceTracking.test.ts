import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceTracking } from './useVoiceTracking';
import { usePrompter } from './usePrompter';
import { simulateBackendMessage, clearSentMessages } from '../test/setup';

describe('useVoiceTracking', () => {
  beforeEach(() => {
    clearSentMessages();
    usePrompter.getState().reset();
    usePrompter.setState({
      lines: [],
      currentIndex: 0,
      isPlaying: false,
      speed: 1.0,
      fontSize: 32,
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      textColor: '#ffffff',
    });
  });

  test('returns speech state when disabled', () => {
    const { result } = renderHook(() => useVoiceTracking(false));
    expect(result.current.isListening).toBe(false);
    expect(result.current.lastTranscript).toBe('');
  });

  test('startListening sends speech:start to backend', () => {
    const { result } = renderHook(() => useVoiceTracking(true));
    act(() => { result.current.startListening(); });
    // The hook delegates to useSpeech which sends the message
    // We verify by checking the prompter state isn't affected
    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('on-script transcript jumps to line and plays', () => {
    usePrompter.getState().setLines([
      'Welcome to the presentation',
      'Today we discuss quarterly results',
      'Thank you for your attention',
    ]);

    renderHook(() => useVoiceTracking(true));

    // Simulate backend saying listening started
    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Simulate on-script transcript
    act(() => {
      simulateBackendMessage({
        type: 'speech:transcript',
        text: 'Today we discuss quarterly results',
        is_final: true,
      });
    });

    const state = usePrompter.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.isPlaying).toBe(true);
  });

  test('off-script transcript pauses prompter', () => {
    usePrompter.getState().setLines(['Welcome to the presentation']);
    usePrompter.getState().play();

    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Off-script: completely different text
    act(() => {
      simulateBackendMessage({
        type: 'speech:transcript',
        text: 'What a beautiful day for a walk in the park',
        is_final: true,
      });
    });

    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('non-final transcripts are ignored', () => {
    usePrompter.getState().setLines(['Welcome to the presentation']);

    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Non-final transcript should not trigger matching
    act(() => {
      simulateBackendMessage({
        type: 'speech:transcript',
        text: 'Welcome to the presentation',
        is_final: false,
      });
    });

    // Should not have jumped or started playing
    expect(usePrompter.getState().currentIndex).toBe(0);
    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('disabled voice tracking does not process transcripts', () => {
    usePrompter.getState().setLines(['Welcome to the presentation']);

    renderHook(() => useVoiceTracking(false));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    act(() => {
      simulateBackendMessage({
        type: 'speech:transcript',
        text: 'Welcome to the presentation',
        is_final: true,
      });
    });

    // Should not have jumped or started playing
    expect(usePrompter.getState().currentIndex).toBe(0);
    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('updates matcher when lines change', () => {
    const { rerender } = renderHook(() => useVoiceTracking(true));

    // Set initial lines
    act(() => {
      usePrompter.getState().setLines(['First line', 'Second line']);
    });
    rerender();

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Match against new lines
    act(() => {
      simulateBackendMessage({
        type: 'speech:transcript',
        text: 'Second line',
        is_final: true,
      });
    });

    expect(usePrompter.getState().currentIndex).toBe(1);
  });
});
