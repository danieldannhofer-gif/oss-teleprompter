import { describe, test, expect } from 'vitest';
import { ScriptMatcher } from './matcher';

describe('ScriptMatcher', () => {
  test('exact match returns OnScript', () => {
    const m = new ScriptMatcher(['Hello world', 'This is a test']);
    const result = m.match('Hello world');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(0);
  });

  test('completely different text returns OffScript', () => {
    const m = new ScriptMatcher(['Hello world']);
    const result = m.match('Something completely different');
    expect(result.type).toBe('OffScript');
  });

  test('fuzzy match with missing word', () => {
    const m = new ScriptMatcher(['The quick brown fox']);
    const result = m.match('quick brown fox');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(0);
  });

  test('jump to later line', () => {
    const m = new ScriptMatcher(['Line one', 'Line two', 'Line three']);
    const result = m.match('Line three');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(2);
  });

  test('partial transcript matches full line', () => {
    const m = new ScriptMatcher(['The quick brown fox jumps over the lazy dog']);
    const result = m.match('quick brown fox jumps');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(0);
  });

  test('case insensitive matching', () => {
    const m = new ScriptMatcher(['Hello World']);
    const result = m.match('hello world');
    expect(result.type).toBe('OnScript');
  });

  test('ignores punctuation', () => {
    const m = new ScriptMatcher(['Hello, world!']);
    const result = m.match('hello world');
    expect(result.type).toBe('OnScript');
  });

  test('empty transcript returns OffScript', () => {
    const m = new ScriptMatcher(['Hello world']);
    const result = m.match('');
    expect(result.type).toBe('OffScript');
  });

  test('setLines updates the script', () => {
    const m = new ScriptMatcher(['Old line']);
    m.setLines(['New line one', 'New line two']);
    const result = m.match('New line two');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(1);
  });

  test('setCurrentPosition affects hysteresis preference', () => {
    const m = new ScriptMatcher(['Alpha beta', 'Alpha beta', 'Alpha beta']);
    m.setCurrentPosition(2);
    const result = m.match('Alpha beta');
    expect(result.type).toBe('OnScript');
    // Should prefer line near current position (index 2)
    expect(result.lineIndex).toBe(2);
  });

  test('confidence is between 0 and 1', () => {
    const m = new ScriptMatcher(['Hello world']);
    const result = m.match('Hello world');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('accumulates recent words across multiple matches', () => {
    const m = new ScriptMatcher(['The quick brown fox jumps']);
    // First partial
    m.match('The quick');
    // Second partial completes the phrase
    const result = m.match('brown fox jumps');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(0);
  });

  test('custom threshold', () => {
    // Very high threshold — almost nothing matches
    const m = new ScriptMatcher(['Hello world'], 0.99);
    const result = m.match('Hello world');
    // Exact match should still pass even high threshold
    expect(result.type).toBe('OnScript');
  });

  test('handles single word lines', () => {
    const m = new ScriptMatcher(['Yes', 'No', 'Maybe']);
    const result = m.match('Maybe');
    expect(result.type).toBe('OnScript');
    expect(result.lineIndex).toBe(2);
  });

  test('handles empty script', () => {
    const m = new ScriptMatcher([]);
    const result = m.match('Hello');
    expect(result.type).toBe('OffScript');
  });
});
