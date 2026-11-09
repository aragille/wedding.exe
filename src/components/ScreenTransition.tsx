import { useMemo } from 'react'

const COLS = 12
const ROWS = 8

/**
 * Pixel-block wipe. `phase`:
 *  - 'cover'   blocks pop in diagonally (top-left → bottom-right)
 *  - 'reveal'  blocks pop out in the same order
 *  - 'idle'    nothing rendered
 */
export function ScreenTransition({ phase, color }: { phase: 'idle' | 'cover' | 'reveal'; color: string }) {
  const cells = useMemo(
    () =>
      Array.from({ length: COLS * ROWS }, (_, i) => {
        const x = i % COLS
        const y = Math.floor(i / COLS)
        // diagonal order with a little deterministic jitter
        const jitter = ((x * 7 + y * 13) % 5) * 0.012
        return (x + y) / (COLS + ROWS - 2) * 0.22 + jitter
      }),
    [],
  )
  if (phase === 'idle') return null
  return (
    <div
      className={`screen-wipe is-${phase}`}
      style={{ ['--wipe' as string]: color, gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      aria-hidden="true"
    >
      {cells.map((d, i) => (
        <i key={i} style={{ animationDelay: `${d.toFixed(3)}s` }} />
      ))}
    </div>
  )
}
