import { useId, useMemo, type CSSProperties } from 'react'
import { GLYPH_HEIGHT, cellsToPath, layoutText } from '../lib/pixelFont'
import { color as c } from '../config/designTokens'

/**
 * Dimensional pixel lettering — rendered as SVG geometry, not a font.
 *
 * Layer stack per letter (back → front):
 *   1. dithered drop shadow (optional, 50% checker)
 *   2. stepped extrusion (`depth` copies offset down-right, dark → light)
 *   3. bevel: shade on bottom/right edges, highlight on top/left edges
 *   4. face filled with hard-stop colour bands
 *   5. a diagonal shine that sweeps across (CSS, disabled for reduced motion)
 */

export interface WordmarkPalette {
  bands: [string, string, string]
  highlight: string
  shade: string
  /** near → far */
  extrude: [string, string, string]
  dither?: string
}

export const wordmarkPalettes = {
  blue: {
    bands: [c.lavender, c.blueSky, c.blue],
    highlight: c.offWhite,
    shade: c.blueDeep,
    extrude: [c.blueDeep, '#14237F', c.blueAbyss],
    dither: c.lavender,
  },
  orange: {
    bands: ['#FFB199', '#FF7A4D', c.orange],
    highlight: '#FFFFFF',
    shade: c.orangeDeep,
    extrude: ['#2A2A30', '#1A1A1F', c.black],
    dither: c.black,
  },
  lime: {
    bands: ['#EEFFC2', '#DBFF80', c.lime],
    highlight: '#FFFFFF',
    shade: c.limeDeep,
    extrude: [c.limeDeep, '#4F7000', '#2B3D00'],
    dither: c.lime,
  },
  ink: {
    bands: ['#3A3A44', '#24242B', c.black],
    highlight: '#6B6B78',
    shade: c.black,
    extrude: [c.lavender, c.lavenderDeep, c.blue],
    dither: c.blue,
  },
} satisfies Record<string, WordmarkPalette>

export type WordmarkPaletteName = keyof typeof wordmarkPalettes

interface Props {
  text: string
  palette?: WordmarkPaletteName | WordmarkPalette
  /** sub-units per glyph cell (bevel = 1 sub-unit) */
  cell?: number
  /** extrusion depth in sub-units */
  depth?: number
  dither?: boolean
  animate?: boolean
  shine?: boolean
  className?: string
  style?: CSSProperties
  /** accessible label; if omitted the graphic is decorative */
  label?: string
  /** delay (s) before the drop-in starts */
  delay?: number
}

export function PixelWordmark({
  text,
  palette = 'blue',
  cell = 4,
  depth = 6,
  dither = true,
  animate = true,
  shine = true,
  className = '',
  style,
  label,
  delay = 0,
}: Props) {
  const rid = useId().replace(/:/g, '')
  const pal = typeof palette === 'string' ? wordmarkPalettes[palette] : palette
  const { glyphs, width } = useMemo(() => layoutText(text), [text])

  const ditherOffset = depth + 3
  const pad = 2
  const vbW = width * cell + ditherOffset + pad * 2
  const vbH = GLYPH_HEIGHT * cell + ditherOffset + pad * 2
  const faceH = GLYPH_HEIGHT * cell

  const extrudeColor = (d: number) => {
    const t = d / depth
    return t <= 0.34 ? pal.extrude[0] : t <= 0.67 ? pal.extrude[1] : pal.extrude[2]
  }

  return (
    <svg
      className={`pixel-wordmark ${animate ? 'is-animated' : ''} ${className}`}
      viewBox={`0 0 ${vbW} ${vbH}`}
      style={{ ...style, ['--pw-delay' as string]: `${delay}s` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${rid}-bands`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={faceH}>
          <stop offset="0" stopColor={pal.bands[0]} />
          <stop offset="0.3" stopColor={pal.bands[0]} />
          <stop offset="0.3" stopColor={pal.bands[1]} />
          <stop offset="0.58" stopColor={pal.bands[1]} />
          <stop offset="0.58" stopColor={pal.bands[2]} />
          <stop offset="1" stopColor={pal.bands[2]} />
        </linearGradient>
        <pattern id={`${rid}-dither`} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill={pal.dither ?? pal.extrude[0]} />
          <rect x="1" y="1" width="1" height="1" fill={pal.dither ?? pal.extrude[0]} />
        </pattern>
      </defs>
      <g transform={`translate(${pad} ${pad})`}>
        {glyphs.map((gl, i) => {
          if (gl.cells.length === 0) return null
          const d = cellsToPath(gl.cells, cell)
          const id = `${rid}-g${i}`
          const ox = gl.x * cell
          return (
            <g key={i} transform={`translate(${ox} 0)`} style={{ ['--i' as string]: i }}>
            <g className="pw-letter">
              <defs>
                <path id={id} d={d} />
                <clipPath id={`${id}-c`}>
                  <use href={`#${id}`} />
                </clipPath>
                <clipPath id={`${id}-cm`}>
                  <use href={`#${id}`} x={-1} y={-1} />
                </clipPath>
              </defs>
              {dither && <use href={`#${id}`} x={ditherOffset} y={ditherOffset} fill={`url(#${rid}-dither)`} />}
              {Array.from({ length: depth }, (_, k) => depth - k).map((dd) => (
                <use key={dd} href={`#${id}`} x={dd} y={dd} fill={extrudeColor(dd)} />
              ))}
              <g clipPath={`url(#${id}-c)`}>
                <use href={`#${id}`} fill={pal.shade} />
                <use href={`#${id}`} x={-1} y={-1} fill={pal.highlight} />
                <g clipPath={`url(#${id}-cm)`}>
                  <use href={`#${id}`} x={1} y={1} fill={`url(#${rid}-bands)`} />
                  {shine && (
                    <rect
                      className="pw-shine"
                      x={-gl.width * cell}
                      y={-2}
                      width={cell * 1.5}
                      height={faceH + 4}
                      fill={pal.highlight}
                      opacity="0.85"
                      style={{ ['--w' as string]: `${gl.width * cell * 3}px` }}
                    />
                  )}
                </g>
              </g>
            </g>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
