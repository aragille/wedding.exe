const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Server-side Turnstile check. Returns false on any doubt (fail closed). */
export async function verifyTurnstile(secret: string, token: string, ip: string | null, idempotencyKey: string) {
  const form = new FormData()
  form.append('secret', secret)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  form.append('idempotency_key', idempotencyKey)
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body: form })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
