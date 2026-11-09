import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../i18n'
import { RSVPForm, type RsvpDraft } from '../components/RSVPForm'
import { PixelAsset } from '../components/PixelAsset'
import { PixelIcon, StickerField, type StickerSpec } from '../components/PixelDecoration'
import { PixelConfetti } from '../components/PixelParticles'
import type { Attendance } from '../lib/rsvpClient'

export interface RsvpOutcome {
  attendance: Attendance
  partySize: number
}

interface Props {
  draft: RsvpDraft
  outcome: RsvpOutcome | null
  onDraftChange: (patch: Partial<Omit<RsvpDraft, 'idempotencyKey'>>) => void
  onSuccess: (o: RsvpOutcome) => void
  onAnother: () => void
}

const STICKERS: StickerSpec[] = [
  { name: 'sparkle', x: 6, y: 14, size: 18, float: true },
  { name: 'heartSmall', x: 40, y: 8, size: 16, float: true, hideOnMobile: true },
  { name: 'plus', x: 4, y: 88, size: 14, palette: { a: '#C4FF3B' } },
  { name: 'cross', x: 46, y: 70, size: 12, hideOnMobile: true },
  { name: 'checker', x: 92, y: 4, size: 40, palette: { a: '#3156FF' }, hideOnMobile: true },
]

export function RSVPScreen({ draft, outcome, onDraftChange, onSuccess, onAnother }: Props) {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const resultRef = useRef<HTMLDivElement>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!outcome) return
    panelRef.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
    resultRef.current?.focus({ preventScroll: true })
  }, [outcome, reduced])

  const swap = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 24, clipPath: 'inset(0 0 100% 0)' },
        animate: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' },
        exit: { opacity: 0, y: -12 },
      }

  return (
    <section className="screen rsvp" aria-labelledby="rsvp-title">
      <div className="rsvp__grid" aria-hidden="true" />
      <StickerField items={STICKERS} />

      <div className="rsvp__inner">
        <header className="rsvp__head">
          <h1 id="rsvp-title" className="rsvp__title layered-text layered-text--lime" data-text={t.rsvp.title}>
            {t.rsvp.title}
          </h1>
          <p className="rsvp__sub">{t.rsvp.subtitle}</p>
          <div className="rsvp__deco" aria-hidden="true">
            <PixelIcon name="computer" size={56} depth={2} depthColor="#3156FF" />
            <span className="rsvp__deco-line" />
            <PixelIcon name="ring" size={30} depth={2} depthColor="#1B2FA8" />
          </div>
        </header>

        <div className="rsvp__panel" ref={panelRef}>
          <AnimatePresence mode="wait" initial={false}>
            {!outcome ? (
              <motion.div key="form" {...swap} transition={{ duration: 0.3 }}>
                <RSVPForm draft={draft} onChange={onDraftChange} onSuccess={onSuccess} />
              </motion.div>
            ) : outcome.attendance === 'yes' ? (
              <motion.div
                key="yes"
                ref={resultRef}
                tabIndex={-1}
                className="result result--yes"
                role="status"
                {...swap}
                transition={{ duration: 0.4 }}
              >
                <PixelConfetti count={64} seed={11} />
                <h2 className="result__title layered-text layered-text--lime" data-text={t.rsvp.yesHeadline}>
                  {t.rsvp.yesHeadline}
                </h2>
                <div className="result__art">
                  <PixelAsset asset="couple.celebration" size="100%" decorative />
                </div>
                <p className="result__copy">{t.rsvp.yesCopy}</p>
                <div className="result__actions">
                  <button type="button" className="text-btn" onClick={onAnother}>
                    [ {t.rsvp.another} ]
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no"
                ref={resultRef}
                tabIndex={-1}
                className="result result--no"
                role="status"
                {...swap}
                transition={{ duration: 0.4 }}
              >
                <div className="result__quiet-heart" aria-hidden="true">
                  <PixelIcon name="heart" size={72} depth={3} depthColor="#1B2FA8" palette={{ a: '#B8AEFF', A: '#7A6CE0' }} />
                </div>
                <p className="result__copy result__copy--big">{t.rsvp.noCopy}</p>
                <div className="result__actions">
                  <button type="button" className="text-btn" onClick={onAnother}>
                    [ {t.rsvp.another} ]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
