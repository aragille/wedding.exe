import type { Lang } from '../i18n'

/**
 * RSVP client — the single place the UI talks to the backend.
 * Default: real API (POST /api/rsvp → Worker → D1).
 * VITE_RSVP_MODE=mock switches to a fake client (type the name "FAIL" to rehearse errors).
 */
export type Attendance = 'yes' | 'no'

export interface RsvpPayload {
  name: string
  attendance: Attendance
  /** includes the respondent; 0 when declining */
  partySize: number
  lang: Lang
  turnstileToken: string
  idempotencyKey: string
}

export type RsvpErrorCode = 'network' | 'server' | 'validation' | 'rate_limited' | 'verification'
export type RsvpResult = { ok: true; id: string } | { ok: false; error: RsvpErrorCode; field?: string }

export const RSVP_MODE: 'mock' | 'api' = import.meta.env.VITE_RSVP_MODE === 'mock' ? 'mock' : 'api'
export { RSVP_RULES } from '../config/rsvpRules'
import { RSVP_RULES } from '../config/rsvpRules'
export const NAME_MAX = RSVP_RULES.nameMax

const TIMEOUT_MS = 15000
const RETRIES = 2 // automatic retries for pure network failures (same idempotency key → no duplicates)

export async function submitRsvp(payload: RsvpPayload): Promise<RsvpResult> {
  if (RSVP_MODE === 'mock') return mockSubmit(payload)

  for (let attempt = 0; ; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      const body = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string; field?: string } | null
      if (res.ok && body?.ok && body.id) return { ok: true, id: body.id }
      if (res.status === 429) return { ok: false, error: 'rate_limited' }
      if (res.status === 403 && body?.error === 'verification_failed') {
        console.warn('RSVP verification rejected:', (body as { codes?: string[] }).codes)
        return { ok: false, error: 'verification' }
      }
      if (res.status === 400) return { ok: false, error: 'validation', field: body?.field }
      return { ok: false, error: 'server' }
    } catch {
      clearTimeout(timer)
      // The request may or may not have reached the server — retrying with the
      // same idempotency key is safe: the server returns the original result.
      if (attempt >= RETRIES) return { ok: false, error: 'network' }
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
    }
  }
}

async function mockSubmit(p: RsvpPayload): Promise<RsvpResult> {
  await new Promise((r) => setTimeout(r, 650 + Math.random() * 400))
  if (p.name.trim().toUpperCase() === 'FAIL') return { ok: false, error: 'network' }
  return { ok: true, id: `mock_${p.idempotencyKey.slice(0, 8)}` }
}
