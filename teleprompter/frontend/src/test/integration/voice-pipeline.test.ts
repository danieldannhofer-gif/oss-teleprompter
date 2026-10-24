// Integration test: voice-tracking pipeline end-to-end
//
// Proves that a transcript event from the (mocked) C++ backend flows through:
//   WebView2 IPC → useSpeech → useVoiceTracking → matcher.ts → usePrompter store
//
// Only the WebView2 IPC layer is mocked (via test/setup.ts).
// The real usePrompter store, useSpeech hook, useVoiceTracking hook,
// and ScriptMatcher are used throughout.

import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceTracking } from '../../hooks/useVoiceTracking';
import { usePrompter } from '../../hooks/usePrompter';
import { simulateBackendMessage, clearSentMessages } from '../setup';

const SCRIPT_LINES = [
  'Welcome everyone to today\'s keynote presentation',
  'We will cover the quarterly financial results',
  'And discuss our roadmap for the next year',
  'Thank you all for being here today',
];

function resetPrompter(): void {
  usePrompter.getState().reset();
  usePrompter.setState({
    lines: [],
    sections: [],
    currentIndex: 0,
    isPlaying: false,
    speed: 1.0,
    fontSize: 32,
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    textColor: '#ffffff',
    backgroundOpacity: 0.85,
  });
}

function sendTranscript(text: string, isFinal = true): void {
  act(() => {
    simulateBackendMessage({
      type: 'speech:transcript',
      text,
      is_final: isFinal,
    });
  });
}

describe('voice pipeline integration', () => {
  beforeEach(() => {
    clearSentMessages();
    resetPrompter();
  });

  test('on-script transcript jumps prompter to matched line and starts playback', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    renderHook(() => useVoiceTracking(true));

    // Simulate backend: listening started
    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Speaker says line 2 verbatim
    sendTranscript('We will cover the quarterly financial results');

    const state = usePrompter.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.isPlaying).toBe(true);
  });

  test('off-script transcript pauses the prompter', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    usePrompter.getState().play();
    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Speaker goes completely off-script
    sendTranscript('I like turtles and pizza on Fridays');

    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('sequential on-script transcripts advance the prompter through the script', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Speaker reads line 0
    sendTranscript('Welcome everyone to today\'s keynote presentation');
    expect(usePrompter.getState().currentIndex).toBe(0);
    expect(usePrompter.getState().isPlaying).toBe(true);

    // Speaker advances to line 2 — the matcher accumulates recent words,
    // so the combined context still matches line 2 strongly.
    sendTranscript('And discuss our roadmap for the next year');
    expect(usePrompter.getState().currentIndex).toBe(2);
    expect(usePrompter.getState().isPlaying).toBe(true);
  });

  test('on-script then off-script: plays then pauses', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // On-script: should play
    sendTranscript('Welcome everyone to today\'s keynote presentation');
    expect(usePrompter.getState().isPlaying).toBe(true);
    expect(usePrompter.getState().currentIndex).toBe(0);

    // Off-script: the matcher buffers up to 50 recent words, so we need
    // enough off-script text to push the on-script words out of the buffer
    // and drop the match score below the 0.7 threshold.
    sendTranscript(
      'I went to the grocery store yesterday morning and bought milk bread eggs cheese ' +
      'butter apples bananas chicken rice pasta tomatoes onions garlic olive oil salt ' +
      'pepper coffee tea sugar flour baking soda laundry detergent dish soap paper ' +
      'towels toilet paper shampoo conditioner toothpaste deodorant razors shaving ' +
      'cream hand soap sponges trash bags aluminum foil plastic wrap ziplock bags'
    );
    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('non-final (interim) transcripts do not affect prompter state', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Interim transcript matching line 1 — should be ignored
    sendTranscript('We will cover the quarterly financial results', false);

    const state = usePrompter.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  test('fuzzy match: slightly misrecognized transcript still matches on-script', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    // Slightly misrecognized version of line 1 (missing "the", extra "a")
    sendTranscript('We will cover a quarterly financial results');

    const state = usePrompter.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.isPlaying).toBe(true);
  });

  test('speech lifecycle events flow through the pipeline', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    const { result } = renderHook(() => useVoiceTracking(true));

    // Initially not listening
    expect(result.current.isListening).toBe(false);

    // Backend says listening started
    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });
    expect(result.current.isListening).toBe(true);

    // Transcript flows through
    sendTranscript('Welcome everyone to today\'s keynote presentation');
    expect(result.current.lastTranscript).toBe('Welcome everyone to today\'s keynote presentation');
    expect(usePrompter.getState().isPlaying).toBe(true);

    // Backend says listening stopped
    act(() => {
      simulateBackendMessage({ type: 'speech:stopped' });
    });
    expect(result.current.isListening).toBe(false);
  });

  test('voice tracking disabled: transcripts do not affect prompter', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    renderHook(() => useVoiceTracking(false));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    sendTranscript('Welcome everyone to today\'s keynote presentation');

    const state = usePrompter.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  test('empty script: transcript does not crash and prompter stays idle', () => {
    // No lines set — matcher has nothing to match against
    renderHook(() => useVoiceTracking(true));

    act(() => {
      simulateBackendMessage({ type: 'speech:started' });
    });

    sendTranscript('Hello world');

    const state = usePrompter.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  test('startListening sends speech:start message to backend via IPC', () => {
    usePrompter.getState().setLines(SCRIPT_LINES);
    const { result } = renderHook(() => useVoiceTracking(true));

    act(() => {
      result.current.startListening();
    });

    // The hook should have posted a speech:start message through the mocked WebView2
    const wv = (window as unknown as { chrome: { webview: { _sentMessages: unknown[] } } }).chrome?.webview;
    const sent = wv?._sentMessages ?? [];
    const startMsg = sent.find(
      (m) => typeof m === 'object' && m !== null && (m as Record<string, unknown>).type === 'speech:start'
    );
    expect(startMsg).toBeDefined();
  });
});
