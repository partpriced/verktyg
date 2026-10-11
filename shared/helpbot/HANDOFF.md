# Refactor handoff (cards, fluid, annoying, lighter, reel, shared/helpbot)

Stopped early on coordinator request. Nothing committed by this session.

## Done

### shared/helpbot/ (single source of truth for the Helper painter)
- `palette.js` (BODIES, TAU, shade, rgba, star, mulberry), `body.js`, `face.js` (eyes, mouths),
  `hats.js` (HATS, OVER), `props.js`, `auras.js`, `draw.js` (drawHelpbot), `index.js` (exports drawHelpbot, BODIES, HATS, OVER, PROPS).
- Code was sliced from the original by line range, so it is byte-identical. Verified pixel-identical to the
  original card-game painter for all 60 looks plus edge cases (3 sizes and t values, 189 renders, 0 differing pixels).
- New backwards-compatible option `look.noGlow` skips the dark radial contrast glow.
