import { motion, useReducedMotion } from 'motion/react'
import { dictionaries, formatLongDate, LANGS, useI18n } from '../i18n'
import { event } from '../config/event'
import { PixelAsset } from '../components/PixelAsset'
import { PixelWordmark } from '../components/PixelWordmark'
import { ArcadeButton } from '../components/ArcadeButton'
import { PixelIcon, StickerField, type StickerSpec } from '../components/PixelDecoration'

interface Props {
  onJoin: () => void
}

const STICKERS: StickerSpec[] = [
  { name: 'sparkle', x: 46, y: 6, size: 22, palette: { a: '#7A6CE0', h: '#0B0B0D' }, float: true },
  { name: 'plus', x: 3, y: 48, size: 16, palette: { a: '#FF4D16' }, hideOnMobile: true },
  { name: 'cross', x: 58, y: 92, size: 14, palette: { a: '#3156FF' } },
  { name: 'blob', x: 94, y: 90, size: 46, hideOnMobile: true },
]

export function InvitationScreen({ onJoin }: Props) {
  const { t, lang } = useI18n()
  const reduced = useReducedMotion()
  const a = event.couple.partnerA[lang].toUpperCase()
  const b = event.couple.partnerB[lang].toUpperCase()
  const [, mm, dd] = event.date.split('-')
  const yy = event.date.slice(2, 4)

  const rise = (i: number) =>
    reduced
      ? {}
      : {
          initial: { y: 40, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
          animate: { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)' },
          transition: { delay: 0.25 + i * 0.08, duration: 0.42, ease: [0.2, 0.9, 0.2, 1] as const },
        }

  const details: Array<{ k: string; v: string }> = [
    { k: t.invite.dateLabel, v: formatLongDate(event.date, lang) },
    { k: t.invite.venueLabel, v: event.venue.name[lang].toUpperCase() },
  ]
  if (event.startTime) details.push({ k: t.invite.timeLabel, v: event.startTime })
  if (event.venue.address) details.push({ k: t.invite.addressLabel, v: event.venue.address[lang] })
  if (event.venue.city) details.push({ k: '', v: event.venue.city[lang] })
  if (event.dressCode) details.push({ k: t.invite.dressLabel, v: event.dressCode[lang] })
  if (event.rsvpDeadline) details.push({ k: t.invite.deadlineLabel, v: formatLongDate(event.rsvpDeadline, lang) })

  return (
    <section className="screen invite" aria-labelledby="invite-title">
      <div className="invite__grid" aria-hidden="true" />
      <StickerField items={STICKERS} />

      <div className="invite__inner">
        <h1 id="invite-title" className="invite__headline">
          <motion.span className="hl hl--a" {...rise(0)}>
            {a}
          </motion.span>
          <motion.span className="hl hl--amp" {...rise(1)}>
            <span>{t.invite.and}</span>
          </motion.span>
          <motion.span className="hl hl--b" {...rise(2)}>
            {b}
          </motion.span>
          <motion.span className="hl hl--married" {...rise(3)}>
            <span>{t.invite.married}</span>
          </motion.span>
        </h1>

        <motion.figure
          className="invite__hero"
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, x: 30 },
                animate: { opacity: 1, x: 0 },
                transition: { delay: 0.2, duration: 0.5, ease: [0.2, 0.9, 0.2, 1] },
              })}
        >
          <div className="invite__hero-block" aria-hidden="true" />
          <div className="invite__hero-checker" aria-hidden="true" />
          <div className="invite__hero-art">
            <PixelAsset asset="couple.hero" size="100%" alt={`${a} & ${b}`} />
          </div>
          <span className="invite__sticker invite__sticker--ring" aria-hidden="true">
            <PixelIcon name="ring" size={40} depth={2} />
          </span>
        </motion.figure>

        <div className="invite__date" aria-hidden="true">
          <PixelWordmark text={`${dd}.${mm}.${yy}`} palette="orange" cell={4} depth={5} className="invite__date-mark" />
        </div>

        <dl className="invite__details">
          {details.map((d, i) => (
            <div key={i} className="invite__row">
              <dt>{d.k}</dt>
              <dd>{d.v}</dd>
            </div>
          ))}
        </dl>

        <div className="invite__closing">
          {/* every translation sits in the same cell; only the active one is visible, so the
              block is as tall as the longest language and switching never shifts the layout */}
          <p className="invite__copy">
            {LANGS.map((l) => (
              <span key={l} className={l === lang ? undefined : 'invite__copy-ghost'} aria-hidden={l === lang ? undefined : true}>
                {dictionaries[l].invite.copy}
              </span>
            ))}
          </p>
          <div className="invite__actions">
            <ArcadeButton size="lg" arrow surface="light" onClick={onJoin}>
              {t.invite.cta}
            </ArcadeButton>
            {event.venue.mapUrl && (
              <a className="text-btn text-btn--ink" href={event.venue.mapUrl} target="_blank" rel="noreferrer">
                [ {t.invite.map} &gt; ]
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
