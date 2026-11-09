/**
 * Design tokens — mirrored in src/styles/globals.css as CSS custom properties.
 * Use these in JS/SVG contexts (pixel art palettes, canvas, inline SVG fills).
 *
 * Distribution rule: black + off-white are the surfaces, lime is THE interactive
 * colour, blue + lavender are secondary accents, orange is reserved for special moments.
 */
export const color = {
  black: '#0B0B0D',
  ink: '#16161A', // raised black (panels, grid lines on black)
  lime: '#C4FF3B',
  limeDeep: '#7FB300',
  blue: '#3156FF',
  blueDeep: '#1B2FA8',
  blueAbyss: '#0E1A66',
  blueSky: '#7C94FF',
  lavender: '#B8AEFF',
  lavenderDeep: '#7A6CE0',
  orange: '#FF4D16',
  orangeDeep: '#B32E06',
  offWhite: '#F1F0EB',
  paper: '#E6E4DC', // off-white shade for grids on light surfaces
} as const

export type ColorToken = keyof typeof color

export const motion = {
  hover: 0.14, // 100–200ms
  ui: 0.3, // 200–400ms
  screen: 0.6, // 400–700ms
  achievement: 1.3, // ~1–1.5s
  stepMs: 150, // one grid step in the mini-game
} as const

export const breakpoints = {
  tablet: 720,
  desktop: 1080,
} as const
