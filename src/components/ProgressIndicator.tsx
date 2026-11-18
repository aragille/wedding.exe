import { useI18n } from '../i18n'

/** Minimal segmented progress: 01/04 ▮▯▯▯ */
export function ProgressIndicator({ step }: { step: number }) {
  const { t } = useI18n()
  const total = t.common.levels.length
  return (
    <div
      className="progress"
      aria-label={`${t.common.progress}: ${step + 1} / ${total} — ${t.common.levels[step]}`}
      role="img"
    >
      <span className="progress__num" aria-hidden="true">
        0{step + 1}
        <small>/0{total}</small>
      </span>
      <span className="progress__bars" aria-hidden="true">
        {t.common.levels.map((_, i) => (
          <i key={i} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} />
        ))}
      </span>
      <span className="progress__name" aria-hidden="true">
        {t.common.levels[step]}
      </span>
    </div>
  )
}
