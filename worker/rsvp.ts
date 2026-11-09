import { fail, json, readLimited } from './http'
import { validateRsvp, type RsvpInput } from './validate'
import { verifyTurnstile } from './turnstile'

const MAX_BODY_BYTES = 4 * 1024

interface Row {
  id: string
  name: string
  attendance: 'yes' | 'no'
  party_size: number
  lang: string
}

const samePayload = (row: Row, v: RsvpInput) =>
  row.name === v.name && row.attendance === v.attendance && row.party_size === v.partySize && row.lang === v.lang

/**
 * POST /api/rsvp
 * 200 { ok, id }                      saved (or an identical retry of a saved RSVP)
 * 400 validation | bad_json           with `field` where useful
 * 403 forbidden_origin | verification_failed
 * 405 / 413 / 415                     wrong method / too big / not JSON
 * 409 idempotency_conflict            same key reused for a different answer
 * 429 rate_limited
 * 500 misconfigured | server
 */
export async function handleRsvp(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return fail('method_not_allowed', 405, { allow: 'POST' })

  // Same-origin only: browsers always send Origin on cross-site POSTs.
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) return fail('forbidden_origin', 403)

  const type = request.headers.get('content-type') ?? ''
  if (!type.toLowerCase().startsWith('application/json')) return fail('unsupported_media_type', 415)

  const ip = request.headers.get('cf-connecting-ip')
  if (env.RSVP_LIMITER) {
    const { success } = await env.RSVP_LIMITER.limit({ key: ip ?? 'unknown' })
    if (!success) return fail('rate_limited', 429)
  }

  const text = await readLimited(request, MAX_BODY_BYTES)
  if (text === null) return fail('payload_too_large', 413)

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return fail('bad_json', 400)
  }

  const parsed = validateRsvp(raw)
  if (!parsed.ok) return fail('validation', 400, { field: parsed.field })
  const v = parsed.value

  try {
    // 1) Duplicate network retry? Return the original result without touching anything.
    //    (Checked before Turnstile: a retried token has already been redeemed.)
    const existing = await env.DB.prepare(
      'SELECT id, name, attendance, party_size, lang FROM rsvp WHERE idempotency_key = ?1',
    )
      .bind(v.idempotencyKey)
      .first<Row>()
    if (existing) {
      return samePayload(existing, v) ? json({ ok: true, id: existing.id, duplicate: true }) : fail('idempotency_conflict', 409)
    }

    // 2) Human check.
    if (!env.TURNSTILE_SECRET_KEY) return fail('misconfigured', 500)
    const human = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, v.turnstileToken, ip, v.idempotencyKey)
    if (!human) return fail('verification_failed', 403)

    // 3) Insert. ON CONFLICT covers two identical requests racing each other.
    const id = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO rsvp (id, name, attendance, party_size, lang, idempotency_key)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(idempotency_key) DO NOTHING`,
    )
      .bind(id, v.name, v.attendance, v.partySize, v.lang, v.idempotencyKey)
      .run()

    const saved = await env.DB.prepare(
      'SELECT id, name, attendance, party_size, lang FROM rsvp WHERE idempotency_key = ?1',
    )
      .bind(v.idempotencyKey)
      .first<Row>()
    if (!saved) return fail('server', 500)
    if (!samePayload(saved, v)) return fail('idempotency_conflict', 409)
    return json({ ok: true, id: saved.id })
  } catch (err) {
    console.error('rsvp_error', err instanceof Error ? err.message : String(err))
    return fail('server', 500)
  }
}
