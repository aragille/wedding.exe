const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileResult {
  success: boolean
  /** Cloudflare's reason codes, e.g. "invalid-input-secret", "invalid-input-response", "timeout-or-duplicate" */
  codes: string[]
}

/** Server-side Turnstile check. Fails closed on any doubt. */
export async function verifyTurnstile(
  secret: string,
  token: string,
  ip: string | null,
  idempotencyKey: string,
): Promise<TurnstileResult> {
  const form = new FormData()
  form.append('secret', secret.trim())
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  form.append('idempotency_key', idempotencyKey)
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form })
    // Cloudflare answers 400 with a JSON reason (e.g. invalid-input-secret), so read the body either way.
    const data = (await res.json().catch(() => null)) as { success?: boolean; 'error-codes'?: string[] } | null
    const codes = data?.['error-codes']?.length ? data['error-codes'] : res.ok ? [] : [`http-${res.status}`]
    return { success: res.ok && data?.success === true, codes }
  } catch {
    return { success: false, codes: ['network-error'] }
  }
}
