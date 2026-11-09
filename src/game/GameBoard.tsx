import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { useI18n } from '../i18n'
import { PixelAsset } from '../components/PixelAsset'
import { PixelIcon } from '../components/PixelDecoration'
import { ArcadeButton } from '../components/ArcadeButton'
import { GameHUD } from '../components/GameHUD'
import { PixelConfetti } from '../components/PixelParticles'
import { motion as timing } from '../config/designTokens'
import { gameReducer, getLevel, type GameAction, type GameState } from './GameState'
import { usePlayerController } from './PlayerController'
import { dirBetween, findPath, key, manhattan, resolveTapTarget, type Dir, type Vec } from './MovementLogic'
import { mulberry32 } from '../lib/random'
import { play } from '../lib/sound'

interface Props {
  state: GameState
  dispatch: Dispatch<GameAction>
  onComplete: () => void
}

const BLOCK_TONES = ['blue', 'lavender', 'checker', 'paper', 'blue', 'orange'] as const

/** Win choreography timing (ms from the winning step). */
const WIN = { heart: 0, reunion: 520, glitch: 1350, achievement: 1850, auto: 1850 + 2000 }
const WIN_REDUCED = { heart: 0, reunion: 200, glitch: 200, achievement: 500, auto: 500 + 2200 }

export function GameBoard({ state, dispatch, onComplete }: Props) {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const level = getLevel(state.levelId)

  // Synchronous mirror of state so held keys / auto-walk can test collisions between renders.
  const stateRef = useRef(state)
  stateRef.current = state

  const autoWalk = useRef<number | null>(null)
  const cancelAutoWalk = useCallback(() => {
    if (autoWalk.current) window.clearInterval(autoWalk.current)
    autoWalk.current = null
  }, [])

  const move = useCallback(
    (dir: Dir): boolean => {
      const action: GameAction = { type: 'move', dir, at: performance.now() }
      const before = stateRef.current
      if (before.status !== 'playing') return false
      const after = gameReducer(before, action)
      stateRef.current = after
      dispatch(action)
      if (after.pos === before.pos) play('bump')
      else if (after.collected.length > before.collected.length) play('heart')
      else if (after.status === 'playing') play('step')
      return after.pos !== before.pos && after.status === 'playing'
    },
    [dispatch],
  )

  const playing = state.status === 'playing'
  const ctrl = usePlayerController({ enabled: playing, move, onManualInput: cancelAutoWalk })

  useEffect(() => cancelAutoWalk, [cancelAutoWalk])

  /* ---------------- tap-to-move ---------------- */
  const boardRef = useRef<HTMLDivElement>(null)
  const swiped = useRef(false)

  const walkTo = useCallback(
    (target: Vec) => {
      cancelAutoWalk()
      const path = findPath(level, stateRef.current.pos, target)
      if (!path.length) return
      let i = 0
      const tick = () => {
        const cur = stateRef.current
        if (i >= path.length || cur.status !== 'playing') return cancelAutoWalk()
        const ok = move(dirBetween(cur.pos, path[i]))
        i++
        if (!ok) cancelAutoWalk()
      }
      tick()
      autoWalk.current = window.setInterval(tick, timing.stepMs)
    },
    [level, move, cancelAutoWalk],
  )

  const onBoardClick = (e: React.MouseEvent) => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    if (!playing || !boardRef.current) return
    const r = boardRef.current.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * level.cols)
    const y = Math.floor(((e.clientY - r.top) / r.height) * level.rows)
    const target = resolveTapTarget(level, stateRef.current.pos, { x, y })
    if (target) walkTo(target)
  }

  /* ---------------- moving flag (walk cycle) ---------------- */
  const [moving, setMoving] = useState(false)
  useEffect(() => {
    if (!state.lastMoveAt) return
    setMoving(true)
    const id = window.setTimeout(() => setMoving(false), timing.stepMs + 60)
    return () => window.clearTimeout(id)
  }, [state.lastMoveAt])

  /* ---------------- bump shake ---------------- */
  const [bump, setBump] = useState(false)
  useEffect(() => {
    if (!state.bumps) return
    setBump(true)
    const id = window.setTimeout(() => setBump(false), 180)
    return () => window.clearTimeout(id)
  }, [state.bumps])


  /* ---------------- win choreography ---------------- */
  const [winPhase, setWinPhase] = useState(0) // 0 none,1 heart,2 reunion,3 glitch,4 achievement
  const completed = useRef(false)
  const complete = useCallback(() => {
    if (completed.current) return
    completed.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    if (state.status !== 'won') return
    ctrl.stop()
    ctrl.stopSlide()
    cancelAutoWalk()
    const T = reduced ? WIN_REDUCED : WIN
    const ids = [
      window.setTimeout(() => (setWinPhase(1), play('win')), T.heart),
      window.setTimeout(() => (setWinPhase(2), play('reunion')), T.reunion),
      window.setTimeout(() => (setWinPhase(3), reduced || play('glitch')), T.glitch),
      window.setTimeout(() => (setWinPhase(4), play('achievement')), T.achievement),
      window.setTimeout(complete, T.auto),
    ]
    return () => ids.forEach(window.clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, reduced])

  /* ---------------- tiles ---------------- */
  const tiles = useMemo(() => {
    const rnd = mulberry32(level.cols * 31 + level.rows)
    const out: Array<{ x: number; y: number; kind: 'floor' | 'block'; tone: string; scatter: [number, number, number] }> = []
    level.tiles.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        out.push({
          x,
          y,
          kind: ch === '#' ? 'block' : 'floor',
          tone: BLOCK_TONES[Math.floor(rnd() * BLOCK_TONES.length)],
          scatter: [Math.round((rnd() - 0.5) * 160), Math.round(60 + rnd() * 220), +(rnd() * 0.25).toFixed(2)],
        })
      }),
    )
    return out
  }, [level])

  const won = state.status === 'won'
  const heartPos = {
    x: (state.pos.x + level.anna.x) / 2,
    y: (state.pos.y + level.anna.y) / 2,
  }
  const cellStyle = (p: { x: number; y: number }) => ({
    width: `${100 / level.cols}%`,
    height: `${100 / level.rows}%`,
    transform: `translate(${p.x * 100}%, ${p.y * 100}%)`,
  })

  const dist = Math.max(0, manhattan(state.pos, level.anna) - 1)

  return (
    <div className={`game ${won ? 'is-won' : ''} win-${winPhase}`}>
      <header className="game__head">
        <div className="game__title">
          <h2 className="game__h">{t.game.title}</h2>
          <p className="game__instr">{t.game.instruction}</p>
        </div>
        <GameHUD
          className="game__hud"
          items={[
            { label: t.game.hearts, value: `${state.collected.length}/${level.hearts.length}`, tone: 'orange' },
            { label: t.game.steps, value: String(state.steps).padStart(3, '0'), tone: 'lavender' },
          ]}
        />
      </header>

      <div
        className="game__stage"
        style={{ ['--cols' as string]: level.cols, ['--rows' as string]: level.rows }}
      >
        <div
          ref={boardRef}
          className={`board board--${level.id} ${bump ? 'is-bump' : ''}`}
          role="application"
          aria-label={t.game.boardLabel}
          tabIndex={0}
          onClick={onBoardClick}
          onPointerDown={ctrl.onPointerDown}
          onPointerUp={(e) => {
            if (ctrl.onPointerUp(e)) {
              swiped.current = true
              cancelAutoWalk()
            }
          }}
        >
          <div className="board__tiles">
            {tiles.map((tile) => (
              <span
                key={`${tile.x}-${tile.y}`}
                className={`tile tile--${tile.kind} ${tile.kind === 'block' ? `tone-${tile.tone}` : (tile.x + tile.y) % 2 ? 'odd' : 'even'}`}
                style={{
                  gridColumn: tile.x + 1,
                  gridRow: tile.y + 1,
                  ['--sx' as string]: `${tile.scatter[0]}px`,
                  ['--sy' as string]: `${tile.scatter[1]}px`,
                  ['--sd' as string]: `${tile.scatter[2]}s`,
                }}
              />
            ))}
          </div>

          {level.hearts.map((h) => {
            const got = state.collected.includes(key(h))
            return (
              <span key={key(h)} className={`board__item heart-pickup ${got ? 'is-got' : ''}`} style={cellStyle(h)}>
                <PixelIcon name="heart" size="56%" depth={1} />
              </span>
            )
          })}

          <span className="board__item board__anna" style={cellStyle(level.anna)}>
            <span className="board__marker tone-lavender">P2</span>
            <PixelAsset asset={won ? 'anna.celebrate' : 'anna.idle'} size="100%" decorative tag="P2" />
          </span>

          <span
            className={`board__item board__ilia ${moving ? 'is-moving' : ''}`}
            style={cellStyle(state.pos)}
          >
            {!won && <span className="board__marker tone-lime">P1</span>}
            <PixelAsset
              asset={moving && !won ? 'ilia.walk' : 'ilia.idle'}
              size="100%"
              decorative
              playing={moving}
              flip={state.facing === 'left'}
              tag="P1"
            />
          </span>

          {winPhase >= 1 && (
            <span className="board__item board__heart" style={cellStyle(heartPos)}>
              <PixelIcon name="heart" size="100%" depth={2} />
            </span>
          )}


          {winPhase >= 2 && (
            <div className="board__reunion">
              <PixelAsset asset="couple.reunion" size="100%" decorative />
            </div>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {won ? t.game.found : t.game.position(state.pos.x + 1, state.pos.y + 1, dist)}
        </p>
      </div>

      <div className="game__controls">
        <p className="game__hint">
          <span className="hint-keys">{t.game.controlsKeys}</span>
          <span className="hint-touch">{t.game.controlsTouch}</span>
        </p>
        <DPad
          disabled={!playing}
          labels={{ up: t.game.up, down: t.game.down, left: t.game.left, right: t.game.right }}
          onStart={ctrl.begin}
          onEnd={ctrl.stop}
          onTap={(d) => {
            cancelAutoWalk()
            move(d)
          }}
        />
      </div>

      {winPhase >= 4 &&
        createPortal(
          <div className="achievement" role="dialog" aria-modal="true" aria-labelledby="achv-title">
            <PixelConfetti />
            <div className="achievement__inner">
              <div className="achievement__badge">
                <PixelIcon name="trophy" size={44} depth={2} depthColor="#1B2FA8" />
                <span>{t.game.achievement}</span>
              </div>
              <h2 id="achv-title" className="achievement__title layered-text" data-text={t.game.found}>
                {t.game.found}
              </h2>
              <p className="achievement__next blink-slow">{t.game.nextLevel}</p>
              <ArcadeButton size="lg" arrow onClick={complete} autoFocus>
                {t.game.continue}
              </ArcadeButton>
              <div className="achievement__bar" aria-hidden="true">
                <i />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function DPad({
  disabled,
  labels,
  onStart,
  onEnd,
  onTap,
}: {
  disabled: boolean
  labels: Record<Dir, string>
  onStart: (d: Dir) => void
  onEnd: () => void
  onTap: (d: Dir) => void
}) {
  const btn = (d: Dir) => (
    <button
      type="button"
      className={`dpad__btn dpad__btn--${d}`}
      aria-label={labels[d]}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        onStart(d)
      }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onLostPointerCapture={onEnd}
      onClick={(e) => {
        // keyboard activation (Enter / Space) has detail === 0
        if (e.detail === 0) onTap(d)
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg viewBox="0 0 7 6" width="18" height="16" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M3 0h1v1h1v1h1v1h1v2H0V3h1V2h1V1h1z" fill="currentColor" />
      </svg>
    </button>
  )
  return (
    <div className="dpad" role="group">
      {btn('up')}
      {btn('left')}
      <span className="dpad__hub" aria-hidden="true" />
      {btn('right')}
      {btn('down')}
    </div>
  )
}
