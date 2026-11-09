import { useMemo } from 'react'
import { mulberry32 } from '../lib/random'

const COLORS = ['var(--lime)', 'var(--lavender)', 'var(--off-white)', 'var(--blue)', 'var(--orange)']
const WEIGHTS = [0.3, 0.25, 0.3, 0.1, 0.05]

function pick(r: number) {
  let acc = 0
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i]
    if (r <= acc) return COLORS[i]
  }
  return COLORS[0]
}

/** Twinkling pixel dust — pure CSS, stepped animation, deterministic layout. */
export function PixelParticles({ count = 48, seed = 7 }: { count?: number; seed?: number }) {
  const dots = useMemo(() => {
    const rnd = mulberry32(seed)
    return Array.from({ length: count }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      s: [2, 3, 4, 6][Math.floor(rnd() * 4)],
      c: pick(rnd()),
      d: (rnd() * 6).toFixed(2),
      t: (2 + rnd() * 4).toFixed(2),
      drift: rnd() > 0.6,
    }))
  }, [count, seed])

  return (
    <div className="pixel-particles" aria-hidden="true">
      {dots.map((p, i) => (
        <i
          key={i}
          className={p.drift ? 'drift' : ''}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            background: p.c,
            animationDelay: `${p.d}s`,
            animationDuration: `${p.t}s`,
          }}
        />
      ))}
    </div>
  )
}

/** One-shot pixel confetti burst. */
export function PixelConfetti({ count = 56, seed = 3 }: { count?: number; seed?: number }) {
  const bits = useMemo(() => {
    const rnd = mulberry32(seed)
    const palette = ['var(--lime)', 'var(--orange)', 'var(--lavender)', 'var(--off-white)', 'var(--blue)']
    return Array.from({ length: count }, () => ({
      x: rnd() * 100,
      s: [4, 6, 8][Math.floor(rnd() * 3)],
      c: palette[Math.floor(rnd() * palette.length)],
      delay: (rnd() * 0.5).toFixed(2),
      dur: (1.1 + rnd() * 0.9).toFixed(2),
      dx: Math.round((rnd() - 0.5) * 120),
      heart: rnd() > 0.85,
    }))
  }, [count, seed])
  return (
    <div className="pixel-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          className={b.heart ? 'is-heart' : ''}
          style={{
            left: `${b.x}%`,
            width: b.s,
            height: b.s,
            background: b.c,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ['--dx' as string]: `${b.dx}px`,
          }}
        />
      ))}
    </div>
  )
}
