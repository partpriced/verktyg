# Support card: handoff

A small, non-blocking card that asks for support after an export. It is never a pop-up over the download, never part
of an exported file, and has no ads or support text inside any export. Classic scripts (`window` globals), no build.

## When it appears
- **First export on this browser (any app, image or document):** a small card in the bottom-right corner, once.
  The `shown` flag is stored, so it does not come back. The first export can be a video too.
- **Long video render (Video Editor, MP4 / WebM):** if the render is still running after 10 s, the card appears inside
  the progress dialog. It is removed when the render ends. Closing the card does not stop the render. GIF exports
  and renders under 10 s show nothing.
- **Never after "No thanks":** the card never appears again on any app.
- Nothing appears when `exportCard` is false, or when storage is blocked (nothing can be remembered, so nobody is asked).

## What the card has
- Helper, small and happy (a canvas drawn with `shared/helpbot`, no glow). Decorative, hidden from screen readers.
- Text: "Helper made this free. If it helped, a donation keeps it going." and "Analytics and ads are off by default."
- **Donate**: opens the Patreon URL from `brand/brand.json` (`links.patreon`) in a new tab (`rel="noopener"`).
  Hidden when the URL is empty or not https.
- **No thanks**: same size and weight as Donate. Stores `dismissed` (permanent, every app).
- **×**: closes for this visit only. Nothing is stored.
- **Ads** (Off by default): a slider with Off and On. On calls `TlbxConsent.setChoices({ ads: true })`, the only
  place ads load. When ads are already accepted, the card shows the ad slot (one labelled block, AdSense unit markup
  only when `adsensePublisherId` is set) and a "Turn off ads" button that calls `TlbxConsent.setChoices({ ads: false })`.
  Without the consent scripts on the page, the ads row is not shown at all.
- The same choices are always available in Settings (ads switch, donate section).

## Files
- `state.js`: `window.TlbxSupportState`. One versioned envelope in localStorage, key `tlbx-support`:
  `{ "v": 1, "shown": bool, "dismissed": bool }`. A different `v` or corrupt data counts as empty. All storage
  access is in try/catch.
- `card.js`: `window.TlbxSupportCard`. Builds the card. Reads the brand data through `setBrand()`.
- `support.js`: `window.TlbxSupport`. The rules above. Loads the brand data once (`TlbxBrand.ready` when `brand.js` is on
  the page, otherwise `brand/brand.json` is fetched).
- `support.css`: the card's styles, injected by `support.js`.

## Script order (every app that calls it)
```html
<script src="../shared/consent/config.js"></script>        <!-- for the ads row -->
<script src="../shared/consent/state.js"></script>
<script src="../shared/consent/consent-mode.js"></script>
<script src="../shared/support/state.js"></script>
<script src="../shared/support/card.js"></script>
<script src="../shared/support/support.js"></script>
```
Put these before the app's own scripts. `state.js` works out the site root from its own `src`.

## The call in each app
One line on the success path (after the download starts):
```js
TlbxSupport.afterExport('imageeditor');   // any export: image, document, data, video
```
For a long video render, Video Editor also tracks the render:
```js
const sup = TlbxSupport.trackRender('videostudio', prog.box);   // when the render starts (prog.box = progress dialog)
// ... when the render ends, in both the success and the error path:
sup.done();
```
Apps wired: Image Editor, Vector Editor, Video Editor (plus render tracking), Video Remix, Presentations, Documents, Spreadsheets,
Label Designer, Resizer, Background Remover. Upscaler has no `index.html` in this repo, so it is not wired.
Video Remix and Background Remover's video item have no progress dialog, so they show no card during a render (only after).

## How a fork turns each part off
All in `brand/brand.json`, no code change:
```json
"support": { "exportCard": true, "donate": true, "ads": true }
```
- `"exportCard": false`: no card at all (corner or in the progress dialog).
- `"donate": false`: the Donate button is hidden. The Patreon link in Settings is unaffected.
- `"ads": false`: the ads slider and the ad slot are hidden. Ads never load from the card. (Settings keeps its
  own ads switch: to remove ads completely, also leave `adsensePublisherId` empty in `shared/consent/config.js`.)
Only a real `false` hides a part. Missing, malformed or other values keep it on. `TlbxBrand.config.support` shows
the flags in use. The defaults are all true.

## Consent rules
- Nothing third party loads until the visitor turns ads on. The card's ads slider only calls `TlbxConsent`, and
  `TlbxConsent` loads AdSense only after the `ads` category is granted.
- The card's text says analytics and ads are off by default.
- The card itself makes no network request except the `brand.json` fetch (same site) and the Patreon link when the
  visitor clicks it.

## Limits
- Offline single-file builds: the Helper drawing is a dynamic `import()` of a module next to the page. If that fails,
  the Helper canvas is hidden and the rest of the card still works. Without `brand.json`, Donate is hidden.
- Storage blocked: no card at all.

## Tests (`node tests/run.mjs support`)
- `tests/node/support-brand.test.mjs`: the brand flags. Defaults on, each flag false hides only that part, other
  values keep it on, the shipped `brand.json` has the block.
- `tests/support/card.test.html`: the first-export rule, the corner position (not a modal), Donate (new tab, the
  Patreon URL from `brand.json`), "No thanks" (stored, no card after on any app), the × (not stored), the ads slider
  (Off by default, On writes `ads: true` to `tlbx-consent`, Turn off writes `ads: false`), and the long-render card
  inside the host (closing it does not break `done()`, a short render shows nothing, no card after "No thanks").
- `tests/support/imageeditor-export.test.html`: loads Image Editor, runs a real PNG export: the corner card appears, a
  second export does not repeat it. The ads slider in that card writes the consent record.
