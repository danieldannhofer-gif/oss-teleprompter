import { describe, test, expect, beforeEach } from 'vitest';
import { usePrompter } from './usePrompter';

describe('usePrompter', () => {
  beforeEach(() => {
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

  test('initial state', () => {
    const s = usePrompter.getState();
    expect(s.lines).toEqual([]);
    expect(s.currentIndex).toBe(0);
    expect(s.isPlaying).toBe(false);
    expect(s.speed).toBe(1.0);
  });

  test('setLines sets lines and resets index', () => {
    usePrompter.getState().setLines(['line 1', 'line 2', 'line 3']);
    const s = usePrompter.getState();
    expect(s.lines).toEqual(['line 1', 'line 2', 'line 3']);
    expect(s.currentIndex).toBe(0);
  });

  test('play sets isPlaying to true', () => {
    usePrompter.getState().play();
    expect(usePrompter.getState().isPlaying).toBe(true);
  });

  test('pause sets isPlaying to false', () => {
    usePrompter.getState().play();
    usePrompter.getState().pause();
    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('togglePlay toggles isPlaying', () => {
    expect(usePrompter.getState().isPlaying).toBe(false);
    usePrompter.getState().togglePlay();
    expect(usePrompter.getState().isPlaying).toBe(true);
    usePrompter.getState().togglePlay();
    expect(usePrompter.getState().isPlaying).toBe(false);
  });

  test('setSpeed updates speed', () => {
    usePrompter.getState().setSpeed(2.5);
    expect(usePrompter.getState().speed).toBe(2.5);
  });

  test('setSpeed clamps to [0.1, 5.0]', () => {
    usePrompter.getState().setSpeed(0.01);
    expect(usePrompter.getState().speed).toBe(0.1);
    usePrompter.getState().setSpeed(10);
    expect(usePrompter.getState().speed).toBe(5.0);
  });

  test('jumpTo updates currentIndex', () => {
    usePrompter.getState().setLines(['a', 'b', 'c']);
    usePrompter.getState().jumpTo(2);
    expect(usePrompter.getState().currentIndex).toBe(2);
  });

  test('jumpTo clamps to valid range', () => {
    usePrompter.getState().setLines(['a', 'b', 'c']);
    usePrompter.getState().jumpTo(-1);
    expect(usePrompter.getState().currentIndex).toBe(0);
    usePrompter.getState().jumpTo(99);
    expect(usePrompter.getState().currentIndex).toBe(2);
  });

  test('next increments currentIndex', () => {
    usePrompter.getState().setLines(['a', 'b', 'c']);
    usePrompter.getState().next();
    expect(usePrompter.getState().currentIndex).toBe(1);
  });

  test('next does not exceed last line', () => {
    usePrompter.getState().setLines(['a', 'b']);
    usePrompter.getState().jumpTo(1);
    usePrompter.getState().next();
    expect(usePrompter.getState().currentIndex).toBe(1);
  });

  test('prev decrements currentIndex', () => {
    usePrompter.getState().setLines(['a', 'b', 'c']);
    usePrompter.getState().jumpTo(2);
    usePrompter.getState().prev();
    expect(usePrompter.getState().currentIndex).toBe(1);
  });

  test('prev does not go below 0', () => {
    usePrompter.getState().setLines(['a', 'b']);
    usePrompter.getState().prev();
    expect(usePrompter.getState().currentIndex).toBe(0);
  });

  test('setFontSize updates fontSize', () => {
    usePrompter.getState().setFontSize(48);
    expect(usePrompter.getState().fontSize).toBe(48);
  });

  test('setFontFamily updates fontFamily', () => {
    usePrompter.getState().setFontFamily('Arial');
    expect(usePrompter.getState().fontFamily).toBe('Arial');
  });

  test('setTextColor updates textColor', () => {
    usePrompter.getState().setTextColor('#ff0000');
    expect(usePrompter.getState().textColor).toBe('#ff0000');
  });

  test('reset resets currentIndex and isPlaying', () => {
    usePrompter.getState().setLines(['a', 'b', 'c']);
    usePrompter.getState().jumpTo(2);
    usePrompter.getState().play();
    usePrompter.getState().reset();
    const s = usePrompter.getState();
    expect(s.currentIndex).toBe(0);
    expect(s.isPlaying).toBe(false);
  });
});
