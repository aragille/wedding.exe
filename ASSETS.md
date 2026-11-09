# Character assets

Every image of Ilia & Anna goes through `src/config/characterAssets.ts`.
Drop a PNG at the path below and it replaces the placeholder automatically — no code changes.
Missing or broken files fall back to the designed placeholder.

All files: **transparent PNG**, nearest-neighbour pixel art, same palette / proportions / outline weight across the set.

| ID | File | Size | Used on | Animated | Status |
|---|---|---|---|---|---|
| ASSET_01 | `public/assets/characters/ilia-portrait.png` | 256×256 | Title, PLAYER 1 card | no | installed |
| ASSET_02 | `public/assets/characters/anna-portrait.png` | 256×256 | Title, PLAYER 2 card | no | installed |
| ASSET_03 | `public/assets/characters/ilia-idle.png` | 64×64 | Game, Ilia standing | no | installed |
| ASSET_04 | `public/assets/characters/ilia-walk.png` | 256×64 (4 × 64) | Game, Ilia moving (auto-flipped for left) | yes, 10 fps | installed |
| ASSET_05 | `public/assets/characters/anna-idle.png` | 64×64 | Game, Anna waiting | no | installed |
| ASSET_06 | `public/assets/characters/anna-celebrate.png` | 64×64 | Game win state | no | installed |
| ASSET_07 | `public/assets/couple/couple-reunion.png` | 512×512 | Win animation | no | installed |
| ASSET_08 | `public/assets/couple/couple-hero.png` | 1024×1024 | Invitation poster (main) | no | installed |
| ASSET_09 | `public/assets/couple/couple-celebration.png` | 512×512 | RSVP "yes" confirmation | no | installed |

## Consistency rules
- Same character design in every file: Ilia — wavy brown hair, white tee, black crossbody bag, black wide trousers, white sneakers. Anna — long wavy brown hair, white sweater, black shoulder bag, light-blue wide jeans, dark shoes.
- Sprites face **right**; the game mirrors Ilia when walking left.
- Walk sheet: 4 frames left→right, feet on the same baseline in every frame.
- No background, no drop shadow baked in (the UI adds shadows).

## Generation prompt (base)
> Pixel art, chunky readable pixels, dark 1px outline, soft cel shading, transparent background, cute but not childish, full body / bust as specified. [Character description above]. Consistent with the existing WEDDING.EXE sprites.
