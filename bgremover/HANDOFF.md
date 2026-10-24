# Background Remover — handoff

On-device AI background removal. Engine in `shared/cutout/` (reusable by any app), app in `bgremover/`,
models in `vendor/models/`, ONNX Runtime Web in `vendor/onnxruntime-web/`. Module contract: `js/CONTRACT.md`.

## Status
- The app runs end to end: sample, open, Files, queue, Keep / Remove / Clear brush edits, undo and redo,
  look (edges, background, shadow, crop), export (PNG, WebP, JPG, zip). Registry status stays **beta**.
- Tests: `node tests/run.mjs bgremover` (engine, inference, app, sample, saved session) and
  `node tests/run.mjs mask-transfer` (node). Image Editor round trip: `node tests/run.mjs isolate-roundtrip`.

## Manual editing (checked in a browser)
- Keep / Remove strokes: the brush cursor follows the pointer, the edit map and the result change, the view does not
  move (zoom and pan stay put), undo / redo restore exactly, Clear brush edits is one undo step, export carries the edits.
- Fixed: the pointer capture on `#stage` swallowed clicks on the empty-state buttons ("Choose images", "Try a sample"),
  so the sample button did nothing (this also broke the sample test). `ui/pointer.js` now leaves button clicks alone.
- Fixed: a stroke end ran the full refresh twice (history push and a direct call). Now one.
- Cost: the full result (`VideoStudioout.finish`, with colour decontamination) takes several seconds at 1200×900,
  mostly `P.decontaminate`. During a stroke the picture follows the brush through `CO.process.live` (main thread,
  matte + brush only); the full result arrives after the stroke. Speeding up decontaminate is the next engine task.

## Image Editor integration (Isolate Subject, and back)
- Image Editor: `imageeditor/js/io/isolate.js`. Layer ▸ Isolate Subject… and the layer right-click item put the layer's
  pixels in Files with `meta: { requestId, intent: 'mask' }` and open Background Remover on it (`TlbxHub.sendTo`).
  The tab remembers `requestId → { docId, layerId, x, y, hadMask }` in memory.
- Background Remover: the file gets `item.request`. **Send back to Image Editor** (`#btnSendBack`, or More ▸ Send mask back)
  emits `bgremover:mask` {requestId, w, h, mask} on the Hub bus. Image Editor applies it to that layer as a layer
  mask (alpha = how much shows, one history step "Isolate Subject") and answers `imageeditor:mask-ack`.
- A layer that already has a mask asks first (before anything is sent). The mask is never added as a new layer.
- **Send to Image Editor as a new layer** (More ▸ …): `bgremover:layer` {requestId, blob, name} is added as a layer
  named "Cut-out" at the source layer's position (`imageeditor:layer-ack`).
- No reply within 3 s: the mask is saved to Files as a grey PNG; the cut-out opens in a new ImageEditor tab.
- Mask transfer helpers: `shared/cutout/mask-transfer.js` (`TlbxMaskTransfer`: fromAlpha, toAlpha, toGrey,
  fromGrey, applyAlpha). Covered by `tests/node/mask-transfer.test.mjs`.

## Not done / next
- Decontaminate speed (see above); a live preview that includes it.
- The send path uses the bus, so it needs the Image Editor tab open in the same browser profile to apply the mask
  directly; otherwise the Drive fallback applies.

## Video, Drive, bulk, Open in, saved work
- **Video** (`js/video/`): up to 30 s (10 s on phones), frames scaled to 720p; the matte runs per frame at 384 px on the long
  side, in the worker, and is smoothed over time (`smooth.js`, weight 0.35, first frame kept as it is). MP4/MOV is decoded
  with WebCodecs using Video Editor's demuxer (`videostudio/js/media/demux.js`, loaded on demand); other formats use a `<video>`
  element and seeks. Player on the stage: Play, scrub, Cut-out / Original, Cancel. Export: WebM with alpha
  (VP9 `alpha: 'keep'`, our EBML writer) or a PNG-frame zip when the browser cannot encode alpha (the UI says so);
  MP4 on a chosen background colour (H.264 or VP9). Unverified here: WebM with alpha (headless Chromium lacks alpha 'keep').
- **Drive** (`js/io/drive.js`): processed items are saved into the Drive folder "Background Remover": images as
  `-original`, `-mask.png`, `-result.png`; videos as `-original` and `-matte.mp4`, results on export. Open from Drive: images and videos.
- **Bulk** (`js/ui/bulk.js`): Ctrl/Cmd-click, Shift-click, Ctrl+A in the queue. With 2+ selected, the bar applies look,
  clear brush edits, re-run a model, export, or remove, one progress bar. Videos are skipped by those actions.
- **Open in** (`js/ui/openin.js`): Image Editor (`CO.send.layer`), Vector Editor (cut-out PNG), Video Editor (video, as a colour
  + matte MP4 pair in Drive). The mask is not made a Image Editor layer mask in one step (it goes through `send.js`).
- **Right-drag brush resize** (Keep/Remove): across = size, down = hardness, live readout; a drag never opens the menu.
  Maths in `shared/brush/resize.js`; Image Editor still has its own copy (`imageeditor/js/core/brush-resize.js`).
- **Live brush**: `CO.process.live(it, rect)` updates the matte and cut-out on the main thread every stroke step; the
  view tints the removed part. Test: `tests/bgremover/live.test.html`.
- **Saved work** (`js/ui/view-state.js`, TlbxSession, IndexedDB): finished images (file, model, look, edits, base mask) and
  finished videos (file and matte) come back without running the model. Unfinished items are not saved and not restarted.
  Settings and brush edits apply to the image on screen, or to the selection in bulk. Toolbar button "Clear saved work".
  Test: `tests/bgremover/persist.test.html`.
- Tests: `tests/node/bgremover-smooth.test.mjs`; `tests/bgremover/video.test.html` (2-second generated MP4: frames, model
  per frame, cancel, WebM or PNG export, MP4 background); `live.test.html`; `persist.test.html`.

## Phone layout (TlbxSheet)
Under 900 px the settings panel (`#props`) is a bottom sheet: `CO.sheet = TlbxSheet.attach(...)` in `js/ui/menus.js`
(`shared/ui/sheet.js`, see `shared/ui/HANDOFF.md`). The panel button (and View ▸ panel, `act.panel`) opens and closes it; the
shared ×, Escape, a tap outside and a swipe down close it. Before this the CSS had a `.sheet-open` sheet that nothing ever
opened, so the settings were out of reach on a phone; that CSS and the unused `.sheet-grip` are gone. On a wide screen the
button still hides the panel (`no-panel`). Test: `tests/bgremover/phone-sheet.test.html`.
