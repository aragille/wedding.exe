/** Small JSON response helpers — every API response is JSON and never cached. */
export function json(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extra,
    },
  })
}

export type ApiError =
  | 'method_not_allowed'
  | 'unsupported_media_type'
  | 'payload_too_large'
  | 'bad_json'
  | 'validation'
  | 'forbidden_origin'
  | 'verification_failed'
  | 'idempotency_conflict'
  | 'rate_limited'
  | 'misconfigured'
  | 'server'
  | 'not_found'

export const fail = (error: ApiError, status: number, extra: Record<string, unknown> = {}) =>
  json({ ok: false, error, ...extra }, status)

/** Read a request body as text, refusing anything over `max` bytes (even if Content-Length lies). */
export async function readLimited(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > max) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const buf = new Uint8Array(size)
  let o = 0
  for (const c of chunks) {
    buf.set(c, o)
    o += c.byteLength
  }
  return new TextDecoder().decode(buf)
}
