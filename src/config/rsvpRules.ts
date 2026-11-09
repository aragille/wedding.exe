/**
 * RSVP rules shared by the browser form AND the Worker (no imports — safe in both).
 * The D1 schema (migrations/) mirrors these limits.
 */
export const RSVP_RULES = {
  /** party size includes the respondent */
  minPartySize: 1,
  maxPartySize: 10, // provisional
  nameMax: 80,
  langs: ['en', 'ru'] as const,
} as const
