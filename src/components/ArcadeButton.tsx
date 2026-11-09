import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { play, type Sfx } from '../lib/sound'

type Variant = 'lime' | 'ink' | 'ghost' | 'paper' | 'orange'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** show the animated pixel arrow */
  arrow?: boolean | 'left'
  icon?: ReactNode
  block?: boolean
  /** surface the button sits on — controls the shadow colour */
  surface?: 'dark' | 'light'
  as?: 'button'
  /** sound on press; null = silent (caller plays its own) */
  sfx?: Sfx | null
}

const Arrow = ({ left }: { left?: boolean }) => (
  <svg
    className={`abtn__arrow ${left ? 'is-left' : ''}`}
    viewBox="0 0 6 7"
    width="12"
    height="14"
    shapeRendering="crispEdges"
    aria-hidden="true"
  >
    <path d="M0 0h2v1h1v1h1v1h1v1h-1v1h-1v1h-1v1H0z" fill="currentColor" />
  </svg>
)

/** Tactile brutalist button: notched pixel corners, dithered offset shadow, press-in on click. */
export const ArcadeButton = forwardRef<HTMLButtonElement, Props>(function ArcadeButton(
  { variant = 'lime', size = 'md', arrow = false, icon, block, surface = 'dark', className = '', children, sfx = 'click', onClick, onPointerEnter, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`abtn abtn--${variant} abtn--${size} abtn--on-${surface} ${block ? 'abtn--block' : ''} ${className}`}
      {...rest}
      onClick={(e) => {
        if (sfx) play(sfx)
        onClick?.(e)
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse' && !rest.disabled) play('hover')
        onPointerEnter?.(e)
      }}
    >
      <span className="abtn__face">
        {arrow === 'left' && <Arrow left />}
        {icon}
        <span className="abtn__label">{children}</span>
        {arrow === true && <Arrow />}
      </span>
    </button>
  )
})
