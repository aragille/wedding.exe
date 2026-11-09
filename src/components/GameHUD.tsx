import type { ReactNode } from 'react'

export interface HUDItem {
  label: ReactNode
  value: ReactNode
  tone?: 'orange' | 'lime' | 'lavender' | 'blue'
  blink?: boolean
}

/** Arcade heads-up display row — 1UP / HIGH SCORE / 2UP style. */
export function GameHUD({ items, className = '' }: { items: HUDItem[]; className?: string }) {
  return (
    <div className={`hud ${className}`}>
      {items.map((it, i) => (
        <div key={i} className="hud__cell">
          <span className={`hud__label tone-${it.tone ?? 'orange'} ${it.blink ? 'blink' : ''}`}>{it.label}</span>
          <span className="hud__value">{it.value}</span>
        </div>
      ))}
    </div>
  )
}
