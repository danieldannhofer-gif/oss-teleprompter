import { useState, useEffect, useRef, useCallback } from 'react';
import { usePrompter } from './usePrompter';
import type { Section } from '../lib/types';

interface SectionTimerState {
  /** Current section being timed */
  section: Section | null;
  /** Total duration in seconds */
  totalSeconds: number;
  /** Remaining seconds (can go negative = overtime) */
  remainingSeconds: number;
  /** Progress 0-1 (1 = full time remaining, 0 = time's up) */
  progress: number;
  /** Whether the timer is actively counting down */
  isRunning: boolean;
  /** Whether time has run out (remainingSeconds <= 0) */
  isOvertime: boolean;
  /** Whether the current section has a timecode */
  hasTimeCode: boolean;
}

/**
 * Section timer hook — counts down the duration of the current section.
 * Auto-starts when entering a section with durationMinutes.
 * Pauses when the prompter is paused or when leaving the section.
 */
export function useSectionTimer(): SectionTimerState & {
  start: () => void;
  pause: () => void;
  reset: () => void;
} {
  const prompter = usePrompter();
  const { sections, currentIndex, isPlaying } = prompter;

  // Find current section
  const section = sections.find(
    (s) => currentIndex >= s.startLine && currentIndex <= s.endLine
  ) ?? null;

  const hasTimeCode = section?.durationMinutes !== undefined;
  const totalSeconds = (section?.durationMinutes ?? 0) * 60;

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSectionRef = useRef<Section | null>(null);

  // Reset timer when section changes
  useEffect(() => {
    if (section !== lastSectionRef.current) {
      lastSectionRef.current = section;
      if (section?.durationMinutes !== undefined) {
        setRemainingSeconds(section.durationMinutes * 60);
        setIsPaused(false);
        // Auto-start if prompter is playing
        setIsRunning(isPlaying);
      } else {
        setIsRunning(false);
        setRemainingSeconds(0);
      }
    }
  }, [section, isPlaying]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning || !hasTimeCode || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          // Overtime — keep counting up
          return prev - 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, hasTimeCode, isPaused]);

  // Pause when prompter pauses, resume/auto-start when playing
  useEffect(() => {
    if (!isPlaying && isRunning) {
      setIsPaused(true);
      setIsRunning(false);
    } else if (isPlaying && hasTimeCode) {
      // Auto-start or resume when playing and section has timecode
      setIsPaused(false);
      setIsRunning(true);
    }
  }, [isPlaying, hasTimeCode]);

  const start = useCallback(() => {
    if (hasTimeCode) {
      setIsPaused(false);
      setIsRunning(true);
    }
  }, [hasTimeCode]);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
    setIsPaused(false);
  }, [totalSeconds]);

  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
    : 0;

  return {
    section,
    totalSeconds,
    remainingSeconds,
    progress,
    isRunning: isRunning && !isPaused,
    isOvertime: remainingSeconds <= 0 && hasTimeCode,
    hasTimeCode,
    start,
    pause,
    reset,
  };
}

/**
 * Format seconds as MM:SS or H:MM:SS.
 */
export function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
