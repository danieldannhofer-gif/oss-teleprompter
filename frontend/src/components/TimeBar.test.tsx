import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeBar } from './TimeBar';
import { usePrompter } from '../hooks/usePrompter';

describe('TimeBar', () => {
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

  test('renders nothing without timecode', () => {
    usePrompter.getState().setLines(
      ['Line 1', 'Line 2'],
      [{ title: 'Section', startLine: 0, endLine: 1 }]
    );
    const { container } = render(<TimeBar />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when no script loaded', () => {
    const { container } = render(<TimeBar />);
    expect(container.firstChild).toBeNull();
  });

  test('shows section title and timecode', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Introduction', startLine: 0, endLine: 1, durationMinutes: 5, timeCode: '5m' }]
    );
    render(<TimeBar />);
    expect(screen.getByText('Introduction')).toBeTruthy();
    expect(screen.getByText('(5m)')).toBeTruthy();
  });

  test('shows total duration', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 5, timeCode: '5m' }]
    );
    render(<TimeBar />);
    expect(screen.getByText('/ 05:00')).toBeTruthy();
  });

  test('shows remaining time counting down', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 1, timeCode: '1m' }]
    );
    usePrompter.getState().play();
    render(<TimeBar />);
    expect(screen.getByText('01:00')).toBeTruthy();
  });

  test('shows "Paused" when not running', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 5, timeCode: '5m' }]
    );
    render(<TimeBar />);
    expect(screen.getByText('Paused')).toBeTruthy();
  });

  test('shows "Running" when playing', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome'],
      [{ title: 'Intro', startLine: 0, endLine: 1, durationMinutes: 5, timeCode: '5m' }]
    );
    usePrompter.getState().play();
    render(<TimeBar />);
    expect(screen.getByText('Running')).toBeTruthy();
  });
});
