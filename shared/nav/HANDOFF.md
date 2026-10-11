# Navigation presets (window.TlbxNav)

One place that decides how the mouse, trackpad, touch and keyboard move and zoom a canvas. Each app
supplies only a small adapter (its zoom, pan, fit and actual functions); the engine never touches app data.
Classic scripts, no build step, no network.

## Presets

| id | name | summary |
| --- | --- | --- |
| `tlbx` | Tlbx (default) | plain wheel zooms around the pointer, Shift+wheel pans sideways, Space or middle drag pans, pinch zooms, two-finger drag pans |
| `photoshop` | Photoshop-style | Alt+wheel zooms, plain wheel scrolls, Space drag pans, Ctrl/⌘ +/- zooms, Ctrl/⌘ 0 fits, Ctrl/⌘ 1 is 100%, Ctrl/⌘+Space+click zooms in |
| `illustrator` | Illustrator-style | Ctrl/⌘+wheel zooms, plain wheel scrolls, Space drag pans, hold H to pan, Ctrl/⌘ +/- zooms, Ctrl/⌘ 0 fits |
| `figma` | Figma-style | Ctrl/⌘+wheel zooms, plain wheel pans, trackpad pinch zooms, Shift+1 fits, Shift+0 is 100% |
| `custom` | Custom | each binding set by the person, saved per app (starts from Tlbx) |

## Data shape

A preset is `{ id, name, blurb, custom?, bindings }`. `bindings` has exactly these keys
(`TlbxNav.validate.KEYS`):

| key | values |
| --- | --- |
| `zoomWheel`, `panWheel` | `'plain' \| 'ctrl' \| 'alt' \| 'shift' \| 'off'` (`ctrl` is Ctrl or ⌘). Zoom and pan may not use the same modifier. |
| `spacePan`, `middlePan`, `touchPan` | `true` / `false` |
| `pinch` | `'zoom' \| 'off'` (touch pinch and trackpad pinch) |
| `fitKey`, `actualKey`, `handKey`, `clickZoomKey` | a combo string, or `''` for none |
| `zoomInKeys`, `zoomOutKeys` | an array of up to 4 combos, `[]` for none |

A combo is modifiers and one key joined by `+`: `Mod` (Ctrl or ⌘), `Alt`, `Shift`, then the key
(`0`-`9`, `A`-`Z`, `=`, `-`, `[`, `]`, `Space`). `Ctrl`, `Cmd` and `Meta` are read as `Mod`. The stored
spelling is canonical (`Mod+Shift+=` becomes `Mod+=`, since `=` and `-` ignore Shift).
Validation rejects unknown keys, values outside the list, bad combos, and two bindings on one combo.

## Files

- `presets.js` built-in presets as data (`TlbxNav.presets`)
- `validate.js` `validate(bindings)` never throws, returns `{ ok, value, errors }` (`TlbxNav.validate`)
- `logic.js` pure decisions: `wheelAction`, `keyAction`, `clashes` (`TlbxNav.logic`)
- `describe.js` plain-English lines and the modal's choices (`TlbxNav.describe`)
- `store.js` active preset and Custom bindings per app in `localStorage['tlbx-nav']` (`TlbxNav.store`)
- `engine.js` DOM side: wheel, pointer, touch and keys for one host (`TlbxNav.engine.attach`)
- `pad.js` the modal's try-it pad
- `modal.js` the dialog (`TlbxNav.modal.open`)
- `index.js` glue: `TlbxNav.attach(app, { host, adapter, title, shortcuts })`, `TlbxNav.openModal(app)`, `TlbxNav.shortcutsFrom(titles)`
- `nav.css` styles for the dialog and the pad

## Adapter

An adapter is `{ zoomAt(factor, x, y), panBy(dx, dy), fit(), actual(), zoomStep?(dir, x, y), cancelStroke?() }`.
Coordinates are host-relative pixels. `cancelStroke` runs when a second finger lands during an app stroke.

## Precedence

The engine listens on `window` in the capture phase. While a preset is attached it takes the wheel over
the host, the middle button, Space, and any key the active preset binds, and stops those events. A
preset therefore wins over the app's own wheel, Space and shortcut handling. Keys it does not bind pass
through untouched. Typing in an input, or a dialog being open, is never taken.

## Clashes

`TlbxNav.shortcutsFrom({ fit: 'Fit on Screen', ... })` reads the app's commands from TlbxCmd by title. The
modal reports a preset key that another command uses for a different action. The preset still wins while
it is active. Same-action keys are not clashes (PhotoTLBX's Ctrl+0 and the Photoshop preset's Ctrl/⌘ 0).

## Adoption

- PhotoTLBX: `imageeditor/js/app/nav-adapter.js` (attaches itself; `view.js` is unchanged). Edit ▸ Preferences ▸ Navigation…, command palette "Navigation preset…". Script tags and the stylesheet are in `imageeditor/index.html`.
- Vector Editor: `vector/js/ui/nav-adapter.js`. Edit ▸ Preferences ▸ Navigation…, and the command palette ("Navigation…", action `edit.nav`).
- Not yet: 3D Modeller, Cutout, Gallery viewer, Slides canvas, Label canvas, Press canvas, VideoEdit monitor, and Paint Classic. Each needs one adapter file and its script tags.

## Store API (for the profile page)

The Settings page section should read and change presets through `TlbxNav.store` only:

- `TlbxNav.store.get(app)` returns `{ preset, custom }`. `custom` is `{ from, bindings }` or `null`.
- `TlbxNav.store.resolve(app)` returns the active preset with its bindings.
- `TlbxNav.store.setPreset(app, id)` and `TlbxNav.store.setCustom(app, bindings, fromId)` return `{ ok, errors }`.
- `TlbxNav.store.clearCustom(app)` and `TlbxNav.store.subscribe(fn)`.
- `TlbxNav.openModal(app)` opens the same dialog as the menu.

## Not done

- Profile hook: the per-app section under `shared/profile/` (TlbxProfile) should call `TlbxNav.store` (`get`, `setPreset`, `setCustom`) to show and change the preset, and `TlbxNav.openModal(app)` for the full dialog.
- Other apps listed under Adoption are not wired.
- Touch pinch on PhotoTLBX and Vector runs through the engine only when `pinch` or `touchPan` is on. Other apps have not been tested on a touch screen.
- The clash list compares the preset's keys with the keys the app's commands report through TlbxCmd. Keys the app handles outside TlbxCmd (e.g. raw key handlers) are not in that list.
- Trackpad pinch is detected as a wheel event with Ctrl, which is how Chrome, Edge and Firefox report it. Safari's gesture events are not used.
