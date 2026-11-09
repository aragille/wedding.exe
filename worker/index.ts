/**
 * WEDDING.EXE — Cloudflare Worker entry.
 * Static assets (the React app) are served by Workers Static Assets;
 * only /api/* reaches this code (`run_worker_first` in wrangler.jsonc).
 *
 * There is deliberately NO public route that lists RSVPs — read them in the
 * Cloudflare dashboard (D1) or with `npm run rsvp:*` (see README).
 */
import { fail, json } from './http'
import { handleRsvp } from './rsvp'

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') return json({ ok: true })
    if (pathname === '/api/rsvp') return handleRsvp(request, env)
    if (pathname.startsWith('/api/')) return fail('not_found', 404)

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
