import { isAdjacent, key, parseLevel, stepFrom, type Dir, type Level, type Vec } from './MovementLogic'

export type GameStatus = 'idle' | 'playing' | 'won'

export interface GameState {
  levelId: Level['id']
  pos: Vec
  facing: 'left' | 'right'
  steps: number
  collected: string[]
  status: GameStatus
  /** increments on every blocked move — drives the bump animation */
  bumps: number
  lastMoveAt: number
}

export type GameAction =
  | { type: 'start'; levelId: Level['id'] }
  | { type: 'move'; dir: Dir; at: number }
  | { type: 'reset' }

export const initialGameState: GameState = {
  levelId: 'wide',
  pos: { x: 0, y: 0 },
  facing: 'right',
  steps: 0,
  collected: [],
  status: 'idle',
  bumps: 0,
  lastMoveAt: 0,
}

const levels = { wide: parseLevel('wide'), tall: parseLevel('tall') }
export const getLevel = (id: Level['id']) => levels[id]

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start': {
      const level = getLevel(action.levelId)
      return { ...initialGameState, levelId: action.levelId, pos: level.start, status: 'playing' }
    }
    case 'reset':
      return initialGameState
    case 'move': {
      if (state.status !== 'playing') return state
      const level = getLevel(state.levelId)
      const facing = action.dir === 'left' ? 'left' : action.dir === 'right' ? 'right' : state.facing
      const next = stepFrom(level, state.pos, action.dir)
      if (!next) return { ...state, facing, bumps: state.bumps + 1 }
      const k = key(next)
      const heart = level.tiles[next.y][next.x] === 'h' && !state.collected.includes(k)
      const won = isAdjacent(next, level.anna)
      return {
        ...state,
        pos: next,
        facing,
        steps: state.steps + 1,
        collected: heart ? [...state.collected, k] : state.collected,
        status: won ? 'won' : 'playing',
        lastMoveAt: action.at,
      }
    }
  }
}

/** Pick the layout that best fits the current viewport. */
export function pickLevelForViewport(): Level['id'] {
  const w = window.innerWidth
  const h = window.innerHeight
  return w < 720 && h > w ? 'tall' : 'wide'
}
