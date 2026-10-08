import { useState, useCallback } from 'react';
import { overlayMessages } from '../lib/webview';

interface OverlayState {
  isOverlay: boolean;
  isClickThrough: boolean;
  isAlwaysOnTop: boolean;
}

export function useOverlay() {
  const [state, setState] = useState<OverlayState>({
    isOverlay: false,
    isClickThrough: false,
    isAlwaysOnTop: false,
  });

  const toggleOverlay = useCallback(() => {
    setState((prev) => {
      const next = !prev.isOverlay;
      overlayMessages.toggle(next);
      return { ...prev, isOverlay: next };
    });
  }, []);

  const toggleClickThrough = useCallback(() => {
    setState((prev) => {
      const next = !prev.isClickThrough;
      overlayMessages.clickThrough(next);
      return { ...prev, isClickThrough: next };
    });
  }, []);

  const toggleAlwaysOnTop = useCallback(() => {
    setState((prev) => {
      const next = !prev.isAlwaysOnTop;
      overlayMessages.alwaysOnTop(next);
      return { ...prev, isAlwaysOnTop: next };
    });
  }, []);

  return {
    ...state,
    toggleOverlay,
    toggleClickThrough,
    toggleAlwaysOnTop,
  };
}
