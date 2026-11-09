import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type Dict } from './en'
import { ru } from './ru'
import { I18nContext, type Lang } from './context'

export type { Lang }
export const LANGS: Lang[] = ['en', 'ru']
export const dictionaries: Record<Lang, Dict> = { en, ru }

function readLangFromUrl(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'ru' || q === 'en') return q
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLangFromUrl)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    // Keep the public link shape (/?lang=xx) and preserve history state (current screen).
    const url = new URL(window.location.href)
    url.searchParams.set('lang', l)
    window.history.replaceState(window.history.state, '', url)
  }, [])

  useEffect(() => {
    const t = dictionaries[lang]
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [lang])

  const value = useMemo(() => ({ lang, t: dictionaries[lang], setLang }), [lang, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** "17 APRIL 2027" / "17 АПРЕЛЯ 2027" */
export function formatLongDate(iso: string, lang: Lang) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const s = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  return s.replace(/\s?г\.?$/, '').toUpperCase()
}
