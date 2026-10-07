import { useEffect, useRef } from 'react'
import { usePrompter } from '../hooks/usePrompter'

export function PrompterView() {
  const { lines, currentIndex, isPlaying, speed } = usePrompter()
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const el = lineRefs.current[currentIndex]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIndex])

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      const { currentIndex, lines, jumpTo, pause } = usePrompter.getState()
      if (currentIndex < lines.length - 1) jumpTo(currentIndex + 1)
      else pause()
    }, 3000 / speed)
    return () => window.clearInterval(timer)
  }, [isPlaying, speed])

  return (
    <div ref={containerRef} className="prompter-view">
      {lines.length === 0 ? (
        <p className="prompter-empty">No script loaded.</p>
      ) : (
        lines.map((line, i) => (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el }}
            className={`prompter-line ${i === currentIndex ? 'current' : i < currentIndex ? 'past' : ''}`}
          >
            {line}
          </div>
        ))
      )}
    </div>
  )
}
