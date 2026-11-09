import { color as c } from '../config/designTokens'
/**
 * Original pixel-art graphic library for WEDDING.EXE.
 * Palette chars are SEMANTIC so each sprite can be recoloured per use:
 *   a = main   A = main shade   h = highlight   k = ink/outline   s = secondary   S = secondary shade
 * '.' = transparent
 */
export type PixelSlot = 'a' | 'A' | 'h' | 'k' | 's' | 'S'
export type PixelPalette = Partial<Record<PixelSlot, string>>

export interface PixelSprite {
  rows: string[]
  palette: PixelPalette
}

const s = (palette: PixelPalette, ...rows: string[]): PixelSprite => ({ rows, palette })


export const pixelArt = {
  heart: s(
    { a: c.orange, A: c.orangeDeep, h: c.offWhite },
    '.aaa.aaa.',
    'ahhaaaaaa',
    'ahaaaaaaA',
    'aaaaaaaaA',
    '.aaaaaaA.',
    '..aaaaA..',
    '...aaA...',
    '....A....',
  ),
  heartSmall: s({ a: c.orange, h: c.offWhite }, '.a.a.', 'ahaaa', 'aaaaa', '.aaa.', '..a..'),
  sparkle: s(
    { a: c.lavender, h: c.offWhite },
    '...a...',
    '...a...',
    '..aha..',
    'aahhhaa',
    '..aha..',
    '...a...',
    '...a...',
  ),
  starburst: s(
    { a: c.lime, A: c.limeDeep, h: c.offWhite },
    '.....a.....',
    '.a...a...a.',
    '..a.aaa.a..',
    '...aaaaa...',
    '..aaahaaa..',
    'aaaahhhaaaa',
    '..aaahaaA..',
    '...aaaaA...',
    '..a.aAA.a..',
    '.a...A...a.',
    '.....A.....',
  ),
  star: s(
    { a: c.lime, A: c.limeDeep, h: c.offWhite },
    '....a....',
    '....a....',
    '...aha...',
    'aaaahaaaA',
    '.aaaaaaA.',
    '..aaaaA..',
    '..aaAaA..',
    '.aaA.AaA.',
    '.aA...AA.',
  ),
  arrow: s(
    { a: c.lime, A: c.limeDeep },
    '....a...',
    '....aa..',
    'aaaaaaa.',
    'aaaaaaaa',
    'AAAAAAA.',
    '....AA..',
    '....A...',
  ),
  cursor: s(
    { k: c.black, h: c.offWhite },
    'k.......',
    'kk......',
    'khk.....',
    'khhk....',
    'khhhk...',
    'khhhhk..',
    'khhhhhk.',
    'khhhhhhk',
    'khhhkkkk',
    'khkhhk..',
    'kk.khk..',
    '....kk..',
  ),
  computer: s(
    { h: c.offWhite, A: c.paper, s: c.blue, a: c.lime, k: c.black },
    '.hhhhhhhhhh.',
    '.hssssssssA.',
    '.hssassassA.',
    '.hssssssssA.',
    '.hsassssasA.',
    '.hssaaaassA.',
    '.hssssssssA.',
    '.AAAAAAAAAA.',
    '....hhhA....',
    '.hhhhhhhhhA.',
    'hkhkhkhkhkhA',
    'AAAAAAAAAAAA',
  ),
  smiley: s(
    { a: c.lime, k: c.black, A: c.limeDeep },
    '..aaaaa..',
    '.aaaaaaa.',
    'aakaaakaa',
    'aakaaakaA',
    'aaaaaaaaA',
    'akaaaaakA',
    'aakkkkkAA',
    '.aaaaaAA.',
    '..aAAAA..',
  ),
  blob: s(
    { a: c.lavender },
    '..aaaa....',
    '.aaaaaaa..',
    'aaaaaaaaa.',
    'aaaaaaaaaa',
    '.aaaaaaaaa',
    '..aaaaaaa.',
    '...aaaa.a.',
    '........aa',
  ),
  blob2: s(
    { a: c.blue },
    '....aaa...',
    '.aaaaaaa..',
    'aaaaaaaaaa',
    '.aaaaaaaa.',
    'aaaaaaaa..',
    '.aaa.aaaa.',
    '......aa..',
  ),
  ring: s(
    { a: c.lime, A: c.limeDeep, h: c.offWhite, s: c.lavender },
    '...hsh...',
    '...sss...',
    '....s....',
    '..aaaaa..',
    '.aA...ha.',
    'aA.....ha',
    'aA.....aa',
    'aA.....aa',
    '.aA...Aa.',
    '..AAAAA..',
  ),
  plus: s({ a: c.orange }, '..a..', '..a..', 'aaaaa', '..a..', '..a..'),
  cross: s({ a: c.lavender }, 'a...a', '.a.a.', '..a..', '.a.a.', 'a...a'),
  checker: s(
    { a: c.offWhite },
    'aa..aa..',
    'aa..aa..',
    '..aa..aa',
    '..aa..aa',
    'aa..aa..',
    'aa..aa..',
    '..aa..aa',
    '..aa..aa',
  ),
  trophy: s(
    { a: c.lime, A: c.limeDeep, h: c.offWhite },
    'aaaaaaaaa',
    'ahaaaaaaA',
    'ahaaaaaaA',
    '.aaaaaaA.',
    '..aaaaA..',
    '...aaA...',
    '....A....',
    '...aaA...',
    '..aaaaA..',
  ),
  brokenHeart: s(
    { a: c.lavender, A: c.lavenderDeep, h: c.offWhite },
    '.aaa.aaa.',
    'ahha.aaaa',
    'aha.aaaaA',
    'aaaa.aaaA',
    '.aa.aaaA.',
    '..aa.aA..',
    '...a.A...',
    '....A....',
  ),
  /* -------- abstract placeholder silhouettes (NOT depictions of the couple) -------- */
  bustA: s(
    { a: c.black },
    '....aaaa....',
    '...aaaaaa...',
    '..aaaaaaaa..',
    '..aaaaaaaa..',
    '..aaaaaaaa..',
    '...aaaaaa...',
    '....aaaa....',
    '..aaaaaaaa..',
    '.aaaaaaaaaa.',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaaa',
  ),
  bustB: s(
    { a: c.black },
    '...aaaaaa...',
    '..aaaaaaaa..',
    '.aaaaaaaaaa.',
    '.aaaaaaaaaa.',
    '.aaaaaaaaaa.',
    '.aaaaaaaaaa.',
    '.aa.aaaa.aa.',
    '..aaaaaaaa..',
    '.aaaaaaaaaa.',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaaa',
  ),
  bodyA: s(
    { a: c.black },
    '..aaaa..',
    '.aaaaaa.',
    '.aaaaaa.',
    '..aaaa..',
    '...aa...',
    '.aaaaaa.',
    'aaaaaaaa',
    'a.aaaa.a',
    'a.aaaa.a',
    '..aaaa..',
    '..a..a..',
    '..a..a..',
    '..a..a..',
    '.aa..aa.',
  ),
  bodyB: s(
    { a: c.black },
    '..aaaa..',
    '.aaaaaa.',
    'aaaaaaaa',
    'aaaaaaaa',
    'aa.aa.aa',
    '.aaaaaa.',
    'a.aaaa.a',
    'a.aaaa.a',
    '..aaaa..',
    '.aaaaaa.',
    'aaaaaaaa',
    '..a..a..',
    '..a..a..',
    '.aa..aa.',
  ),
  couple: s(
    { a: c.black, s: c.orange },
    '.......s.s.......',
    '......sssss......',
    '.......sss.......',
    '..aaaa..s..aaaa..',
    '.aaaaaa...aaaaaa.',
    '.aaaaaa..aaaaaaaa',
    '..aaaa...aaaaaaaa',
    '...aa....aa.aa.aa',
    '.aaaaaa...aaaaaa.',
    'aaaaaaaa.a.aaaa.a',
    'a.aaaa.aaa.aaaa.a',
    'a.aaaa.a...aaaa..',
    '..aaaa....aaaaaa.',
    '..a..a...aaaaaaaa',
    '..a..a.....a..a..',
    '.aa..aa...aa..aa.',
  ),
} satisfies Record<string, PixelSprite>

export type PixelArtName = keyof typeof pixelArt

/** Convert a sprite into one SVG path per resolved colour. */
export function spriteToPaths(sprite: PixelSprite, palette: PixelPalette = {}) {
  const pal = { ...sprite.palette, ...palette }
  const byColor = new Map<string, string>()
  const silhouette: string[] = []
  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x] as PixelSlot | '.'
      if (ch === '.') continue
      const fill = pal[ch as PixelSlot]
      const cell = `M${x} ${y}h1v1h-1z`
      silhouette.push(cell)
      if (!fill) continue
      byColor.set(fill, (byColor.get(fill) ?? '') + cell)
    }
  })
  return {
    width: Math.max(...sprite.rows.map((r) => r.length)),
    height: sprite.rows.length,
    paths: [...byColor.entries()].map(([fill, d]) => ({ fill, d })),
    silhouette: silhouette.join(''),
  }
}
