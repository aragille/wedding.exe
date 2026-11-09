/**
 * Pure grid logic — no React. Tiles:
 *   '.' floor   '#' block   'h' heart   'I' Ilia start   'A' Anna (solid)
 */
export type Dir = 'up' | 'down' | 'left' | 'right'
export interface Vec {
  x: number
  y: number
}

export interface Level {
  id: 'wide' | 'tall'
  cols: number
  rows: number
  tiles: string[] // row strings
  start: Vec
  anna: Vec
  hearts: Vec[]
}

const RAW: Record<Level['id'], string[]> = {
  // ~13 steps, landscape (tablet / desktop)
  wide: [
    '....#......', //
    '..h.#..##..',
    '....#...#h.',
    'I......h#.A',
    '..#........',
    '..#.h..#...',
    '..#........',
  ],
  // ~9 steps, portrait (phones)
  tall: [
    '..#A...', //
    '..#..h.',
    '.h#.##.',
    '.......',
    '##.h.##',
    '...#...',
    '.h.#.h.',
    '...#...',
    '...I...',
  ],
}

export function parseLevel(id: Level['id']): Level {
  const tiles = RAW[id]
  let start: Vec = { x: 0, y: 0 }
  let anna: Vec = { x: 0, y: 0 }
  const hearts: Vec[] = []
  tiles.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === 'I') start = { x, y }
      if (ch === 'A') anna = { x, y }
      if (ch === 'h') hearts.push({ x, y })
    }),
  )
  return { id, cols: tiles[0].length, rows: tiles.length, tiles, start, anna, hearts }
}

export const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const key = (v: Vec) => `${v.x},${v.y}`
export const same = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y

export function inBounds(level: Level, p: Vec) {
  return p.x >= 0 && p.y >= 0 && p.x < level.cols && p.y < level.rows
}

export function isWalkable(level: Level, p: Vec) {
  if (!inBounds(level, p)) return false
  const t = level.tiles[p.y][p.x]
  return t !== '#' && t !== 'A'
}

export function stepFrom(level: Level, p: Vec, dir: Dir): Vec | null {
  const n = { x: p.x + DIRS[dir].x, y: p.y + DIRS[dir].y }
  return isWalkable(level, n) ? n : null
}

export function isAdjacent(a: Vec, b: Vec) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
}

export function manhattan(a: Vec, b: Vec) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function dirBetween(a: Vec, b: Vec): Dir {
  if (b.x > a.x) return 'right'
  if (b.x < a.x) return 'left'
  if (b.y > a.y) return 'down'
  return 'up'
}

/** BFS shortest path (excluding `from`, including `to`). Returns [] if unreachable. */
export function findPath(level: Level, from: Vec, to: Vec): Vec[] {
  if (same(from, to)) return []
  const prev = new Map<string, Vec | null>([[key(from), null]])
  const queue: Vec[] = [from]
  while (queue.length) {
    const cur = queue.shift()!
    if (same(cur, to)) break
    for (const d of Object.keys(DIRS) as Dir[]) {
      const n = stepFrom(level, cur, d)
      if (n && !prev.has(key(n))) {
        prev.set(key(n), cur)
        queue.push(n)
      }
    }
  }
  if (!prev.has(key(to))) return []
  const path: Vec[] = []
  let c: Vec | null = to
  while (c && !same(c, from)) {
    path.unshift(c)
    c = prev.get(key(c)) ?? null
  }
  return path
}

/** Where a tap should walk to: the tile itself, or — if tapping Anna/a block — the nearest walkable neighbour. */
export function resolveTapTarget(level: Level, from: Vec, tapped: Vec): Vec | null {
  if (isWalkable(level, tapped)) return tapped
  const options = (Object.keys(DIRS) as Dir[])
    .map((d) => ({ x: tapped.x + DIRS[d].x, y: tapped.y + DIRS[d].y }))
    .filter((p) => isWalkable(level, p))
    .map((p) => ({ p, len: same(p, from) ? 0 : findPath(level, from, p).length || Infinity }))
    .sort((a, b) => a.len - b.len)
  return options[0] && options[0].len !== Infinity ? options[0].p : null
}
