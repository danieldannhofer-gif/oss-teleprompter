import { useCallback, useState } from 'react'
import { postMessage } from '../lib/webview'

interface OverlayState {
  overlay: boolean
  clickThrough: boolean
  alwaysOnTop: boolean
}

export function useOverlay(initial: Partial<OverlayState> = {}) {
  const [state, setState] = useState<OverlayState>({
    overlay: false,
    clickThrough: false,
    alwaysOnTop: false,
    ...initial,
  })

  const toggleOverlay = useCallback(() => {
    setState((s) => {
      const overlay = !s.overlay
      postMessage({ type: 'overlay:toggle', enabled: overlay })
      return { ...s, overlay }
    })
  }, [])

  const toggleClickThrough = useCallback(() => {
    setState((s) => {
      const clickThrough = !s.clickThrough
      postMessage({ type: 'overlay:clickThrough', enabled: clickThrough })
      return { ...s, clickThrough }
    })
  }, [])

  const toggleAlwaysOnTop = useCallback(() => {
    setState((s) => {
      const alwaysOnTop = !s.alwaysOnTop
      postMessage({ type: 'overlay:alwaysOnTop', enabled: alwaysOnTop })
      return { ...s, alwaysOnTop }
    })
  }, [])

  return { ...state, toggleOverlay, toggleClickThrough, toggleAlwaysOnTop }
}
