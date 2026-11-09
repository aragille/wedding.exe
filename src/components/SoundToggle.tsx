import { setSoundOn, useSoundOn } from '../lib/sound'
import { useI18n } from '../i18n'

/** Pixel speaker toggle — sound is off until the guest turns it on. */
export function SoundToggle() {
  const on = useSoundOn()
  const { t } = useI18n()
  return (
    <button
      type="button"
      className={`sound-toggle ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={t.common.sound}
      title={t.common.sound}
      onClick={() => setSoundOn(!on)}
    >
      <svg viewBox="0 0 11 9" width="22" height="18" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M0 3h2V2h1V1h1V0h1v9H4V8H3V7H2V6H0z" fill="currentColor" />
        {on ? (
          <path d="M7 3h1v3H7zM9 1h1v1h1v5h-1v1H9V7h1V2H9z" fill="currentColor" />
        ) : (
          <path d="M6 2h1v1H6zM10 2h1v1h-1zM7 3h1v1H7zM9 3h1v1H9zM8 4h1v1H8zM7 5h1v1H7zM9 5h1v1H9zM6 6h1v1H6zM10 6h1v1h-1z" fill="currentColor" />
        )}
      </svg>
    </button>
  )
}
