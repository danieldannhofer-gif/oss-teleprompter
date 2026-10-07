import { renderHook, act } from '@testing-library/react'
import { useSpeech } from './useSpeech'
import { postMessage, isHosted } from '../lib/webview'
import { vi } from 'vitest'

vi.mock('../lib/webview', () => ({
  postMessage: vi.fn(),
  onMessage: vi.fn(() => () => {}),
  isHosted: vi.fn(() => false),
}))

describe('useSpeech', () => {
  test('startListening sets isListening and posts message', () => {
    const { result } = renderHook(() => useSpeech())
    expect(result.current.isListening).toBe(false)
    act(() => result.current.startListening())
    expect(result.current.isListening).toBe(true)
    expect(postMessage).toHaveBeenCalledWith({ type: 'speech:start' })
  })

  test('stopListening clears isListening', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.startListening())
    act(() => result.current.stopListening())
    expect(result.current.isListening).toBe(false)
    expect(postMessage).toHaveBeenCalledWith({ type: 'speech:stop' })
  })

  test('setLanguage posts message and updates state', () => {
    const { result } = renderHook(() => useSpeech())
    act(() => result.current.setLanguage('en'))
    expect(result.current.language).toBe('en')
    expect(postMessage).toHaveBeenCalledWith({ type: 'speech:setLanguage', lang: 'en' })
  })

  test('webview wrapper is inert without host', () => {
    expect(isHosted()).toBe(false)
    expect(() => postMessage({ type: 'x' })).not.toThrow()
  })
})
