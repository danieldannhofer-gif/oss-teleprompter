// Simple fuzzy script matcher for the frontend
// Mirrors the C++ ScriptMatcher logic for real-time voice-tracking

import type { MatchResult } from './types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - dist / maxLen;
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 0);
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const MAX_RECENT_WORDS = 50;
const DEFAULT_THRESHOLD = 0.7;

export class ScriptMatcher {
  private normalizedLines: string[];
  private recentWords: string[] = [];
  private currentPosition = 0;
  private threshold: number;

  constructor(lines: string[], threshold = DEFAULT_THRESHOLD) {
    this.normalizedLines = lines.map(normalize);
    this.threshold = threshold;
  }

  setLines(lines: string[]): void {
    this.normalizedLines = lines.map(normalize);
    this.recentWords = [];
    this.currentPosition = 0;
  }

  setCurrentPosition(index: number): void {
    this.currentPosition = index;
  }

  match(transcript: string): MatchResult {
    const normalized = normalize(transcript);
    if (normalized) {
      const words = tokenize(normalized);
      this.recentWords.push(...words);
      while (this.recentWords.length > MAX_RECENT_WORDS) {
        this.recentWords.shift();
      }
    }

    const recentText = this.recentWords.join(' ');
    if (!recentText) {
      return { type: 'OffScript', lineIndex: -1, confidence: 0 };
    }

    return this.findBestMatch(recentText);
  }

  private findBestMatch(text: string): MatchResult {
    const transcriptTokens = tokenize(text);
    if (!transcriptTokens.length) {
      return { type: 'OffScript', lineIndex: -1, confidence: 0 };
    }

    let bestScore = 0;
    let bestIndex = -1;

    for (let i = 0; i < this.normalizedLines.length; i++) {
      const line = this.normalizedLines[i];
      if (!line) continue;

      const sim1 = similarity(text, line);

      let substringScore = 0;
      if (line.includes(text)) {
        // Transcript is a contiguous substring of the line.
        // Score by word coverage with a base of 0.65 — a partial
        // contiguous match is a strong on-script signal.
        const lineWords = tokenize(line);
        const textWords = tokenize(text);
        const coverage = textWords.length / lineWords.length;
        substringScore = 0.65 + 0.35 * coverage;
      } else if (text.includes(line)) {
        // Full line is contained in the transcript.
        const lineWords = tokenize(line);
        const textWords = tokenize(text);
        const coverage = lineWords.length / textWords.length;
        substringScore = 0.65 + 0.35 * coverage;
      }

      const lineTokens = tokenize(line);
      const jacScore = jaccard(transcriptTokens, lineTokens);

      let score = Math.max(sim1, substringScore, jacScore * 0.9);

      // Hysteresis: prefer lines near current position
      const distance = Math.abs(i - this.currentPosition);
      const penalty = 1 - Math.min(0.3, distance * 0.01);
      score *= penalty;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestScore >= this.threshold && bestIndex >= 0) {
      return { type: 'OnScript', lineIndex: bestIndex, confidence: bestScore };
    }

    return { type: 'OffScript', lineIndex: -1, confidence: bestScore };
  }
}
