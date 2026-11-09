#!/usr/bin/env node
/**
 * RSVP tools (read-only) — talks to D1 through Wrangler.
 *
 *   npm run rsvp:list            all responses, newest first
 *   npm run rsvp:stats           totals: yes / no / people attending
 *   npm run rsvp:csv             write rsvps-YYYY-MM-DD.csv
 *
 * Add `-- --local` to read the local dev database instead of production.
 * Production access requires `npx wrangler login` once.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const DB = 'wedding-exe-rsvp'
const args = process.argv.slice(2)
const cmd = args[0] ?? 'list'
const where = args.includes('--local') ? '--local' : '--remote'

/** Turn Wrangler's error into one actionable line instead of a stack trace. */
function explain(text) {
  const t = text.toLowerCase()
  if (t.includes('cloudflare_api_token') || t.includes('not authenticated') || t.includes('wrangler login'))
    return 'Not logged in to Cloudflare. Run this once, then try again:\n\n  npx wrangler login\n'
  if (t.includes("couldn't find") || t.includes('not found') || t.includes('could not find'))
    return `The production database "${DB}" doesn't exist yet. It is created by the first deploy (see README → Deploy).\nTo read your local test database instead:  npm run rsvp:${cmd} -- --local\n`
  if (t.includes('no such table'))
    return where === '--local'
      ? 'The local RSVP table is missing. Run:  npm run db:migrate:local\n'
      : 'The RSVP table is missing in production. Run:  npm run db:migrate\n'
  return `Wrangler error: ${text.trim()}\n`
}

function query(sql) {
  let out
  try {
    out = execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', DB, where, '--json', '--config', 'wrangler.jsonc', '--command', sql],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (err) {
    const raw = `${err.stdout ?? ''}${err.stderr ?? ''}`
    let text = raw
    try {
      text = JSON.parse(raw.slice(raw.indexOf('{'))).error?.text ?? raw
    } catch {
      /* not JSON — use raw output */
    }
    process.stderr.write(`\n${explain(text)}`)
    process.exit(1)
  }
  const parsed = JSON.parse(out.slice(out.indexOf('[')))
  return parsed[0]?.results ?? []
}

const SQL_ALL =
  'SELECT created_at, name, attendance, party_size, lang, id FROM rsvp ORDER BY created_at DESC'

if (cmd === 'list') {
  const rows = query(SQL_ALL)
  console.table(rows.map((r) => ({ when: r.created_at.slice(0, 16).replace('T', ' '), name: r.name, coming: r.attendance, people: r.party_size, lang: r.lang })))
  console.log(`${rows.length} response(s) · source: ${where.slice(2)}`)
} else if (cmd === 'stats') {
  const [s] = query(
    `SELECT COUNT(*) AS responses,
            COALESCE(SUM(attendance = 'yes'), 0) AS accepted,
            COALESCE(SUM(attendance = 'no'), 0) AS declined,
            COALESCE(SUM(party_size), 0) AS people_attending
       FROM rsvp`,
  )
  console.table([s])
} else if (cmd === 'csv') {
  const rows = query(SQL_ALL)
  // Prevent spreadsheet formula injection: names are typed by guests.
  const cell = (v) => {
    let s = String(v ?? '')
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return `"${s.replace(/"/g, '""')}"`
  }
  const header = ['submitted_at', 'name', 'attendance', 'party_size', 'language', 'id']
  const lines = [header.join(','), ...rows.map((r) => [r.created_at, r.name, r.attendance, r.party_size, r.lang, r.id].map(cell).join(','))]
  const file = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`
  writeFileSync(file, '﻿' + lines.join('\r\n') + '\r\n') // BOM so Excel reads Cyrillic correctly
  console.log(`Wrote ${rows.length} row(s) to ${file}`)
} else {
  console.error(`Unknown command "${cmd}". Use: list | stats | csv  [--local]`)
  process.exit(1)
}
