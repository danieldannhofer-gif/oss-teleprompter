import { useCallback, useState } from 'react'
import { postMessage } from '../lib/webview'

export function useOverlay() {
  const [overlay, setOverlay] = useState(false)
  const [clickThrough, setClickThrough] = useState(false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)

  const toggleOverlay = useCallback(() => {
    setOverlay((v) => {
      postMessage({ type: 'overlay:toggle', enabled: !v })
      return !v
    })
  }, [])
  const toggleClickThrough = useCallback(() => {
    setClickThrough((v) => {
      postMessage({ type: 'overlay:clickThrough', enabled: !v })
      return !v
    })
  }, [])
  const toggleAlwaysOnTop = useCallback(() => {
    setAlwaysOnTop((v) => {
      postMessage({ type: 'overlay:alwaysOnTop', enabled: !v })
      return !v
    })
  }, [])

  return { overlay, clickThrough, alwaysOnTop, toggleOverlay, toggleClickThrough, toggleAlwaysOnTop }
}
