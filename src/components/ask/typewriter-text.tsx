'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const CHARS_PER_FRAME = 2
const FRAME_INTERVAL = 16

interface TypewriterTextProps {
  readonly text: string
  readonly className?: string
}

export function TypewriterText({ text, className }: TypewriterTextProps) {
  const [revealed, setRevealed] = useState('')
  const [done, setDone] = useState(text.length === 0)
  const rafRef = useRef<number>(0)
  const indexRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!text) {
      return undefined
    }

    function step(timestamp: number) {
      if (timestamp - lastTimeRef.current >= FRAME_INTERVAL) {
        lastTimeRef.current = timestamp
        indexRef.current = Math.min(indexRef.current + CHARS_PER_FRAME, text.length)
        setRevealed(text.slice(0, indexRef.current))

        if (indexRef.current >= text.length) {
          setDone(true)
          return
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(rafRef.current)
  }, [text])

  const skip = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setRevealed(text)
    setDone(true)
  }, [text])

  return (
    <div className={className} onClick={done ? undefined : skip}>
      {done ? text : revealed}
      {!done && <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-accent/70 align-text-bottom" />}
    </div>
  )
}
