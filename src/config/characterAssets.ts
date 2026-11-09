/**
 * CHARACTER ASSET MANIFEST
 * ------------------------------------------------------------------
 * Every image of Ilia / Anna is referenced ONLY through this file.
 * To ship a final image, drop the PNG at `src` (under /public) — no code changes.
 * If the file is missing or fails to load, <PixelAsset> renders a designed placeholder.
 * Full production spec: ASSETS.md
 */

export type AssetKey =
  | 'ilia.portrait'
  | 'anna.portrait'
  | 'ilia.idle'
  | 'ilia.walk'
  | 'anna.idle'
  | 'anna.celebrate'
  | 'couple.reunion'
  | 'couple.hero'
  | 'couple.celebration'

export interface SpriteSpec {
  frames: number
  frameWidth: number
  frameHeight: number
  /** frames per second when playing */
  fps: number
}

export interface CharacterAsset {
  id: string // ASSET_XX
  key: AssetKey
  src: string
  /** width / height */
  aspect: number
  nativeWidth: number
  nativeHeight: number
  /** Placeholder label, e.g. "ILIA / IDLE SPRITE" */
  label: string
  /** One-line description of the intended final image */
  description: string
  /** Placeholder accent colour token name */
  tone: 'lime' | 'lavender' | 'blue' | 'orange'
  /** Who appears (drives the placeholder silhouette) */
  subject: 'ilia' | 'anna' | 'couple'
  sprite?: SpriteSpec
}

const A = (a: CharacterAsset) => a

export const characterAssets: Record<AssetKey, CharacterAsset> = {
  'ilia.portrait': A({
    id: 'ASSET_01',
    key: 'ilia.portrait',
    src: '/assets/characters/ilia-portrait.png',
    aspect: 1,
    nativeWidth: 256,
    nativeHeight: 256,
    label: 'ILIA / PORTRAIT',
    description: 'Pixel bust of Ilia — PLAYER 1 card',
    tone: 'lime',
    subject: 'ilia',
  }),
  'anna.portrait': A({
    id: 'ASSET_02',
    key: 'anna.portrait',
    src: '/assets/characters/anna-portrait.png',
    aspect: 1,
    nativeWidth: 256,
    nativeHeight: 256,
    label: 'ANNA / PORTRAIT',
    description: 'Pixel bust of Anna — PLAYER 2 card',
    tone: 'lavender',
    subject: 'anna',
  }),
  'ilia.idle': A({
    id: 'ASSET_03',
    key: 'ilia.idle',
    src: '/assets/characters/ilia-idle.png',
    aspect: 1,
    nativeWidth: 64,
    nativeHeight: 64,
    label: 'ILIA / IDLE SPRITE',
    description: 'Full-body Ilia standing still',
    tone: 'lime',
    subject: 'ilia',
  }),
  'ilia.walk': A({
    id: 'ASSET_04',
    key: 'ilia.walk',
    src: '/assets/characters/ilia-walk.png',
    aspect: 1,
    nativeWidth: 256,
    nativeHeight: 64,
    label: 'ILIA / WALK ×4',
    description: '4-frame horizontal walk cycle, facing right',
    tone: 'lime',
    subject: 'ilia',
    sprite: { frames: 4, frameWidth: 64, frameHeight: 64, fps: 10 },
  }),
  'anna.idle': A({
    id: 'ASSET_05',
    key: 'anna.idle',
    src: '/assets/characters/anna-idle.png',
    aspect: 1,
    nativeWidth: 64,
    nativeHeight: 64,
    label: 'ANNA / IDLE SPRITE',
    description: 'Full-body Anna waiting — game destination',
    tone: 'lavender',
    subject: 'anna',
  }),
  'anna.celebrate': A({
    id: 'ASSET_06',
    key: 'anna.celebrate',
    src: '/assets/characters/anna-celebrate.png',
    aspect: 1,
    nativeWidth: 64,
    nativeHeight: 64,
    label: 'ANNA / CELEBRATE',
    description: 'Anna jumping / cheering — win state',
    tone: 'lavender',
    subject: 'anna',
  }),
  'couple.reunion': A({
    id: 'ASSET_07',
    key: 'couple.reunion',
    src: '/assets/couple/couple-reunion.png',
    aspect: 1,
    nativeWidth: 512,
    nativeHeight: 512,
    label: 'COUPLE / REUNION',
    description: 'Ilia + Anna together, playful romantic pose',
    tone: 'orange',
    subject: 'couple',
  }),
  'couple.hero': A({
    id: 'ASSET_08',
    key: 'couple.hero',
    src: '/assets/couple/couple-hero.png',
    aspect: 1,
    nativeWidth: 1024,
    nativeHeight: 1024,
    label: 'COUPLE / HERO POSTER',
    description: 'Main poster illustration of Ilia & Anna',
    tone: 'lime',
    subject: 'couple',
  }),
  'couple.celebration': A({
    id: 'ASSET_09',
    key: 'couple.celebration',
    src: '/assets/couple/couple-celebration.png',
    aspect: 1,
    nativeWidth: 512,
    nativeHeight: 512,
    label: 'COUPLE / CELEBRATION',
    description: 'Ilia + Anna celebrating with hearts & confetti',
    tone: 'lime',
    subject: 'couple',
  }),
}
