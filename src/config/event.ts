import type { Lang } from '../i18n'
import { RSVP_RULES } from './rsvpRules'

/**
 * Centralised wedding facts. Anything set to `null` is UNKNOWN and is hidden in the UI
 * until provided — never invent a start time, address, city, dress code or deadline.
 */
type Localized = Record<Lang, string>

export interface EventConfig {
  /** display order everywhere: partnerA & partnerB */
  couple: { partnerA: Localized; partnerB: Localized }
  /** ISO date (local wedding date, no time zone semantics) */
  date: string
  venue: {
    name: Localized
    address: Localized | null
    city: Localized | null
    /** Only shown as a button when present */
    mapUrl: string | null
  }
  startTime: string | null // e.g. '16:00'
  dressCode: Localized | null
  rsvpDeadline: string | null // ISO date
  rsvp: {
    /** Party size includes the respondent */
    maxPartySize: number
    minPartySize: number
  }
}

export const event: EventConfig = {
  couple: {
    partnerA: { en: 'Ilia', ru: 'Илья' },
    partnerB: { en: 'Anna', ru: 'Анна' },
  },
  date: '2027-04-17',
  venue: {
    name: { en: 'Nreni Restaurant', ru: 'Ресторан Nreni' },
    address: null,
    city: null,
    mapUrl: null,
  },
  startTime: null,
  dressCode: null,
  rsvpDeadline: null,
  rsvp: {
    maxPartySize: RSVP_RULES.maxPartySize,
    minPartySize: RSVP_RULES.minPartySize,
  },
}
