import { useCallback, useEffect, useRef } from 'react'
import { motion as timing } from '../config/designTokens'
import type { Dir } from './MovementLogic'

const KEYMAP: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}

interface Options {
  enabled: boolean
  /** returns false when the move was blocked (stops slides / held repeats) */
  move: (dir: Dir) => boolean
  /** called when any manual input happens (cancels auto-walk) */
  onManualInput?: () => void
}

/**
 * Keyboard (arrows / WASD with hold-to-repeat), on-screen D-pad (press & hold)
 * and swipe (slide until blocked). Movement is always one grid step at a time.
 */
export function usePlayerController({ enabled, move, onManualInput }: Options) {
  const held = useRef<Dir | null>(null)
  const timer = useRef<number | null>(null)
  const moveRef = useRef(move)
  moveRef.current = move
  const manualRef = useRef(onManualInput)
  manualRef.current = onManualInput

  const stop = useCallback(() => {
    held.current = null
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
  }, [])

  const begin = useCallback(
    (dir: Dir) => {
      if (!enabled) return
      manualRef.current?.()
      if (held.current === dir && timer.current) return
      stop()
      held.current = dir
      moveRef.current(dir)
      timer.current = window.setInterval(() => {
        if (!held.current) return stop()
        if (!moveRef.current(held.current)) {
          /* keep holding against a wall without spamming bumps */
        }
      }, timing.stepMs)
    },
    [enabled, stop],
  )

  // keyboard
  useEffect(() => {
    if (!enabled) return
    const down = (e: KeyboardEvent) => {
      const dir = KEYMAP[e.code]
      if (!dir) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      e.preventDefault()
      if (e.repeat) return
      begin(dir)
    }
    const up = (e: KeyboardEvent) => {
      const dir = KEYMAP[e.code]
      if (dir && held.current === dir) stop()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', stop)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', stop)
      stop()
    }
  }, [enabled, begin, stop])

  useEffect(() => () => stop(), [stop])

  /** Swipe handlers for the board element. Returns true if the gesture was a swipe. */
  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null)
  const slide = useRef<number | null>(null)

  const stopSlide = useCallback(() => {
    if (slide.current) window.clearInterval(slide.current)
    slide.current = null
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    swipeStart.current = { x: e.clientX, y: e.clientY, t: performance.now() }
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent): boolean => {
      const s = swipeStart.current
      swipeStart.current = null
      if (!s || !enabled) return false
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return false
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      manualRef.current?.()
      stopSlide()
      if (!moveRef.current(dir)) return true
      slide.current = window.setInterval(() => {
        if (!moveRef.current(dir)) stopSlide()
      }, timing.stepMs)
      return true
    },
    [enabled, stopSlide],
  )

  useEffect(() => () => stopSlide(), [stopSlide])

  return { begin, stop, stopSlide, onPointerDown, onPointerUp }
}
