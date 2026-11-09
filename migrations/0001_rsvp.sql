-- WEDDING.EXE — RSVP storage (Cloudflare D1)
-- One row per submission. Names are NOT unique (two guests can share a name);
-- duplicate network retries are collapsed by idempotency_key instead.
CREATE TABLE IF NOT EXISTS rsvp (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  attendance       TEXT NOT NULL CHECK (attendance IN ('yes', 'no')),
  party_size       INTEGER NOT NULL CHECK (
                     (attendance = 'yes' AND party_size BETWEEN 1 AND 10) OR
                     (attendance = 'no'  AND party_size = 0)
                   ),
  lang             TEXT NOT NULL CHECK (lang IN ('en', 'ru')),
  idempotency_key  TEXT NOT NULL UNIQUE,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS rsvp_created_at ON rsvp (created_at);
