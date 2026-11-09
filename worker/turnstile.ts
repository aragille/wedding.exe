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
    if (!res.ok) return { success: false, codes: [`http-${res.status}`] }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    return { success: data.success === true, codes: data['error-codes'] ?? [] }
  } catch {
    return { success: false, codes: ['network-error'] }
  }
}
