import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Lang } from '../i18n'

/**
 * Cloudflare Turnstile (spam protection), "interaction-only": invisible for almost
 * every guest; a small challenge appears only if Cloudflare is unsure.
 *
 * Site key: VITE_TURNSTILE_SITE_KEY (.env.production). In development we fall back
 * to Cloudflare's public TEST key, which always passes.
 */
const TEST_SITE_KEY = '1x00000000000000000000AA'
export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? TEST_SITE_KEY : '')

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile_missing')))
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('turnstile_load_failed'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

export interface TurnstileHandle {
  /** Resolves with a fresh token (waits for the widget), rejects after `timeoutMs`. */
  getToken: (timeoutMs?: number) => Promise<string>
  /** Tokens are single-use: call after every submit attempt. */
  reset: () => void
}

export const TurnstileWidget = forwardRef<TurnstileHandle, { lang: Lang }>(function TurnstileWidget({ lang }, ref) {
  const el = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const token = useRef<string | null>(null)
  const waiters = useRef<Array<(t: string) => void>>([])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      console.error('VITE_TURNSTILE_SITE_KEY is not set — RSVP submissions will be rejected.')
      return
    }
    let cancelled = false
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !el.current || widgetId.current) return
        widgetId.current = ts.render(el.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          appearance: 'interaction-only',
          size: 'flexible',
          language: lang,
          action: 'rsvp',
          'refresh-expired': 'auto',
          callback: (t: string) => {
            token.current = t
            waiters.current.splice(0).forEach((w) => w(t))
          },
          'expired-callback': () => {
            token.current = null
          },
          'error-callback': () => {
            token.current = null
            return true // let Turnstile retry on its own
          },
        })
      })
      .catch(() => {
        /* network blocked — submit will report a verification error */
      })
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
    // the widget is created once; language only affects the rare visible challenge
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    getToken: (timeoutMs = 15000) =>
      new Promise<string>((resolve, reject) => {
        if (token.current) return resolve(token.current)
        const timer = window.setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== done)
          reject(new Error('turnstile_timeout'))
        }, timeoutMs)
        const done = (t: string) => {
          window.clearTimeout(timer)
          resolve(t)
        }
        waiters.current.push(done)
      }),
    reset: () => {
      token.current = null
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    },
  }))

  return <div ref={el} className="turnstile" />
})
