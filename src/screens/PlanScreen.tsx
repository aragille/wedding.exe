import { motion, useReducedMotion } from 'motion/react'
import { formatLongDate, useI18n } from '../i18n'
import { event } from '../config/event'
import type { AssetKey } from '../config/characterAssets'
import { PixelAsset } from '../components/PixelAsset'
import { PixelWordmark } from '../components/PixelWordmark'
import { ArcadeButton } from '../components/ArcadeButton'
import { StickerField, type StickerSpec } from '../components/PixelDecoration'

interface Props {
  onJoin: () => void
}

type ProgramItem = (typeof event.program)[number]

const ART: Record<ProgramItem, AssetKey> = {
  dinner: 'object.olives',
  drinks: 'object.cocktail',
  games: 'object.gamepad',
  dancing: 'object.discoBall',
}

/** extra party objects on the shelf next to the start time */
const SHELF: AssetKey[] = ['object.music', 'object.mic', 'object.champagne']

const STICKERS: StickerSpec[] = [
  { name: 'sparkle', x: 58, y: 5, size: 20, palette: { a: '#7A6CE0', h: '#0B0B0D' }, float: true },
  { name: 'plus', x: 2, y: 62, size: 14, palette: { a: '#FF4D16' }, hideOnMobile: true },
  { name: 'cross', x: 96, y: 96, size: 14, palette: { a: '#3156FF' } },
]

export function PlanScreen({ onJoin }: Props) {
  const { t, lang } = useI18n()
  const reduced = useReducedMotion()

  const facts: Array<{ k: string; v: string }> = [{ k: t.plan.dateLabel, v: formatLongDate(event.date, lang) }]
  if (event.startTime) facts.push({ k: t.plan.timeLabel, v: event.startTime })
  facts.push({ k: t.plan.venueLabel, v: event.venue.name[lang].toUpperCase() })
  if (event.venue.address) facts.push({ k: t.plan.addressLabel, v: event.venue.address[lang] })
  if (event.venue.city) facts.push({ k: '', v: event.venue.city[lang] })
  if (event.dressCode) facts.push({ k: t.plan.dressLabel, v: event.dressCode[lang] })
  if (event.rsvpDeadline) facts.push({ k: t.plan.deadlineLabel, v: formatLongDate(event.rsvpDeadline, lang) })

  const rise = (i: number) =>
    reduced
      ? {}
      : {
          initial: { y: 28, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.2, 0.9, 0.2, 1] as const },
        }

  return (
    <section className="screen plan" aria-labelledby="plan-title">
      <div className="paper-grid" aria-hidden="true" />
      <StickerField items={STICKERS} />

      <div className="plan__inner">
        <header className="plan__head">
          <h1 id="plan-title" className="plan__title">
            {t.plan.title}
          </h1>
          <div className="plan__shelf" aria-hidden="true">
            {event.startTime && (
              <PixelWordmark text={event.startTime} palette="orange" cell={4} depth={5} className="plan__time-mark" />
            )}
            {SHELF.map((asset) => (
              <div key={asset} className="plan__float">
                <PixelAsset asset={asset} size="100%" decorative />
              </div>
            ))}
          </div>
        </header>

        <dl className="facts plan__facts">
          {facts.map((d, i) => (
            <div key={i} className="facts__row">
              <dt>{d.k}</dt>
              <dd>{d.v}</dd>
            </div>
          ))}
        </dl>

        <ol className="plan__list">
          {event.program.map((item, i) => (
            <motion.li key={item} className="plan__item" {...rise(i)}>
              <div className="plan__art">
                <PixelAsset asset={ART[item]} size="100%" decorative />
              </div>
              <span className="plan__label">{t.plan.items[item]}</span>
            </motion.li>
          ))}
        </ol>

        <div className="plan__actions">
          <ArcadeButton size="lg" arrow surface="light" onClick={onJoin}>
            {t.plan.cta}
          </ArcadeButton>
          {event.venue.mapUrl && (
            <a className="text-btn text-btn--ink" href={event.venue.mapUrl} target="_blank" rel="noreferrer">
              [ {t.plan.map} &gt; ]
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
