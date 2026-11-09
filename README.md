# WEDDING.EXE

Interactive wedding invitation for Ilia & Anna — 17.04.2027, Nreni Restaurant.
React + Vite + TypeScript on a Cloudflare Worker (static assets + `/api/rsvp`), RSVPs in Cloudflare D1, spam protection by Turnstile.

Guest links: `https://<your-domain>/?lang=en` · `https://<your-domain>/?lang=ru`

## Develop
```bash
npm install
cp .dev.vars.example .dev.vars   # Turnstile test secret for local dev
npm run db:migrate:local         # create the local RSVP table (once)
npm run dev                      # http://localhost:5173 — site + API + local D1
```
Locally the form uses Cloudflare's Turnstile **test** keys, so submissions always pass verification and are saved to a local database in `.wrangler/`.

## Deploy (GitHub → Cloudflare Workers Builds)

**1. Turnstile (spam protection)** — Cloudflare dashboard → **Turnstile → Add widget**
- Hostnames: your wedding domain and `wedding-exe.<account>.workers.dev`
- Widget mode: **Managed**
- Paste the **site key** into `.env.production` (`VITE_TURNSTILE_SITE_KEY=…`) and commit it (it is public).
- Keep the **secret key** for step 3.

**2. Connect the repo** — **Workers & Pages → Create → Import a repository** → pick the repo
- Project name: `wedding-exe` (must match `wrangler.jsonc`)
- Build command: `npm run build`
- Deploy command: `npm run deploy:ci`  ← deploys, then applies database migrations

The first deploy **creates the D1 database `wedding-exe-rsvp` automatically** (no ID to copy).

**3. Add the Turnstile secret** — Worker → **Settings → Variables and Secrets → Add** → type *Secret*, name `TURNSTILE_SECRET_KEY`, value = secret key. Then redeploy (or push any commit).
Without it the API refuses every RSVP (`misconfigured`), by design.

**4. Custom domain (optional)** — Worker → **Settings → Domains & Routes → Add → Custom domain**. Add the domain to the Turnstile widget hostnames too.

**5. Smoke test** — submit one RSVP on the live site, then `npm run rsvp:list`, then delete the test row (below).

## RSVPs

There is no public page that lists guests. Read responses in either place:

**Dashboard:** Storage & Databases → **D1 → wedding-exe-rsvp** → table `rsvp` (browse, or run SQL in *Console*).

**Terminal** (run `npx wrangler login` once):
```bash
npm run rsvp:list     # all responses, newest first
npm run rsvp:stats    # responses / accepted / declined / people attending
npm run rsvp:csv      # writes rsvps-YYYY-MM-DD.csv (opens in Excel/Numbers/Sheets, Cyrillic-safe)
```
Add `-- --local` to any of them to read the local dev database.

Fix a mistake (e.g. a guest submitted twice — names aren't unique, so check the time):
```bash
npx wrangler d1 execute wedding-exe-rsvp --remote --command "DELETE FROM rsvp WHERE id = '<id>'"
```

### How submissions are protected
- Server-side validation (name 1–80 chars, yes = 1–10 people incl. the guest, no = 0), 4 KB body limit, JSON only, same-origin only
- Turnstile verified on the server for every new submission
- 10 attempts / minute / IP rate limit
- Each answer carries an idempotency key: network retries never create duplicates; a guest changing their answer creates a new row
- Stored: name, attendance, party size, language, timestamp. No IP addresses, emails or cookies.

## Structure
- `src/screens/` — Start (title + mini-game), Invitation, RSVP
- `src/game/` — grid logic, reducer, input, board
- `src/components/` — `PixelAsset`, `PixelWordmark`, `ArcadeButton`, `TurnstileWidget`, pixel graphics
- `src/config/` — `event.ts` (wedding facts; `null` = hidden), `rsvpRules.ts` (shared with the API), `characterAssets.ts`, `designTokens.ts`
- `src/i18n/` — `en.ts`, `ru.ts` · `src/lib/sound.ts` — chiptune SFX (muted by default)
- `worker/` — API (`rsvp.ts`, `validate.ts`, `turnstile.ts`)
- `migrations/` — D1 schema · `scripts/rsvp.mjs` — RSVP tools

## Wedding details
Edit `src/config/event.ts`. Start time, address, city, map link, dress code and RSVP deadline stay hidden until filled in.

## Character images
See [ASSETS.md](ASSETS.md).
