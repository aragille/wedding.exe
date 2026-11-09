import { useId, useRef, useState, type FormEvent } from 'react'
import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget'
import { useI18n } from '../i18n'
import { event } from '../config/event'
import { ArcadeButton } from './ArcadeButton'
import { PixelIcon } from './PixelDecoration'
import { PixelWordmark } from './PixelWordmark'
import { play } from '../lib/sound'
import { NAME_MAX, RSVP_MODE, submitRsvp, type Attendance, type RsvpErrorCode } from '../lib/rsvpClient'

export interface RsvpDraft {
  name: string
  attendance: Attendance | null
  partySize: number
  idempotencyKey: string
}

interface Props {
  draft: RsvpDraft
  onChange: (patch: Partial<Omit<RsvpDraft, 'idempotencyKey'>>) => void
  onSuccess: (r: { attendance: Attendance; partySize: number }) => void
}

type FieldErrors = Partial<Record<'name' | 'attendance' | 'party', string>>

export function RSVPForm({ draft, onChange, onSuccess }: Props) {
  const { t, lang } = useI18n()
  const ids = useId()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<RsvpErrorCode | null>(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  const yesRef = useRef<HTMLButtonElement>(null)
  const { maxPartySize: max, minPartySize: min } = event.rsvp

  const validate = (): FieldErrors => {
    const e: FieldErrors = {}
    const name = draft.name.trim()
    if (!name) e.name = t.rsvp.errors.nameRequired
    else if (name.length > NAME_MAX) e.name = t.rsvp.errors.nameTooLong
    if (!draft.attendance) e.attendance = t.rsvp.errors.attendanceRequired
    if (draft.attendance === 'yes' && (draft.partySize < min || draft.partySize > max))
      e.party = t.rsvp.errors.partyRange(max)
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (busy) return
    const e = validate()
    setErrors(e)
    setSubmitError(null)
    if (e.name || e.attendance || e.party) play('error')
    if (e.name) return nameRef.current?.focus()
    if (e.attendance) return yesRef.current?.focus()
    if (e.party) return
    setBusy(true)
    const attendance = draft.attendance!
    const partySize = attendance === 'yes' ? draft.partySize : 0
    let token = 'mock'
    if (RSVP_MODE === 'api') {
      // Cloudflare is asking for a tick → say so now instead of waiting and failing.
      if (turnstile.current?.needsInteraction()) {
        setBusy(false)
        play('error')
        setSubmitError('verification')
        turnstile.current.reveal()
        return
      }
      try {
        token = (await turnstile.current?.getToken()) ?? ''
      } catch {
        token = ''
      }
      if (!token) {
        setBusy(false)
        play('error')
        setSubmitError('verification')
        return
      }
    }
    const res = await submitRsvp({
      name: draft.name.trim(),
      attendance,
      partySize,
      lang,
      turnstileToken: token,
      idempotencyKey: draft.idempotencyKey,
    })
    // Turnstile tokens are single-use — fetch a fresh one for any next attempt.
    turnstile.current?.reset()
    setBusy(false)
    // Only celebrate once the server confirms the save.
    if (res.ok) {
      play(attendance === 'yes' ? 'success' : 'saved')
      onSuccess({ attendance, partySize })
    } else {
      play('error')
      if (res.error === 'validation') setErrors(validate())
      else setSubmitError(res.error)
    }
  }

  const errText = (code: RsvpErrorCode) =>
    code === 'network'
      ? t.rsvp.errors.network
      : code === 'rate_limited'
        ? t.rsvp.errors.rateLimited
        : code === 'verification'
          ? t.rsvp.errors.verification
          : t.rsvp.errors.server

  const setAttendance = (a: Attendance) => {
    if (a !== draft.attendance) play(a === 'yes' ? 'select' : 'deselect')
    onChange({ attendance: a })
    setErrors((e) => ({ ...e, attendance: undefined }))
  }

  return (
    <form className="rsvp-form" onSubmit={submit} noValidate aria-busy={busy}>
      {/* NAME */}
      <div className={`field ${errors.name ? 'has-error' : ''}`}>
        <label className="field__label" htmlFor={`${ids}-name`}>
          <span className="field__num">01</span> {t.rsvp.nameLabel}
        </label>
        <div className="field__input-wrap">
          <span className="field__prompt" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={nameRef}
            id={`${ids}-name`}
            className="field__input"
            type="text"
            name="name"
            autoComplete="name"
            maxLength={NAME_MAX + 20}
            placeholder={t.rsvp.namePlaceholder}
            value={draft.name}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${ids}-name-err` : undefined}
            onChange={(e) => {
              onChange({ name: e.target.value })
              if (errors.name) setErrors((x) => ({ ...x, name: undefined }))
            }}
          />
        </div>
        {errors.name && (
          <p className="field__error" id={`${ids}-name-err`} role="alert">
            <PixelIcon name="cross" size={10} palette={{ a: '#FF4D16' }} /> {errors.name}
          </p>
        )}
      </div>

      {/* ATTENDANCE */}
      <fieldset className={`field ${errors.attendance ? 'has-error' : ''}`} aria-describedby={errors.attendance ? `${ids}-att-err` : undefined}>
        <legend className="field__label">
          <span className="field__num">02</span> {t.rsvp.attendanceLabel}
        </legend>
        <div className="choice-grid" role="radiogroup" aria-label={t.rsvp.attendanceLabel}>
          <button
            ref={yesRef}
            type="button"
            role="radio"
            aria-checked={draft.attendance === 'yes'}
            className={`choice choice--yes ${draft.attendance === 'yes' ? 'is-on' : ''}`}
            onClick={() => setAttendance('yes')}
          >
            <PixelIcon name="heart" size={34} depth={2} depthColor="#0B0B0D" palette={{ a: draft.attendance === 'yes' ? '#0B0B0D' : '#C4FF3B', A: draft.attendance === 'yes' ? '#0B0B0D' : '#7FB300', h: '#F1F0EB' }} />
            <span>{t.rsvp.yes}</span>
            <i className="choice__check" aria-hidden="true" />
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={draft.attendance === 'no'}
            className={`choice choice--no ${draft.attendance === 'no' ? 'is-on' : ''}`}
            onClick={() => setAttendance('no')}
          >
            <PixelIcon name="brokenHeart" size={34} depth={2} depthColor="#0B0B0D" palette={draft.attendance === 'no' ? { a: '#0B0B0D', A: '#0B0B0D' } : undefined} />
            <span>{t.rsvp.no}</span>
            <i className="choice__check" aria-hidden="true" />
          </button>
        </div>
        {errors.attendance && (
          <p className="field__error" id={`${ids}-att-err`} role="alert">
            <PixelIcon name="cross" size={10} palette={{ a: '#FF4D16' }} /> {errors.attendance}
          </p>
        )}
      </fieldset>

      {/* PARTY SIZE — only when attending */}
      {draft.attendance === 'yes' && (
        <div className={`field field--party ${errors.party ? 'has-error' : ''}`}>
          <div className="field__label" id={`${ids}-party-label`}>
            <span className="field__num">03</span> {t.rsvp.partyLabel}
            <small>{t.rsvp.partyHint}</small>
          </div>
          <div className="stepper" role="group" aria-labelledby={`${ids}-party-label`}>
            <button
              type="button"
              className="stepper__btn"
              aria-label={t.rsvp.decrease}
              disabled={draft.partySize <= min}
              onClick={() => {
                play('down')
                onChange({ partySize: Math.max(min, draft.partySize - 1) })
              }}
            >
              <svg viewBox="0 0 5 1" width="20" height="4" shapeRendering="crispEdges" aria-hidden="true">
                <rect width="5" height="1" fill="currentColor" />
              </svg>
            </button>
            <output className="stepper__value" aria-live="polite" aria-label={t.rsvp.partyValue(draft.partySize)}>
              <PixelWordmark
                text={String(draft.partySize).padStart(2, '0')}
                palette="lime"
                depth={4}
                dither={false}
                shine={false}
                animate={false}
                className="stepper__digits"
              />
            </output>
            <button
              type="button"
              className="stepper__btn"
              aria-label={t.rsvp.increase}
              disabled={draft.partySize >= max}
              onClick={() => {
                play('up')
                onChange({ partySize: Math.min(max, draft.partySize + 1) })
              }}
            >
              <svg viewBox="0 0 5 5" width="20" height="20" shapeRendering="crispEdges" aria-hidden="true">
                <path d="M2 0h1v2h2v1H3v2H2V3H0V2h2z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <div className="party-pips" aria-hidden="true">
            {Array.from({ length: max }, (_, i) => (
              <i key={i} className={i < draft.partySize ? 'is-on' : ''} />
            ))}
          </div>
          {errors.party && (
            <p className="field__error" role="alert">
              {errors.party}
            </p>
          )}
        </div>
      )}

      {submitError && (
        <div className="submit-error" role="alert">
          <PixelIcon name="cross" size={14} palette={{ a: '#0B0B0D' }} />
          <span>{errText(submitError)}</span>
        </div>
      )}

      {RSVP_MODE === 'api' && <TurnstileWidget ref={turnstile} lang={lang} />}

      <ArcadeButton type="submit" size="xl" arrow block disabled={busy} className={busy ? 'is-busy' : ''}>
        {busy ? t.rsvp.submitting : t.rsvp.submit}
      </ArcadeButton>

      {RSVP_MODE === 'mock' && <p className="mock-note">{t.rsvp.mockNotice}</p>}
    </form>
  )
}
