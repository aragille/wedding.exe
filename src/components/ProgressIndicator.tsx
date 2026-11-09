import { useI18n } from '../i18n'

/** Minimal three-segment progress: LVL 01 ▮▯▯ */
export function ProgressIndicator({ step }: { step: 0 | 1 | 2 }) {
  const { t } = useI18n()
  return (
    <div className="progress" aria-label={`${t.common.progress}: ${step + 1} / 3 — ${t.common.levels[step]}`} role="img">
      <span className="progress__num" aria-hidden="true">
        0{step + 1}
        <small>/03</small>
      </span>
      <span className="progress__bars" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} />
        ))}
      </span>
      <span className="progress__name" aria-hidden="true">
        {t.common.levels[step]}
      </span>
    </div>
  )
}
