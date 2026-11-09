import { useEffect, useState, type CSSProperties } from 'react'
import { characterAssets, type AssetKey, type CharacterAsset } from '../config/characterAssets'
import { PixelIcon } from './PixelDecoration'
import type { PixelArtName } from '../lib/pixelArt'

/* ------------------------------------------------------------------ */
/* Asset availability probe (shared cache — each file is checked once) */
/* ------------------------------------------------------------------ */

type Status = 'loading' | 'ready' | 'missing'
const cache = new Map<string, Status>()
const pending = new Map<string, Promise<Status>>()

function probe(src: string): Promise<Status> {
  const hit = cache.get(src)
  if (hit && hit !== 'loading') return Promise.resolve(hit)
  const inflight = pending.get(src)
  if (inflight) return inflight
  const p = new Promise<Status>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img.naturalWidth > 0 ? 'ready' : 'missing')
    // A missing file may come back as the SPA's index.html → decode fails → onerror.
    img.onerror = () => resolve('missing')
    img.src = src
  }).then((s) => {
    cache.set(src, s)
    pending.delete(src)
    return s
  })
  pending.set(src, p)
  return p
}

export function useAssetStatus(src: string): Status {
  const [status, setStatus] = useState<Status>(() => cache.get(src) ?? 'loading')
  useEffect(() => {
    let alive = true
    probe(src).then((s) => alive && setStatus(s))
    return () => {
      alive = false
    }
  }, [src])
  return status
}

/** Warm the cache for a list of assets (call early so game sprites are ready). */
export function preloadAssets(keys: AssetKey[]) {
  keys.forEach((k) => void probe(characterAssets[k].src))
}

/* ------------------------------------------------------------------ */

export interface PixelAssetProps {
  asset: AssetKey
  /** CSS width; height follows the manifest aspect ratio */
  size?: number | string
  /** 'image' (default) or 'sprite' (spritesheet strip). Defaults from the manifest. */
  mode?: 'image' | 'sprite'
  /** sprite: animate frames */
  playing?: boolean
  /** mirror horizontally (e.g. walking left) */
  flip?: boolean
  /** decorative = hidden from assistive tech */
  decorative?: boolean
  alt?: string
  className?: string
  style?: CSSProperties
  /** force the placeholder (useful for previews) */
  forcePlaceholder?: boolean
  /** extra small tag in the placeholder, e.g. "P1" */
  tag?: string
}

export function PixelAsset({
  asset,
  size = '100%',
  mode,
  playing = true,
  flip = false,
  decorative = false,
  alt,
  className = '',
  style,
  forcePlaceholder = false,
  tag,
}: PixelAssetProps) {
  const spec = characterAssets[asset]
  const status = useAssetStatus(spec.src)
  const resolvedMode = mode ?? (spec.sprite ? 'sprite' : 'image')
  const label = alt ?? `${spec.label}`

  const wrapStyle: CSSProperties = {
    width: size,
    aspectRatio: String(spec.aspect),
    ...style,
  }

  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': label }
  const flipCls = flip ? 'is-flipped' : ''

  if (status === 'ready' && !forcePlaceholder) {
    if (resolvedMode === 'sprite' && spec.sprite) {
      const { frames, fps } = spec.sprite
      return (
        <div className={`pixel-asset pixel-asset--sprite ${flipCls} ${className}`} style={wrapStyle} {...a11y}>
          <img
            src={spec.src}
            alt=""
            draggable={false}
            className={`pixel-asset__strip ${playing ? 'is-playing' : ''}`}
            style={{
              width: `${frames * 100}%`,
              animationDuration: `${frames / fps}s`,
              animationTimingFunction: `steps(${frames})`,
            }}
          />
        </div>
      )
    }
    return (
      <div className={`pixel-asset ${flipCls} ${className}`} style={wrapStyle} {...a11y}>
        <img src={spec.src} alt="" draggable={false} className="pixel-asset__img" />
      </div>
    )
  }

  return (
    <AssetPlaceholder
      spec={spec}
      className={`${flipCls} ${className} ${status === 'loading' ? 'is-loading' : ''}`}
      style={wrapStyle}
      a11y={a11y}
      animated={resolvedMode === 'sprite' && playing}
      tag={tag}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Placeholder                                                         */
/* ------------------------------------------------------------------ */

const silhouetteFor = (spec: CharacterAsset): PixelArtName => {
  if (spec.subject === 'couple') return 'couple'
  const isBust = spec.key.endsWith('portrait')
  if (spec.subject === 'ilia') return isBust ? 'bustA' : 'bodyA'
  return isBust ? 'bustB' : 'bodyB'
}

function AssetPlaceholder({
  spec,
  className,
  style,
  a11y,
  animated,
  tag,
}: {
  spec: CharacterAsset
  className: string
  style: CSSProperties
  a11y: Record<string, unknown>
  animated: boolean
  tag?: string
}) {
  const sil = silhouetteFor(spec)
  return (
    <div className={`asset-ph asset-ph--${spec.tone} ${className}`} style={style} {...a11y} data-asset={spec.id}>
      <div className="asset-ph__inner">
        <span className="asset-ph__corner tl" />
        <span className="asset-ph__corner tr" />
        <span className="asset-ph__corner bl" />
        <span className="asset-ph__corner br" />
        <div className={`asset-ph__sil ${animated ? 'is-bobbing' : ''}`}>
          <PixelIcon name={sil} size="100%" />
        </div>
        <div className="asset-ph__id">
          [{spec.id}]{tag ? <b> {tag}</b> : null}
        </div>
        <div className="asset-ph__meta">
          <div className="asset-ph__label">{spec.label}</div>
          <div className="asset-ph__desc">{spec.description}</div>
          <div className="asset-ph__spec">
            {spec.sprite
              ? `${spec.sprite.frames}×${spec.sprite.frameWidth}×${spec.sprite.frameHeight} SHEET`
              : `${spec.nativeWidth}×${spec.nativeHeight}`}{' '}
            · PNG · ALPHA
          </div>
        </div>
      </div>
    </div>
  )
}
