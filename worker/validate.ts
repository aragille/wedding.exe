import { RSVP_RULES } from '../src/config/rsvpRules'

export interface RsvpInput {
  name: string
  attendance: 'yes' | 'no'
  partySize: number
  lang: 'en' | 'ru'
  turnstileToken: string
  idempotencyKey: string
}

type Result = { ok: true; value: RsvpInput } | { ok: false; field: string }

const IDEMPOTENCY_RE = /^[A-Za-z0-9-]{16,64}$/
// strip control characters and collapse whitespace
const cleanName = (s: string) =>
  s
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Server-side validation — the browser checks are only a convenience. */
export function validateRsvp(raw: unknown): Result {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, field: 'body' }
  const b = raw as Record<string, unknown>

  if (typeof b.name !== 'string') return { ok: false, field: 'name' }
  const name = cleanName(b.name)
  if (name.length < 1 || [...name].length > RSVP_RULES.nameMax) return { ok: false, field: 'name' }

  if (b.attendance !== 'yes' && b.attendance !== 'no') return { ok: false, field: 'attendance' }
  const attendance = b.attendance

  if (typeof b.partySize !== 'number' || !Number.isInteger(b.partySize)) return { ok: false, field: 'partySize' }
  const partySize = b.partySize
  if (attendance === 'yes' && (partySize < RSVP_RULES.minPartySize || partySize > RSVP_RULES.maxPartySize))
    return { ok: false, field: 'partySize' }
  if (attendance === 'no' && partySize !== 0) return { ok: false, field: 'partySize' }

  if (b.lang !== 'en' && b.lang !== 'ru') return { ok: false, field: 'lang' }
  const lang = b.lang

  if (typeof b.turnstileToken !== 'string' || b.turnstileToken.length < 1 || b.turnstileToken.length > 2048)
    return { ok: false, field: 'turnstileToken' }

  if (typeof b.idempotencyKey !== 'string' || !IDEMPOTENCY_RE.test(b.idempotencyKey))
    return { ok: false, field: 'idempotencyKey' }

  return {
    ok: true,
    value: { name, attendance, partySize, lang, turnstileToken: b.turnstileToken, idempotencyKey: b.idempotencyKey },
  }
}
