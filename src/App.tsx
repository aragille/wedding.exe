import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { StartScreen, type StartPhase } from './screens/StartScreen'
import { InvitationScreen } from './screens/InvitationScreen'
import { RSVPScreen, type RsvpOutcome } from './screens/RSVPScreen'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { SoundToggle } from './components/SoundToggle'
import { play } from './lib/sound'
import { ProgressIndicator } from './components/ProgressIndicator'
import { ScreenTransition } from './components/ScreenTransition'
import { preloadAssets } from './components/PixelAsset'
import { gameReducer, initialGameState, pickLevelForViewport } from './game/GameState'
import type { RsvpDraft } from './components/RSVPForm'
import { characterAssets, type AssetKey } from './config/characterAssets'
import { color } from './config/designTokens'
import { uid } from './lib/random'
import { useI18n } from './i18n'

/**
 * Screen state machine — exactly three primary screens on one URL:
 *   start (title ⇄ game)  →  invite  →  rsvp
 * Browser back/forward is mapped onto the same states via history.state.
 */
export type Screen = 'start' | 'invite' | 'rsvp'
type Wipe = { phase: 'idle' | 'cover' | 'reveal'; color: string }
type HistoryState = { screen: Screen; phase?: StartPhase }

const ORDER: Screen[] = ['start', 'invite', 'rsvp']
const COVER_MS = 320
const REVEAL_MS = 340

const newDraft = (): RsvpDraft => ({ name: '', attendance: null, partySize: 1, idempotencyKey: uid() })

export default function App() {
  const reduced = useReducedMotion()
  const { t } = useI18n()
  const [screen, setScreen] = useState<Screen>('start')
  const [startPhase, setStartPhase] = useState<StartPhase>('title')
  const [game, dispatchGame] = useReducer(gameReducer, initialGameState)
  const [draft, setDraft] = useState<RsvpDraft>(newDraft)
  const [outcome, setOutcome] = useState<RsvpOutcome | null>(null)
  const [wipe, setWipe] = useState<Wipe>({ phase: 'idle', color: color.lime })
  const busy = useRef(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    preloadAssets(Object.keys(characterAssets) as AssetKey[])
    window.history.replaceState({ screen: 'start', phase: 'title' } satisfies HistoryState, '')
  }, [])

  const focusHeading = () =>
    window.setTimeout(() => {
      const h = mainRef.current?.querySelector<HTMLElement>('h1:not(.sr-only), h1')
      if (h) {
        h.setAttribute('tabindex', '-1')
        h.focus({ preventScroll: true })
      }
    }, 60)

  const applyScreen = useCallback((to: Screen, phase: StartPhase = 'title') => {
    setScreen(to)
    setStartPhase(to === 'start' ? phase : 'title')
    mainRef.current?.scrollTo({ top: 0 })
  }, [])

  const go = useCallback(
    (to: Screen, { push = true, phase = 'title' as StartPhase } = {}) => {
      if (busy.current) return
      if (push) window.history.pushState({ screen: to, phase } satisfies HistoryState, '')
      const forward = ORDER.indexOf(to) >= ORDER.indexOf(screen)
      const wipeColor = to === 'invite' && forward ? color.lime : to === 'rsvp' ? color.blue : color.lavender
      if (reduced) {
        applyScreen(to, phase)
        focusHeading()
        return
      }
      busy.current = true
      play('wipe')
      setWipe({ phase: 'cover', color: wipeColor })
      window.setTimeout(() => {
        applyScreen(to, phase)
        setWipe({ phase: 'reveal', color: wipeColor })
        window.setTimeout(() => {
          setWipe({ phase: 'idle', color: wipeColor })
          busy.current = false
          focusHeading()
        }, REVEAL_MS)
      }, COVER_MS)
    },
    [screen, reduced, applyScreen],
  )

  // [ TEXT ] buttons (skip / back / new response) share one click blip
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.text-btn')) play('click')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HistoryState | null
      if (!st?.screen) return
      if (st.screen === screen) {
        setStartPhase(st.phase ?? 'title')
        return
      }
      busy.current = false
      go(st.screen, { push: false, phase: st.phase ?? 'title' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [go, screen])

  const pressStart = useCallback(() => {
    if (game.status !== 'playing') dispatchGame({ type: 'start', levelId: pickLevelForViewport() })
    setStartPhase('game')
    window.history.pushState({ screen: 'start', phase: 'game' } satisfies HistoryState, '')
  }, [game.status])

  const skip = useCallback(() => go('invite'), [go])

  const onGameComplete = useCallback(() => {
    go('invite')
    // the next PRESS START begins a fresh round
    window.setTimeout(() => dispatchGame({ type: 'reset' }), COVER_MS + 50)
  }, [go])

  const patchDraft = useCallback((patch: Partial<Omit<RsvpDraft, 'idempotencyKey'>>) => {
    // A changed payload is a new submission → new idempotency key. Retries of the same payload reuse it.
    setDraft((d) => ({ ...d, ...patch, idempotencyKey: uid() }))
  }, [])

  const onSuccess = useCallback((o: RsvpOutcome) => {
    setOutcome(o)
  }, [])

  const another = useCallback(() => {
    setOutcome(null)
    setDraft(newDraft())
  }, [])

  const backTarget =
    screen === 'rsvp'
      ? () => go('invite')
      : screen === 'invite'
        ? () => go('start')
        : startPhase === 'game'
          ? () => {
              play('click')
              setStartPhase('title')
              window.history.pushState({ screen: 'start', phase: 'title' } satisfies HistoryState, '')
            }
          : null

  const surface = screen === 'invite' ? 'light' : 'dark'
  const step = ORDER.indexOf(screen) as 0 | 1 | 2

  return (
    <>
      <div className={`chrome chrome--${surface}`}>
        <div className="chrome__left">
          {backTarget && (
            <button type="button" className="chrome-back" onClick={backTarget} aria-label={t.common.back}>
              <svg viewBox="0 0 6 7" width="10" height="12" shapeRendering="crispEdges" aria-hidden="true">
                <path d="M4 0h2v7H4V6H3V5H2V4H1V3h1V2h1V1h1z" fill="currentColor" />
              </svg>
              <span>{t.common.back}</span>
            </button>
          )}
          <ProgressIndicator step={step} />
        </div>
        <div className="chrome__right">
          <SoundToggle />
          <LanguageSwitcher />
        </div>
      </div>
      <main ref={mainRef} className={`app app--${screen} surface-${surface}`} data-screen={screen}>
        {screen === 'start' && (
          <StartScreen
            phase={startPhase}
            game={game}
            dispatchGame={dispatchGame}
            onPressStart={pressStart}
            onSkip={skip}
            onGameComplete={onGameComplete}
          />
        )}
        {screen === 'invite' && <InvitationScreen onJoin={() => go('rsvp')} />}
        {screen === 'rsvp' && (
          <RSVPScreen
            draft={draft}
            outcome={outcome}
            onDraftChange={patchDraft}
            onSuccess={onSuccess}
            onAnother={another}
          />
        )}
      </main>
      <ScreenTransition phase={wipe.phase} color={wipe.color} />
    </>
  )
}
