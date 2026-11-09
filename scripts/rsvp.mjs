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

function query(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB, where, '--json', '--config', 'wrangler.jsonc', '--command', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  )
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
            SUM(attendance = 'yes') AS accepted,
            SUM(attendance = 'no') AS declined,
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
