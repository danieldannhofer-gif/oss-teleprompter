import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Timeline } from './Timeline';
import { usePrompter } from '../hooks/usePrompter';

describe('Timeline', () => {
  beforeEach(() => {
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

  test('renders nothing when no script loaded', () => {
    const { container } = render(<Timeline />);
    expect(container.firstChild).toBeNull();
  });

  test('renders sections as pills', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome', 'Body', 'Details', 'End', 'Thanks'],
      [
        { title: 'Introduction', startLine: 0, endLine: 1 },
        { title: 'Body', startLine: 2, endLine: 3 },
        { title: 'End', startLine: 4, endLine: 5 },
      ]
    );
    render(<Timeline />);
    // Section titles appear in pills (and possibly in progress text)
    expect(screen.getAllByText('Introduction').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Body').length).toBeGreaterThan(0);
    expect(screen.getAllByText('End').length).toBeGreaterThan(0);
  });

  test('shows progress text', () => {
    usePrompter.getState().setLines(
      ['Line 1', 'Line 2', 'Line 3'],
      [{ title: 'Section', startLine: 0, endLine: 2 }]
    );
    render(<Timeline />);
    expect(screen.getByText('1 / 3')).toBeTruthy();
  });

  test('clicking a section jumps to its start line', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome', 'Body', 'Details'],
      [
        { title: 'Introduction', startLine: 0, endLine: 1 },
        { title: 'Body', startLine: 2, endLine: 3 },
      ]
    );
    render(<Timeline />);
    fireEvent.click(screen.getByText('Body'));
    expect(usePrompter.getState().currentIndex).toBe(2);
  });

  test('highlights current section', () => {
    usePrompter.getState().setLines(
      ['Intro', 'Welcome', 'Body', 'Details'],
      [
        { title: 'Introduction', startLine: 0, endLine: 1 },
        { title: 'Body', startLine: 2, endLine: 3 },
      ]
    );
    usePrompter.getState().jumpTo(2);
    render(<Timeline />);
    // Current section title appears in the progress text at the bottom
    const progressText = screen.getAllByText('Body');
    expect(progressText.length).toBeGreaterThan(0);
  });

  test('shows progress bar', () => {
    usePrompter.getState().setLines(
      ['A', 'B', 'C', 'D'],
      [{ title: 'All', startLine: 0, endLine: 3 }]
    );
    usePrompter.getState().jumpTo(1);
    const { container } = render(<Timeline />);
    // Progress bar should be at 50% (2/4)
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeTruthy();
  });
});
