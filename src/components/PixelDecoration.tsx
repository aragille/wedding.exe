import { useMemo, type CSSProperties } from 'react'
import { pixelArt, spriteToPaths, type PixelArtName, type PixelPalette } from '../lib/pixelArt'

interface PixelIconProps {
  name: PixelArtName
  /** rendered width in px (or any CSS length) — height follows the sprite ratio */
  size?: number | string
  palette?: PixelPalette
  /** dimensional depth in sprite pixels (reference 6 — chunky objects) */
  depth?: number
  depthColor?: string
  className?: string
  style?: CSSProperties
  title?: string
}

/** One sprite from the WEDDING.EXE pixel library, rendered as crisp SVG. */
export function PixelIcon({
  name,
  size = 32,
  palette,
  depth = 0,
  depthColor = '#0B0B0D',
  className = '',
  style,
  title,
}: PixelIconProps) {
  const art = useMemo(() => spriteToPaths(pixelArt[name], palette), [name, palette])
  const w = art.width + depth
  const h = art.height + depth
  return (
    <svg
      className={`pixel-icon ${className}`}
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      style={{ ...style, aspectRatio: `${w} / ${h}`, height: 'auto' }}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {depth > 0 &&
        Array.from({ length: depth }, (_, i) => depth - i).map((d) => (
          <path key={d} d={art.silhouette} transform={`translate(${d} ${d})`} fill={depthColor} />
        ))}
      {art.paths.map((p) => (
        <path key={p.fill} d={p.d} fill={p.fill} />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */

export type StickerSpec = {
  name: PixelArtName
  /** % positions inside the parent (position: relative) */
  x: number
  y: number
  size: number
  rotate?: number
  depth?: number
  palette?: PixelPalette
  depthColor?: string
  float?: boolean
  delay?: number
  hideOnMobile?: boolean
}

/** A scattered layer of pixel stickers (reference 2 & 4: digital collage). */
export function StickerField({ items, className = '' }: { items: StickerSpec[]; className?: string }) {
  return (
    <div className={`sticker-field ${className}`} aria-hidden="true">
      {items.map((it, i) => (
        <span
          key={i}
          className={`sticker ${it.float ? 'is-floating' : ''} ${it.hideOnMobile ? 'hide-mobile' : ''}`}
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            ['--rot' as string]: `${it.rotate ?? 0}deg`,
            ['--delay' as string]: `${it.delay ?? i * 0.35}s`,
          }}
        >
          <PixelIcon name={it.name} size={it.size} depth={it.depth} palette={it.palette} depthColor={it.depthColor} />
        </span>
      ))}
    </div>
  )
}

/** Tiny technical marker: crosshair / registration mark. */
export function TechMarker({ className = '', label }: { className?: string; label?: string }) {
  return (
    <span className={`tech-marker ${className}`} aria-hidden="true">
      <svg viewBox="0 0 11 11" width="11" height="11" shapeRendering="crispEdges">
        <path d="M5 0h1v4H5zM5 7h1v4H5zM0 5h4v1H0zM7 5h4v1H7z" fill="currentColor" />
      </svg>
      {label && <span>{label}</span>}
    </span>
  )
}
