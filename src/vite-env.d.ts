/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RSVP_MODE?: 'mock' | 'api'
  readonly VITE_TURNSTILE_SITE_KEY?: string
}
