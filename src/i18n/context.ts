import { createContext } from 'react'
import type { Dict } from './en'

export type Lang = 'en' | 'ru'

export interface I18nValue {
  lang: Lang
  t: Dict
  setLang: (l: Lang) => void
}

/** Kept in its own module so editing a dictionary (HMR) never re-creates the context. */
export const I18nContext = createContext<I18nValue | null>(null)
