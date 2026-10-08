import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSectionTimer, formatTime } from './useSectionTimer';
import { usePrompter } from './usePrompter';

describe('formatTime', () => {
  test('formats seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(599)).toBe('09:59');
  });

  test('formats hours as H:MM:SS', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
  });

  test('handles negative (overtime)', () => {
    expect(formatTime(-5)).toBe('00:05');
    expect(formatTime(-65)).toBe('01:05');
  });
});

describe('useSectionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    });
  });

  test('no timecode — hasTimeCode is false', () => {
    usePrompter.getState().setLines(
      ['Line 1', 'Line 2'],
      [{ title: 'Section', startLine: 0, endLine: 1 }]
    );
    const { result } = renderHook(() => useSectionTimer());
    expect(result.current.hasTimeCode).toBe(false);
    expect(result.current.totalSeconds).toBe(0);
  });

  test('section with timecode — hasTimeCode is true', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome', 'Body', 'Content'],
      [
        { title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 5, timeCode: '5m' },
        { title: 'Body', startLine: 2, endLine: 3, durationMinutes: 10, timeCode: '10m' },
      ]
    );
    const { result } = renderHook(() => useSectionTimer());
    expect(result.current.hasTimeCode).toBe(true);
    expect(result.current.totalSeconds).toBe(300); // 5 min
    expect(result.current.section?.title).toBe('Intro');
  });

  test('timer counts down when playing', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 1, timeCode: '1m' }]
    );
    usePrompter.getState().play();

    const { result } = renderHook(() => useSectionTimer());
    expect(result.current.remainingSeconds).toBe(60);

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds
    });
    expect(result.current.remainingSeconds).toBe(55);
  });

  test('timer pauses when prompter pauses', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 1, timeCode: '1m' }]
    );
    usePrompter.getState().play();

    const { result } = renderHook(() => useSectionTimer());

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.remainingSeconds).toBe(55);

    // Pause prompter
    act(() => {
      usePrompter.getState().pause();
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    // Should not have counted down while paused
    expect(result.current.remainingSeconds).toBe(55);
  });

  test('timer resets when section changes', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome', 'Body', 'Content'],
      [
        { title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 1, timeCode: '1m' },
        { title: 'Body', startLine: 2, endLine: 3, durationMinutes: 2, timeCode: '2m' },
      ]
    );
    usePrompter.getState().play();

    const { result } = renderHook(() => useSectionTimer());
    expect(result.current.totalSeconds).toBe(60);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.remainingSeconds).toBe(50);

    // Jump to next section
    act(() => {
      usePrompter.getState().jumpTo(2);
    });

    expect(result.current.section?.title).toBe('Body');
    expect(result.current.totalSeconds).toBe(120); // 2 min
    expect(result.current.remainingSeconds).toBe(120); // reset
  });

  test('overtime when time runs out', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 0, timeCode: '0m' }]
    );
    // Use a very short duration — 0 minutes = 0 seconds
    usePrompter.getState().play();

    const { result } = renderHook(() => useSectionTimer());

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isOvertime).toBe(true);
    expect(result.current.remainingSeconds).toBeLessThanOrEqual(0);
  });

  test('progress is between 0 and 1', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 1, timeCode: '1m' }]
    );
    usePrompter.getState().play();

    const { result } = renderHook(() => useSectionTimer());
    expect(result.current.progress).toBe(1);

    act(() => {
      vi.advanceTimersByTime(30000); // 30 seconds
    });
    expect(result.current.progress).toBeCloseTo(0.5, 1);
  });

  test('manual reset restores full time', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 1, timeCode: '1m' }]
    );
    usePrompter.getState().play();

    const { result } = renderHook(() => useSectionTimer());

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(result.current.remainingSeconds).toBe(40);

    act(() => {
      result.current.reset();
    });
    expect(result.current.remainingSeconds).toBe(60);
  });
});
