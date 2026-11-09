import { useEffect, useRef, type Dispatch } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../i18n'
import { PixelWordmark } from '../components/PixelWordmark'
import { PixelAsset } from '../components/PixelAsset'
import { ArcadeButton } from '../components/ArcadeButton'
import { GameHUD } from '../components/GameHUD'
import { PixelParticles } from '../components/PixelParticles'
import { StickerField, type StickerSpec } from '../components/PixelDecoration'
import { GameBoard } from '../game/GameBoard'
import type { GameAction, GameState } from '../game/GameState'
import type { AssetKey } from '../config/characterAssets'
import { play } from '../lib/sound'
import { event } from '../config/event'

export type StartPhase = 'title' | 'game'

interface Props {
  phase: StartPhase
  game: GameState
  dispatchGame: Dispatch<GameAction>
  onPressStart: () => void
  onSkip: () => void
  onGameComplete: () => void
}

const STICKERS: StickerSpec[] = [
  { name: 'sparkle', x: 8, y: 22, size: 22, float: true },
  { name: 'heart', x: 88, y: 18, size: 30, depth: 2, depthColor: '#1B2FA8', rotate: 8, float: true },
  { name: 'cross', x: 18, y: 78, size: 14, rotate: 0 },
  { name: 'plus', x: 82, y: 72, size: 16, float: true },
  { name: 'blob2', x: 4, y: 52, size: 42, hideOnMobile: true },
  { name: 'starburst', x: 92, y: 46, size: 34, float: true, hideOnMobile: true },
  { name: 'computer', x: 12, y: 14, size: 34, rotate: -6, depth: 2, depthColor: '#3156FF', hideOnMobile: true },
  { name: 'smiley', x: 72, y: 86, size: 26, rotate: 10, float: true, hideOnMobile: true },
  { name: 'sparkle', x: 60, y: 10, size: 14, palette: { a: '#C4FF3B' }, float: true },
  { name: 'cursor', x: 66, y: 60, size: 18, rotate: -8, hideOnMobile: true },
]

export function StartScreen({ phase, game, dispatchGame, onPressStart, onSkip, onGameComplete }: Props) {
  const { t, lang } = useI18n()
  const reduced = useReducedMotion()
  const ilia = event.couple.partnerA[lang].toUpperCase()
  const anna = event.couple.partnerB[lang].toUpperCase()
  const startRef = useRef<HTMLButtonElement>(null)

  // Enter / Space on the title starts the game (arcade muscle memory).
  useEffect(() => {
    if (phase !== 'title') return
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el && el !== document.body && el.tagName !== 'MAIN') return
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        play('start')
        onPressStart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onPressStart])

  const fade = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' },
        animate: { opacity: 1, clipPath: 'inset(0% 0 0% 0)' },
        exit: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' },
      }

  return (
    <section className={`screen start start--${phase}`} aria-labelledby="start-title">
      <div className="start__grid" aria-hidden="true" />
      <PixelParticles />
      <StickerField items={STICKERS} className={phase === 'game' ? 'is-dim' : ''} />
      <div className="crt" aria-hidden="true" />

      <GameHUD
        className="start__hud"
        items={[
          { label: t.start.oneUp, value: '2027', tone: 'orange', blink: phase === 'title' },
          { label: t.start.highScore, value: '∞', tone: 'orange' },
          { label: t.start.twoUp, value: '2027', tone: 'orange', blink: phase === 'title' },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'title' ? (
          <motion.div
            key="title"
            className="start__body"
            {...fade}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="start__stage">
              <PlayerCard side="p1" asset="ilia.portrait" label={t.start.player1} name={ilia} />

              <div className="start__title">
                <h1 id="start-title" className="sr-only">
                  WEDDING.EXE — {ilia} + {anna}
                </h1>
                <div className="wordmark">
                  <PixelWordmark text="WEDDING" className="wordmark__main" label="WEDDING.EXE" />
                  <div className="wordmark__ext">
                    <PixelWordmark text=".EXE" palette="lime" className="wordmark__exe" delay={0.5} />
                    <span className="wordmark__cursor" aria-hidden="true" />
                  </div>
                </div>
                <p className="start__couple">
                  <span>{ilia}</span>
                  <b aria-hidden="true">+</b>
                  <span>{anna}</span>
                </p>
                <p className="start__tagline">{t.start.tagline}</p>
              </div>

              <PlayerCard side="p2" asset="anna.portrait" label={t.start.player2} name={anna} />
            </div>

            <div className="start__actions">
              <ArcadeButton ref={startRef} size="xl" arrow sfx="start" onClick={onPressStart} className="start__cta">
                <span className="blink-soft">{t.start.pressStart}</span>
              </ArcadeButton>
              <button type="button" className="text-btn" onClick={onSkip}>
                [ {t.start.skipGame} ]
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            className="start__body start__body--game"
            {...fade}
            transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <GameBoard state={game} dispatch={dispatchGame} onComplete={onGameComplete} />
            <button type="button" className="text-btn game__skip" onClick={onSkip}>
              [ {t.start.skipGame} ]
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function PlayerCard({ side, asset, label, name }: { side: 'p1' | 'p2'; asset: AssetKey; label: string; name: string }) {
  return (
    <div className={`player-card player-card--${side}`}>
      <div className="player-card__top">
        <span>{label}</span>
        <span className="player-card__led" aria-hidden="true" />
      </div>
      <PixelAsset asset={asset} size="100%" alt={`${label} — ${name}`} />
      <div className="player-card__name">{name}</div>
    </div>
  )
}
