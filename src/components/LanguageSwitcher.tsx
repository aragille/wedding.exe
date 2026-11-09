import { LANGS, useI18n } from '../i18n'
import { play } from '../lib/sound'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="lang-switch" role="group" aria-label={t.common.language}>
      {LANGS.map((l, i) => (
        <span key={l} className="lang-switch__item">
          {i > 0 && <span className="lang-switch__sep" aria-hidden="true">/</span>}
          <button
            type="button"
            className={`lang-switch__btn ${l === lang ? 'is-active' : ''}`}
            aria-pressed={l === lang}
            lang={l}
            onClick={() => {
              if (l !== lang) play('toggle')
              setLang(l)
            }}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
