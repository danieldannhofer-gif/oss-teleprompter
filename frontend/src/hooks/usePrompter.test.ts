import { renderHook, act } from '@testing-library/react'
import { usePrompter } from './usePrompter'

describe('usePrompter', () => {
  beforeEach(() => {
    act(() => {
      usePrompter.getState().setLines([])
      usePrompter.getState().pause()
      usePrompter.getState().setSpeed(1)
      usePrompter.getState().jumpTo(0)
    })
  })

  test('play/pause toggles isPlaying', () => {
    const { result } = renderHook(() => usePrompter())
    expect(result.current.isPlaying).toBe(false)
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
    act(() => result.current.pause())
    expect(result.current.isPlaying).toBe(false)
  })

  test('setSpeed updates speed', () => {
    const { result } = renderHook(() => usePrompter())
    act(() => result.current.setSpeed(2.5))
    expect(result.current.speed).toBe(2.5)
  })

  test('jumpTo updates currentIndex', () => {
    const { result } = renderHook(() => usePrompter())
    act(() => result.current.setLines(['a', 'b', 'c']))
    act(() => result.current.jumpTo(2))
    expect(result.current.currentIndex).toBe(2)
  })

  test('jumpTo clamps to valid range', () => {
    const { result } = renderHook(() => usePrompter())
    act(() => result.current.setLines(['a', 'b', 'c']))
    act(() => result.current.jumpTo(99))
    expect(result.current.currentIndex).toBe(2)
    act(() => result.current.jumpTo(-5))
    expect(result.current.currentIndex).toBe(0)
  })

  test('setLines resets position and playback', () => {
    const { result } = renderHook(() => usePrompter())
    act(() => {
      result.current.setLines(['a', 'b'])
      result.current.play()
      result.current.jumpTo(1)
    })
    act(() => result.current.setLines(['x', 'y', 'z']))
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.isPlaying).toBe(false)
  })
})
