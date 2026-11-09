import { PixelIcon } from './PixelDecoration'

/** Marquee band — duplicated track for a seamless loop. */
export function Ticker({ items, className = '' }: { items: string[]; className?: string }) {
  const track = (
    <div className="ticker__track">
      {[...items, ...items].map((it, i) => (
        <span key={i} className="ticker__item">
          {it}
          <PixelIcon name={i % 2 ? 'heartSmall' : 'sparkle'} size={14} palette={i % 2 ? { a: '#FF4D16' } : { a: '#C4FF3B' }} />
        </span>
      ))}
    </div>
  )
  return (
    <div className={`ticker ${className}`} aria-hidden="true">
      {track}
      {track}
    </div>
  )
}
