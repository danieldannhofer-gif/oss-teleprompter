import { useEffect, useRef } from 'react';
import { usePrompter } from './usePrompter';
import { useSpeech } from './useSpeech';
import { ScriptMatcher } from '../lib/matcher';

/**
 * Voice-tracking hook: connects speech recognition to prompter auto-scroll.
 *
 * When the speaker is on-script: jumps to the matched line and plays.
 * When the speaker goes off-script: pauses the prompter.
 */
export function useVoiceTracking(enabled: boolean) {
  const prompter = usePrompter();
  const speech = useSpeech();
  const matcherRef = useRef<ScriptMatcher | null>(null);

  // Update matcher when script lines change
  const lines = prompter.lines;
  useEffect(() => {
    if (lines.length > 0) {
      if (!matcherRef.current) {
        matcherRef.current = new ScriptMatcher(lines);
      } else {
        matcherRef.current.setLines(lines);
      }
    }
  }, [lines]);

  // Handle transcript events
  useEffect(() => {
    if (!enabled) return;

    speech.onTranscript((text, isFinal) => {
      if (!isFinal || !matcherRef.current) return;

      const result = matcherRef.current.match(text);

      if (result.type === 'OnScript') {
        prompter.jumpTo(result.lineIndex);
        prompter.play();
      } else {
        prompter.pause();
      }
    });
  }, [enabled, speech, prompter]);

  // Sync matcher position with prompter position
  const currentIndex = prompter.currentIndex;
  useEffect(() => {
    matcherRef.current?.setCurrentPosition(currentIndex);
  }, [currentIndex]);

  return {
    isListening: speech.isListening,
    startListening: speech.startListening,
    stopListening: speech.stopListening,
    setLanguage: speech.setLanguage,
    lastTranscript: speech.lastTranscript,
    error: speech.error,
  };
}
