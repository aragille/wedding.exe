import { useSyncExternalStore } from 'react'

/**
 * Chiptune SFX — synthesised with Web Audio, no audio files.
 * Muted by default (brief: optional, user-initiated, muted initially).
 * The AudioContext is only created after the guest turns sound on (a user gesture).
 */

export type Sfx =
  | 'hover'
  | 'click'
  | 'start'
  | 'step'
  | 'bump'
  | 'heart'
  | 'win'
  | 'reunion'
  | 'glitch'
  | 'achievement'
  | 'wipe'
  | 'select'
  | 'deselect'
  | 'up'
  | 'down'
  | 'success'
  | 'saved'
  | 'error'
  | 'toggle'

type Wave = OscillatorType
interface Note {
  /** start offset (s) */
  t: number
  f: number
  d: number
  wave?: Wave
  vol?: number
  /** pitch glide target (Hz) */
  to?: number
}

const STORAGE_KEY = 'wedding.exe:sound'

// C-major-ish chip scale helpers
const N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568, C4: 261.63, G4: 392, E4: 329.63, A4: 440 }

const arp = (notes: number[], step: number, d: number, wave: Wave = 'square', vol = 0.18): Note[] =>
  notes.map((f, i) => ({ t: i * step, f, d, wave, vol }))

const BANK: Record<Exclude<Sfx, 'glitch' | 'wipe'>, Note[]> = {
  hover: [{ t: 0, f: 1800, d: 0.025, wave: 'square', vol: 0.04 }],
  click: [{ t: 0, f: 900, d: 0.05, wave: 'square', vol: 0.14, to: 1400 }],
  toggle: [{ t: 0, f: 660, d: 0.05, wave: 'square', vol: 0.12 }, { t: 0.05, f: 990, d: 0.06, wave: 'square', vol: 0.12 }],
  start: [...arp([N.C5, N.E5, N.G5, N.C6], 0.07, 0.08), { t: 0.28, f: N.G6, d: 0.22, wave: 'square', vol: 0.16 }],
  step: [{ t: 0, f: 220, d: 0.04, wave: 'triangle', vol: 0.22, to: 160 }],
  bump: [{ t: 0, f: 120, d: 0.09, wave: 'square', vol: 0.12, to: 70 }],
  heart: arp([N.E6, N.G6 * 1.0, N.C6 * 2], 0.045, 0.06, 'square', 0.12),
  win: [...arp([N.C5, N.E5, N.G5, N.C6, N.E6], 0.06, 0.07, 'square', 0.15), { t: 0.3, f: N.G6, d: 0.3, wave: 'triangle', vol: 0.2 }],
  reunion: arp([N.G5, N.C6, N.E6, N.G6], 0.09, 0.14, 'triangle', 0.2),
  achievement: [
    ...arp([N.C5, N.C5, N.C5], 0.1, 0.07, 'square', 0.15),
    { t: 0.32, f: N.G5, d: 0.12, wave: 'square', vol: 0.15 },
    { t: 0.46, f: N.A5, d: 0.12, wave: 'square', vol: 0.15 },
    { t: 0.6, f: N.C6, d: 0.42, wave: 'square', vol: 0.16 },
    { t: 0.6, f: N.E5, d: 0.42, wave: 'triangle', vol: 0.18 },
    { t: 0.6, f: N.C4, d: 0.42, wave: 'triangle', vol: 0.2 },
  ],
  select: [{ t: 0, f: N.C5, d: 0.06, wave: 'square', vol: 0.13 }, { t: 0.06, f: N.G5, d: 0.09, wave: 'square', vol: 0.13 }],
  deselect: [{ t: 0, f: N.E4, d: 0.08, wave: 'triangle', vol: 0.2 }, { t: 0.08, f: N.C4, d: 0.12, wave: 'triangle', vol: 0.2 }],
  up: [{ t: 0, f: 700, d: 0.05, wave: 'square', vol: 0.12, to: 1000 }],
  down: [{ t: 0, f: 700, d: 0.05, wave: 'square', vol: 0.12, to: 480 }],
  success: [
    ...arp([N.G4, N.C5, N.E5, N.G5, N.C6], 0.08, 0.09, 'square', 0.15),
    { t: 0.42, f: N.E6, d: 0.16, wave: 'square', vol: 0.14 },
    { t: 0.58, f: N.C6, d: 0.4, wave: 'triangle', vol: 0.2 },
  ],
  saved: [{ t: 0, f: N.E5, d: 0.14, wave: 'triangle', vol: 0.2 }, { t: 0.16, f: N.C5, d: 0.3, wave: 'triangle', vol: 0.2 }],
  error: [{ t: 0, f: 160, d: 0.12, wave: 'square', vol: 0.13 }, { t: 0.14, f: 120, d: 0.2, wave: 'square', vol: 0.13 }],
}

/* ------------------------------------------------------------------ */

let enabled = readPref()
const listeners = new Set<() => void>()
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

function readPref() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function ensureCtx() {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.55
  master.connect(ctx.destination)
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate)
  const data = noise.getChannelData(0)
  // stepped (sample-and-hold) noise sounds more 8-bit than white noise
  let v = 0
  for (let i = 0; i < data.length; i++) {
    if (i % 24 === 0) v = Math.random() * 2 - 1
    data[i] = v
  }
  return ctx
}

function tone(c: AudioContext, n: Note, at: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = n.wave ?? 'square'
  o.frequency.setValueAtTime(n.f, at + n.t)
  if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, at + n.t + n.d)
  const v = n.vol ?? 0.15
  g.gain.setValueAtTime(0, at + n.t)
  g.gain.linearRampToValueAtTime(v, at + n.t + 0.004)
  g.gain.setValueAtTime(v, at + n.t + n.d * 0.7)
  g.gain.linearRampToValueAtTime(0, at + n.t + n.d)
  o.connect(g).connect(master!)
  o.start(at + n.t)
  o.stop(at + n.t + n.d + 0.02)
}

function noiseBurst(c: AudioContext, at: number, d: number, vol: number, from: number, to: number) {
  if (!noise) return
  const src = c.createBufferSource()
  src.buffer = noise
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.setValueAtTime(from, at)
  f.frequency.exponentialRampToValueAtTime(to, at + d)
  f.Q.value = 1.2
  const g = c.createGain()
  g.gain.setValueAtTime(vol, at)
  g.gain.linearRampToValueAtTime(0, at + d)
  src.connect(f).connect(g).connect(master!)
  src.start(at)
  src.stop(at + d + 0.02)
}

const lastPlayed = new Map<Sfx, number>()
const MIN_GAP: Partial<Record<Sfx, number>> = { hover: 60, bump: 220, step: 40 }
let stepFlip = false

export function play(name: Sfx) {
  if (!enabled) return
  const c = ensureCtx()
  if (!c || !master) return
  if (c.state === 'suspended') void c.resume()
  const now = performance.now()
  const gap = MIN_GAP[name]
  if (gap && now - (lastPlayed.get(name) ?? 0) < gap) return
  lastPlayed.set(name, now)
  const at = c.currentTime + 0.005

  if (name === 'glitch') {
    noiseBurst(c, at, 0.35, 0.22, 4000, 300)
    tone(c, { t: 0.02, f: 90, d: 0.25, wave: 'sawtooth', vol: 0.06, to: 40 }, at)
    return
  }
  if (name === 'wipe') {
    noiseBurst(c, at, 0.28, 0.07, 600, 5000)
    return
  }
  if (name === 'step') {
    stepFlip = !stepFlip
    tone(c, { t: 0, f: stepFlip ? 220 : 196, d: 0.04, wave: 'triangle', vol: 0.22, to: stepFlip ? 160 : 140 }, at)
    return
  }
  BANK[name].forEach((n) => tone(c, n, at))
}

export function isSoundOn() {
  return enabled
}

/** Must be called from a user gesture (click) so the AudioContext may start. */
export function setSoundOn(on: boolean) {
  enabled = on
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* storage blocked — preference just won't persist */
  }
  if (on) {
    ensureCtx()
    void ctx?.resume()
    play('toggle')
  }
  listeners.forEach((l) => l())
}

export function useSoundOn() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => enabled,
    () => false,
  )
}
