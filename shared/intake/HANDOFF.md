# shared/intake: one way in, one way out (window.TlbxIntake, window.TlbxOuttake)

The owner's rule: **one way only** for getting files into an app, and one way for getting them out. Every source of files
ends in `TlbxIntake.take(files, { source })`, runs one pipeline, and reaches the one reader the app registered. Every
"Open in…" / "Send to" / "Save to Files" menu is made by one builder, `TlbxOuttake.items`.

## Files (load in this order, before the app's own scripts)

| File | What | Pure? |
|---|---|---|
| `rules.js` | `TlbxIntake.rules` (also `TlbxDrop.rules`): `check(file, rules)` with the reason, `acceptAttr`, `describe` (toast words), `dragLabel`, `size`, `ext`. Moved here from shared/drop. | yes (Node tests) |
| `normalize.js` | `TlbxIntake.normalize(input)` → `File[]` from a File, FileList, array, DataTransfer (drop), clipboard data (a paste, also `<img src="data:…">`), a Files record `{ id, name, type, blob }` (kept as `file.tlbxDrive`), a converted result `{ name, blob }`, a Blob, a data: URL, a launch file handle, or a Promise of these. `dataUrlFile`, `toFile`, `listOf`, `pool(items, n, fn)` (bounded pool). | yes |
| `pipeline.js` | `TlbxIntake.createPipeline(env)`: register / spec / take, the steps below. The page's side comes in as `env`. | yes |
| `intake.js` | The page's one pipeline: the events, the first-use notice (shared/firstrun), the Add or New question (`TlbxIntake.choose`, a TlbxUI dialog `.si-choose`), the feedback (the drop zone's rows, else a toast). `register`, `take`, `on`, `view`, `accepts`, `acceptAttr`, and the old paste-only `attach`. | no |
| `sources.js` | The adapters: paste (one listener per page), `pick`, `fromDrive`, `launch` (?drive= and launchQueue), `fromConvert`, `sample`, `dropTarget`. | no |
| `outtake.js` | `TlbxOuttake`: the one "Open in…" builder (after shared/hub.js; `TlbxHub.openIn` and `TlbxHub.sendMenuItems` are it). | no |

Pages: `<script>` tags for rules, normalize, pipeline, intake, sources (in that order) where the page has files coming in;
`shared/drop/panel.js` and `drop.js` after them for a drop zone; `outtake.js` right after `shared/hub.js`.
`shared/convert/load.js` loads them for the Convert dialog; `shared/offline/manifest.js` lists them for offline copies.

## The pipeline (one per `take()`; a single file is a batch of one)

1. **normalize** the source's input to Files.
2. **accept**: the spec's rules (`accept: { types, exts, noun, maxBytes, any, allowEmpty }`) or `accept(file)` → true |
   false | 'reason'; `except(file)` leaves some to the app's own path (its clipboard copies). Refusals keep their reason
   ("notes.txt is not a picture"). `route(files, batch)` → the files kept (the app hands the rest to another spec or a dialog).
3. event **`tlbx:intake-before`** (cancelable: `preventDefault()`, or return false from `TlbxIntake.on('before', fn)`).
4. **gates, in order**: the first-use notice (`notice: { title, lines, downloads }`, once per batch whatever the source);
   the count and size limits (`limit`, `maxTotal`); **Add to <open doc> or New** when `hasOpen()` is true (one dialog,
   `labels` to word it; skipped when the source gave `mode`; `ask: ['paste', …]` limits it to some sources); the app's
   `gate(batch)` → false stops.
5. **`before(batch)`** → batch | File[] | false.
6. **process**: `process(file, ctx)` over the files, `concurrency` at once (default 1), or a whole-batch reader:
   `onAdd(files, ctx)` / `onNew(files, ctx)` for the chosen mode, `processAll(files, ctx)`. `ctx = { source, mode, at,
   index, data, batch, signal, progress(0..1), drive }` (`drive`: the Files record the file came from). A thrown
   Error is that file's reason. Event **`tlbx:intake-file`** after each file (`file`, `ok`, `result`, `error`).
7. **`after(results, batch)`**, the feedback (the zone's rows and toast through `TlbxIntake.view(id, …)`, else a toast;
   `toast: false` for a spec that reports itself), event **`tlbx:intake-after`** (`files`, `results`, `summary`).

Batches for one spec run one after another (drops during a batch queue up). `take()` resolves the summary
`{ app, source, mode, added: [{ name, value, file }], skipped: [{ name, reason }], refused, cancelled }`.

## The app spec (registered once)

```js
TlbxIntake.register({
  id: 'myapp',                       // take() without `to` goes to the page's main spec (main: false for a part)
  accept: { types: ['image/*'], exts: ['.heic'], noun: 'a picture' },
  driveAccept: ['image/*'],          // the Drive picker's types (default: accept.types)
  notice: { title, lines, downloads },   // optional first-use notice
  hasOpen: () => doc.open, openName: () => doc.name, labels: { add: 'Add to current', new: 'Create new' },
  process: async (file, ctx) => addItem(file, ctx.mode),   // or onAdd / onNew / processAll
  after: (results, batch) => {}, concurrency: 1,
  paste: true, first: false, toast: true,
});
```

Parts of an app with files of their own (a watermark logo, brushes, a backup, a macro's test PDF) are specs of their own
(`main: false, paste: false`), reached with `TlbxIntake.pick({ to: 'myapp.logo' })`.

## Sources (every one calls take)

| Source | Call | `source` |
|---|---|---|
| a drop on the app's zone / targets (with the zone UI, outlines, rows) | `TlbxDrop.attach(zone, { intake: 'myapp', targets, mode?(e), data?(e), files?(dt, e) })` | drop |
| the zone's Choose files | (the zone) | picker |
| File ▸ Open, Ctrl+O, Insert from file, an "Open…" button | `TlbxIntake.pick({ to, mode, data, multiple, accept })` | picker |
| a drop on a plain area (no zone UI) | `TlbxIntake.dropTarget(el, { to, mode?(e), data?(e) })` | drop |
| a paste | automatic: the first spec (paste ≠ false) that takes the file | paste |
| Open from Files | `TlbxIntake.fromDrive({ to, mode, title })` | drive |
| ?drive=<id> (another app's Send to… / Open in…), PWA `launchQueue` (manifest `file_handlers`) | `TlbxIntake.launch({ to, mode })` once the app is ready | launch |
| the Convert dialog's results handed back | `TlbxIntake.fromConvert(outputs, { to, mode })` | convert |
| Try it with a sample | `TlbxIntake.sample(files or fn, { to, mode })`, or the zone's `sample` option | sample |
| code (tests, an app API) | `TlbxIntake.take(files, { to })` | api |

## Extension points

- Events on `document`: `tlbx:intake-before` (cancelable), `tlbx:intake-file`, `tlbx:intake-after`; detail `{ app,
  source, mode, files, … }`. `TlbxIntake.on('before' | 'file' | 'after', fn, { app })` → off. Shared features (Workflows'
  "Add to a workflow", recent files, Helper) listen here without touching apps.
- `TlbxIntake.view(id, { begin, refuse, row, end })`: a feedback view for a spec (TlbxDrop registers its zone).

## TlbxDrop on top (shared/drop)

`TlbxDrop.attach(zone, o)` is the drop zone UI and the drop, Choose files and sample source. With `o.intake` it is the UI of
a registered spec. Without it (the apps not migrated yet) it registers a spec from `o` (`accept`, `process(file, progress,
ctx)`, `begin`, `done`, `limit`, `paste`), so the old callers work unchanged and already go through the pipeline.
`TlbxIntake.attach({ accept, hasOpen, openName, onAdd, onNew, first })` (paste only) is a spec too.
`TlbxDropChoice.ask` asks the same intake question; `TlbxDropChoice.zones` are the drop places that give a drop its mode.

## One way out: TlbxOuttake (outtake.js)

```js
TlbxOuttake.items({ get: () => blob, name: 'x.png', type: 'image/png', from: 'myapp', verb: 'Open in', folder: true })
TlbxOuttake.menu(buttonOrPoint, o); TlbxOuttake.button(o, { label: 'Open in…' }); TlbxOuttake.send('upscale', o)
TlbxOuttake.handover({ from: 'cutout', to: 'imageeditor', types: ['image/*'], replaces: true, label: 'Send to Image Editor as a layer', run: async (ctx) => { … } })
TlbxOuttake.extend((ctx) => [{ label: 'Add to a workflow…', act }])
```

Items, in order: the app's registered handovers (richer, and `replaces` the plain item of that target), every registry app
that takes the type (`TlbxHub.appsAccepting`; the file goes to Files and the target opens on ?drive=<id>, where its
`TlbxIntake.launch` takes it), the shared features' items (`extend`, and `tlbx:outtake` listeners with `phase: 'items'` →
`detail.add(item)`), then "Save to Files…". Workflows comes in one way: when the page has `shared/ops/entry.js`
(loaded after outtake.js), its `TlbxWorkflowEntry.menuItems` gives "Run a workflow…" and "Add to a workflow…", and the
plain "Open in Workflows" (the registry says it takes images and PDFs) is left out so it is not listed twice.
`items(o)` gives no separators (menus that do not draw them); `menu()` and `button()` add them. After a file went out: `tlbx:outtake` with `phase: 'sent'` (`from, to,
type, name, id`). `TlbxHub.openIn(o)` is `items`; `TlbxHub.sendMenuItems(getBlob, name, type, { folder })` is `items`
with the verb "Send to". Use the same items for the toolbar button, the More menu and the context menus.

## Rule 4 (tools/one-way.mjs, run by tools/check-rules.mjs)

In the apps listed in `STRICT` (now `pdf/`, `imageeditor/js/`, `convert/`, `gallery/`, `resize/`, `bgremover/`), app code may not add a
`drop` or `paste` listener, call `pickFiles`, make a file input, read ?drive= (`consumeLaunch`) or `launchQueue`, call
`pickFromDrive`, or build an "Open in"/"Send to" list by hand. A line that must stay (a tab dragged to a new place, text
pasted into a field) says why with an `// intake-ok: …` comment. When an app below is migrated, add its folder to
`STRICT`.

## Migrated (every entry point through take; duplicates deleted)

- **PDF Editor** (`pdf/js/ui/drop.js` spec `pdf`; parts `pdf.image` (paste-image.js), `pdf.logo` (watermark-panel.js),
  `pdf.images-to-pdf` (exports.js), `pdf.macro-test` (macro/ui.js)): drop on the stage / tab strip / a split pane (mode
  and data from the drop's place), the zone and Choose files, File ▸ Open, Insert pages from file (mode add, data.at),
  a pane's "Open a file", Open from Files, ?drive= launch, the Convert dialog's PDFs (`A.openConverted` →
  fromConvert), paste (a picture onto the page or a new PDF; any other file to `pdf`). Files PDF does not open go to
  the Convert dialog (`route`). Add to current or Create new is the intake's question (TlbxDropChoice.ask is gone from
  PDF). Out: File ▸ Send to and the page's Send page as image use TlbxHub.sendMenuItems (the builder).
- **Image Editor** (`imageeditor/js/app/intake.js`, spec `imageeditor`; parts `imageeditor.brushes`, `imageeditor.logo`,
  `imageeditor.layer-pictures` (io/config.js), `imageeditor.fx-preset` (layers/fx-preset-picker.js)): Open…, Place Image as
  Layer…, the tab bar's Open…, a drop (its zone gives the mode), a picture dragged from a web page, a paste (asks Add or
  New), Open/Place from Files, ?drive= launch, the welcome sample. The app's own `onPaste` is only its clipboard.
  `imageeditor/classic/` (the classic Paint edition, its own page) is not migrated: see the list below.
- **File Converter** (`convert/js/ui/tool.js`: one spec per tool, `convert` for the page's; the Convert dialog's tool is
  `main: false, paste: false` and unregisters when the dialog closes): the zone, Choose files, paste, the sample, the
  dialog's own files, `addFiles` (now a take), ?drive= / launch (mount.js). Out: the results' Open in… is
  `TlbxOuttake.button` (shared/convert/results.js).
- **Gallery** (`gallery/js/ui/main.js` spec `gallery`; part `gallery.backup`): a drop of files or folders
  (TlbxDrop.folders), Import (Ctrl+O), Import a folder, Import from Files, ?drive= launch, paste, the sample. Each
  photo is one `G.actions.importOne` (a duplicate is skipped with its reason). Out: TlbxHub.sendMenuItems.
- **Background Remover** (`bgremover/js/io/files.js`, spec `cutout`): see its section below (in is done, out is to do).
- **Resizer** (`resize/js/app/main.js` spec `resize`): a drop on the column or the zone, Choose files, Open
  (Ctrl+O), Open from Files, ?drive= launch, paste, the sample. Out: Send to Upscaler is `TlbxOuttake.send`.

PWA: `manifest.webmanifest` has `file_handlers` for these five; the files reach `TlbxIntake.launch` through launchQueue.

## Tests

- `node --test tests/node/intake-pipeline.test.mjs`: normalize, accept and reasons, gate order, notice once per batch,
  Add or New, route/before/after hooks, the bounded pool, events, specs, queueing, the view.
- `tests/node/drop.test.mjs`, `tests/node/drop-rules.test.mjs`: TlbxDrop on the pipeline, the rules.
- `tests/node/check-rules.test.mjs`: rule 4.
- `tests/intake/sources.test.html`: every source ends in the same process() with the same events; the notice once per
  batch whichever source; the gates. `tests/intake/intake.test.html`: the old paste API. `tests/intake/outtake.test.html`:
  the outbound builder. `tests/intake/resize.test.html`, `imageeditor.test.html`, `pdf.test.html`: the reference apps,
  every way in reaches the same reader with the same events, one notice per batch, the parts of their own. `tests/pwa/manifest.test.html`: the file handlers.

## How to migrate an app (mechanical)

1. Register the spec once at boot (`TlbxIntake.register`), with the reader the app already has as `process` (or
   `onAdd`/`onNew` when it reads a batch). Put "is something open" in `hasOpen`/`openName`.
2. `TlbxDrop.attach(zone, { intake: id, …the zone's look… })`; drop the zone's `accept`/`process`.
3. Replace every entry point in the list below: `TlbxUI.pickFiles` / file inputs → `TlbxIntake.pick({ to, mode })`;
   `TlbxHub.pickFromDrive` → `TlbxIntake.fromDrive`; `consumeLaunch` → `TlbxIntake.launch` (once ready); own drop and
   paste listeners → the zone, `TlbxIntake.dropTarget`, or nothing (paste is automatic); `TlbxIntake.attach` → the spec.
4. Delete what is left over (record → File helpers, the second "add files" path).
5. Out: hand-made "Open in"/"Send to" lists → `TlbxOuttake.items` / `menu` / `button`; app-specific handovers →
   `TlbxOuttake.handover`.
6. Add the folder to `STRICT` in `tools/one-way.mjs` and run `node tools/check-rules.mjs --all`; add the app to a
   `tests/intake/<app>.test.html` like resize's.

## Still to migrate (found by grepping; tick as done)

### bgremover: in is migrated (spec 'cutout', `bgremover/js/io/files.js`); out is still to do

In (done, after wip/isolate-batch): every route is a source of the intake and the spec's reader (`processAll`) hands the
whole batch to `CO.files.take` at once, which keeps the app's one first-use gate (`F.gate`) and its one add
(`CO.process.add`); the accept rules are `F.ACCEPT`. Open (`CO.files.open` → `TlbxIntake.pick`), the sample
(`TlbxIntake.sample`), Open from Files (`TlbxIntake.fromDrive`, both menus), ?drive= (`TlbxIntake.launch`; a file
Image Editor sent keeps its origin and request), the drop zone on #workspace and #queue (`TlbxDrop.attach({ intake:
'cutout' })`), paste. `bgremover/` is in rule 4's STRICT list. `tests/bgremover/intake.test.html` checks it.
Out: three overlapping menus become one `TlbxOuttake.items({ from: 'cutout', type: 'image/png', … })` used by the toolbar
"Open in…", More ▸ Send to and the context menu: `bgremover/js/ui/openin.js` (a hand-kept list of Image Editor and Tlbx
Vector; Upscaler is missing), More ▸ "Send to" (`menus.js`, sendMenuItems), and "Send cut-out to Image Editor as a new
layer". Its two richer handovers are `TlbxOuttake.handover`s:
- `{ from: 'cutout', to: 'imageeditor', replaces: true, label: 'Send to Image Editor as a layer (with its mask)' }`
  (the layer round trip in `bgremover/js/io/send.js` and `imageeditor/js/io/isolate.js`);
- `{ from: 'cutout', to: 'videoedit', types: ['video/*'], replaces: true, label: 'Send to Video Editor as a colour + matte pair' }`.

### 3d

- [ ] file input: `3d/js/app/configio.js:28`
- [ ] pickFiles: `3d/js/app/files.js:93`
- [ ] pickFiles: `3d/js/app/files.js:97`
- [ ] Drive picker: `3d/js/app/files.js:103`
- [ ] ?drive= launch: `3d/js/app/files.js:114`
- [ ] drop listener: `3d/js/app/outliner.js:100`

### admin

- [ ] file input: `admin/index.html:134`

### ai

- [ ] ?drive= launch: `ai/js/app/main.js:24`
- [ ] drop listener: `ai/js/ui/chat.js:29`
- [ ] pickFiles: `ai/js/ui/chat.js:52`
- [ ] Drive picker: `ai/js/ui/chat.js:53`
- [ ] pickFiles: `ai/js/ui/chatlist.js:80`
- [ ] out: Open in/Send to label: `ai/js/ui/ctxmenu.js:23`
- [ ] Drive picker: `ai/js/ui/drive.js:21`
- [ ] out: sendTo: `ai/js/ui/launcher.js:11`
- [ ] pickFiles: `ai/js/ui/launcher.js:15`
- [ ] out: sendTo: `ai/js/ui/launcher.js:17`
- [ ] out: Open in/Send to label: `ai/js/ui/launcher.js:22`
- [ ] Drive picker: `ai/js/ui/launcher.js:23`
- [ ] out: Open in/Send to label: `ai/js/ui/launcher.js:23`
- [ ] file input: `ai/js/ui/models.js:112`
- [ ] out: Open in/Send to label: `ai/js/ui/workspace.js:104`

### aitools

- [ ] drop listener: `aitools/denoise/denoise.js:47`
- [ ] file input: `aitools/denoise/index.html:21`
- [ ] file input: `aitools/ocr/index.html:23`
- [ ] drop listener: `aitools/ocr/ocr.js:73`
- [ ] file input: `aitools/portrait/index.html:21`
- [ ] drop listener: `aitools/portrait/portrait.js:67`
- [ ] file input: `aitools/speech/index.html:24`
- [ ] drop listener: `aitools/speech/speech.js:71`
- [ ] file input: `aitools/tags/index.html:21`
- [ ] drop listener: `aitools/tags/tags.js:84`

### calendar

- [ ] pickFiles: `calendar/js/ui/ics-ui.js:29`
- [ ] TlbxDrop.attach: `calendar/js/ui/ics-ui.js:39`

### checksum

- [ ] file input: `checksum/index.html:42`
- [ ] drop listener: `checksum/js/checksum.js:81`

### clean

- [ ] pickFiles: `clean/js/app/main.js:82`
- [ ] drop listener: `clean/js/app/main.js:91`
- [ ] ?drive= launch: `clean/js/app/main.js:103`

### code

- [ ] Drive picker: `code/js/main.js:14`
- [ ] ?drive= launch: `code/js/main.js:94`
- [ ] drop listener: `code/js/tree.js:53`
- [ ] hub listener: `code/js/tree.js:61`
- [ ] out: Open in/Send to label: `code/js/viewers.js:75`
- [ ] out: sendTo: `code/js/viewers.js:80`

### contacts

- [ ] TlbxDrop.attach: `contacts/js/app/drop-import.js:32`
- [ ] drop listener: `contacts/js/app/groups.js:67`
- [ ] pickFiles: `contacts/js/app/io-dialogs.js:31`
- [ ] ?drive= launch: `contacts/js/app/main.js:14`
- [ ] pickFiles: `contacts/js/app/photo-ui.js:60`

### crm

- [ ] pickFiles: `crm/js/ui/form-parts.js:69`

### docs

- [ ] Drive picker: `docs/js/ui/files.js:93`
- [ ] out: sendMenuItems: `docs/js/ui/files.js:157`
- [ ] paste listener: `docs/js/ui/input.js:62`
- [ ] ?drive= launch: `docs/js/ui/main.js:47`
- [ ] out: Open in/Send to label: `docs/js/ui/menus.js:35`

### drive

- [ ] hub listener: `drive/js/app/main.js:51`
- [ ] ?drive= launch: `drive/js/app/main.js:62`
- [ ] file input: `drive/js/core/io.js:40`
- [ ] out: sendTo: `drive/js/core/io.js:116`
- [ ] TlbxDrop.attach: `drive/js/ui/dnd.js:95`
- [ ] out: Open in/Send to label: `drive/js/ui/info.js:39`
- [ ] out: Open in/Send to label: `drive/js/ui/info.js:40`
- [ ] out: Open in/Send to label: `drive/js/ui/menus.js:63`
- [ ] out: sendTo: `drive/js/ui/newdoc.js:29`
- [ ] out: Open in/Send to label: `drive/js/ui/quicklook.js:21`

### effects

- [ ] pickFiles: `effects/js/app/io.js:27`
- [ ] Drive picker: `effects/js/app/io.js:39`
- [ ] pickFiles: `effects/js/app/io.js:53`
- [ ] Drive picker: `effects/js/app/io.js:133`

### eml

- [ ] pickFiles: `eml/js/actions.js:17`
- [ ] out: Open in/Send to label: `eml/js/commands.js:29`
- [ ] out: sendTo: `eml/js/export-ui.js:49`
- [ ] out: Open in/Send to label: `eml/js/export-ui.js:71`
- [ ] out: Open in/Send to label: `eml/js/export-ui.js:110`
- [ ] out: sendMenuItems: `eml/js/export-ui.js:122`
- [ ] TlbxDrop.attach: `eml/js/main.js:37`
- [ ] ?drive= launch: `eml/js/main.js:64`
- [ ] out: Open in/Send to label: `eml/js/side.js:26`
- [ ] out: Open in/Send to label: `eml/js/side.js:39`
- [ ] out: Open in/Send to label: `eml/js/side.js:63`

### expenses

- [ ] file input: `expenses/index.html:88`

### hex

- [ ] pickFiles: `hex/js/actions.js:114`
- [ ] out: Open in/Send to label: `hex/js/actions.js:119`
- [ ] TlbxDrop.attach: `hex/js/main.js:34`
- [ ] ?drive= launch: `hex/js/main.js:69`

### html2pdf

- [ ] file input: `html2pdf/index.html:42`
- [ ] file input: `html2pdf/index.html:54`
- [ ] drop listener: `html2pdf/js/app.js:107`

### img3d

- [ ] file input: `img3d/index.html:45`
- [ ] out: sendTo: `img3d/js/app/export.js:75`
- [ ] drop listener: `img3d/js/app/main.js:169`
- [ ] Drive picker: `img3d/js/app/main.js:172`
- [ ] ?drive= launch: `img3d/js/app/main.js:194`

### inventory

- [ ] file input: `inventory/index.html:228`
- [ ] file input: `inventory/js/ui/import.js:22`

### invoices

- [ ] file input: `invoices/index.html:177`
- [ ] out: Open in/Send to label: `invoices/js/ui/reminder.js:23`

### label

- [ ] TlbxDrop.attach: `label/js/ui/boot.js:36`
- [ ] out: Open in/Send to label: `label/js/ui/commands.js:76`
- [ ] pickFiles: `label/js/ui/configs-dlg.js:69`
- [ ] pickFiles: `label/js/ui/datadlg.js:6`
- [ ] pickFiles: `label/js/ui/export.js:48`
- [ ] pickFiles: `label/js/ui/export.js:87`
- [ ] out: Open in/Send to label: `label/js/ui/form.js:46`
- [ ] ?drive= launch: `label/js/ui/hub.js:12`
- [ ] Drive picker: `label/js/ui/hub.js:30`
- [ ] Drive picker: `label/js/ui/hub.js:43`
- [ ] Drive picker: `label/js/ui/hub.js:48`
- [ ] out: sendMenuItems: `label/js/ui/hub.js:56`
- [ ] out: sendMenuItems: `label/js/ui/hub.js:57`
- [ ] pickFiles: `label/js/ui/interact.js:205`
- [ ] out: Open in/Send to label: `label/js/ui/keys.js:21`
- [ ] out: Open in/Send to label: `label/js/ui/keys.js:100`
- [ ] paste listener: `label/js/ui/keys.js:119`
- [ ] out: Open in/Send to label: `label/js/ui/menus.js:23`
- [ ] out: Open in/Send to label: `label/js/ui/menus.js:57`
- [ ] pickFiles: `label/js/ui/props-types.js:90`

### ledger

- [ ] file input: `ledger/index.html:88`
- [ ] file input: `ledger/index.html:180`

### music

- [ ] ?drive= launch: `music/js/app/main.js:38`
- [ ] pickFiles: `music/js/ui/library.js:100`
- [ ] pickFiles: `music/js/ui/library.js:101`
- [ ] TlbxDrop.attach: `music/js/ui/library.js:104`
- [ ] Drive picker: `music/js/ui/playlists.js:117`

### notes

- [ ] pickFiles: `notes/js/blocks.js:78`
- [ ] paste listener: `notes/js/editor.js:97`

### ocr

- [ ] file input: `ocr/index.html:51`
- [ ] TlbxDrop.attach: `ocr/js/app.js:191`

### orders

- [ ] file input: `orders/index.html:130`

### paste

- [ ] pickFiles: `paste/js/actions.js:74`
- [ ] paste listener: `paste/js/main.js:20`

### imageeditor

- [ ] Drive picker: `imageeditor/classic/hub.js:22`
- [ ] ?drive= launch: `imageeditor/classic/hub.js:37`
- [ ] file input: `imageeditor/classic/index.html:140`
- [ ] drop listener: `imageeditor/classic/paint/17-files.js:59`
- [ ] paste listener: `imageeditor/classic/paint/17-files.js:65`
- [ ] file input: `imageeditor/index.html:93`

### press

- [ ] paste listener: `press/js/edit/clipboard.js:65`
- [ ] paste listener: `press/js/edit/text.js:137`
- [ ] Drive picker: `press/js/io/hub.js:18`
- [ ] Drive picker: `press/js/io/hub.js:22`
- [ ] out: sendMenuItems: `press/js/io/hub.js:48`
- [ ] out: sendMenuItems: `press/js/io/hub.js:49`
- [ ] ?drive= launch: `press/js/io/hub.js:57`
- [ ] pickFiles: `press/js/io/place.js:86`
- [ ] pickFiles: `press/js/io/project.js:69`
- [ ] out: Open in/Send to label: `press/js/ui/commands.js:68`
- [ ] TlbxDrop.attach: `press/js/ui/main.js:21`
- [ ] out: Open in/Send to label: `press/js/ui/menus.js:9`
- [ ] drop listener: `press/js/ui/pages-panel.js:54`

### projects

- [ ] pickFiles: `projects/js/ui/files.js:39`
- [ ] TlbxDrop.attach: `projects/js/ui/files.js:56`

### purchases

- [ ] file input: `purchases/index.html:121`

### qr

- [ ] file input: `qr/js/panel-design.js:52`
- [ ] drop listener: `qr/js/panel-design.js:61`
- [ ] Drive picker: `qr/js/save.js:43`

### quotes

- [ ] file input: `quotes/index.html:121`

### remix

- [ ] file input: `remix/index.html:55`
- [ ] file input: `remix/index.html:123`
- [ ] drop listener: `remix/js/drop.js:40`
- [ ] drop listener: `remix/js/drop.js:56`
- [ ] out: sendTo: `remix/js/send.js:21`
- [ ] drop listener: `remix/js/ui.js:54`
- [ ] TlbxDrop.attach: `remix/js/ui.js:131`

### serials

- [ ] file input: `serials/index.html:45`
- [ ] drop listener: `serials/js/app.js:180`

### shared/backup

- [ ] pickFiles: `shared/backup/central-ui.js:85`
- [ ] pickFiles: `shared/backup/ui.js:41`

### shared/biz

- [ ] out: sendTo: `shared/biz/address-label.js:32`

### shared/buffer

- [ ] drop listener: `shared/buffer/buffer.js:68`

### shared/commands

- [ ] pickFiles: `shared/commands/recorder.js:79`

### shared/config

- [ ] pickFiles: `shared/config/dialog.js:24`
- [ ] TlbxDrop.attach: `shared/config/dialog.js:36`
- [ ] drop listener: `shared/config/dialog.js:139`
- [ ] Drive picker: `shared/config/io.js:88`

### shared/convert

- [ ] out: Open in/Send to label: `shared/convert/load.js:52`
- [ ] out: Open in/Send to label: `shared/convert/results.js:50`

### shared/doctabs

- [ ] Drive picker: `shared/doctabs/drive.js:57`
- [ ] drop listener: `shared/doctabs/tabs.js:84`

### shared/fonts

- [ ] file input: `shared/fonts/panel.js:71`
- [ ] file input: `shared/fonts/panel.js:139`
- [ ] drop listener: `shared/fonts/panel.js:146`

### shared/guides

- [ ] pickFiles: `shared/guides/panel-tabs.js:100`

### shared/hub.js

- [ ] out: sendTo: `shared/hub.js:174`
- [ ] out: Open in/Send to label: `shared/hub.js:185`
- [ ] ?drive= launch: `shared/hub.js:187`
- [ ] ?drive= launch: `shared/hub.js:188`

### shared/i18n

- [ ] out: Open in/Send to label: `shared/i18n/strings.js:32`

### shared/ops

- [ ] out: sendTo: `shared/ops/entry.js:29`

### shared/presets

- [ ] hub listener: `shared/presets/store.js:52`
- [ ] file input: `shared/presets/ui.js:37`

### shared/preview

- [ ] out: Open in/Send to label: `shared/preview/chrome.js:95`

### shared/seo

- [ ] out: Open in/Send to label: `shared/seo/guides/creative-2.mjs:74`
- [ ] out: Open in/Send to label: `shared/seo/guides/documents-2.mjs:118`

### shared/tlbxui.js

- [ ] pickFiles: `shared/tlbxui.js:249`
- [ ] file input: `shared/tlbxui.js:251`

### shared/sync

- [ ] file input: `shared/sync/ui.js:97`

### shared/tour

- [ ] out: Open in/Send to label: `shared/tour/tours/img3d.js:11`

### sheetview

- [ ] pickFiles: `sheetview/js/main.js:38`
- [ ] pickFiles: `sheetview/js/main.js:39`
- [ ] ?drive= launch: `sheetview/js/main.js:45`
- [ ] out: sendTo: `sheetview/js/main.js:63`
- [ ] TlbxDrop.attach: `sheetview/js/main.js:156`

### shell

- [ ] out: Open in/Send to label: `shell/switcher.js:38`

### signature

- [ ] file input: `signature/js/form.js:36`

### slides

- [ ] out: Open in/Send to label: `slides/js/ui/commands.js:42`
- [ ] out: Open in/Send to label: `slides/js/ui/ctxmenu.js:39`
- [ ] TlbxDrop.attach: `slides/js/ui/file-drop.js:15`
- [ ] Drive picker: `slides/js/ui/files.js:36`
- [ ] ?drive= launch: `slides/js/ui/main.js:24`
- [ ] pickFiles: `slides/js/ui/ops.js:38`
- [ ] drop listener: `slides/js/ui/sorter-drag.js:42`
- [ ] pickFiles: `slides/js/ui/templates-dialog.js:106`
- [ ] Drive picker: `slides/js/ui/templates-dialog.js:117`

### videostudio

- [ ] hub listener: `videostudio/js/io/cutout.js:50`
- [ ] pickFiles: `videostudio/js/io/project.js:55`
- [ ] ?drive= launch: `videostudio/js/io/session.js:53`
- [ ] drop listener: `videostudio/js/render/cells.js:81`
- [ ] out: sendTo: `videostudio/js/render/preview.js:102`
- [ ] out: Open in/Send to label: `videostudio/js/timeline/menu.js:23`
- [ ] drop listener: `videostudio/js/timeline/menu.js:146`
- [ ] out: Open in/Send to label: `videostudio/js/timeline/order.js:2`
- [ ] out: Open in/Send to label: `videostudio/js/timeline/order.js:33`
- [ ] pickFiles: `videostudio/js/ui/app.js:45`
- [ ] Drive picker: `videostudio/js/ui/app.js:48`
- [ ] drop listener: `videostudio/js/ui/app.js:107`
- [ ] TlbxDrop.attach: `videostudio/js/ui/app.js:117`
- [ ] drop listener: `videostudio/js/ui/templates-panel.js:59`
- [ ] drop listener: `videostudio/js/ui/templates-panel.js:97`
- [ ] pickFiles: `videostudio/js/watermark/panel.js:22`


### vectoreditor

- [ ] pickFiles: `vectoreditor/js/io/files.js:50`
- [ ] TlbxDrop.attach: `vectoreditor/js/io/files.js:56`
- [ ] Drive picker: `vectoreditor/js/io/hub.js:53`
- [ ] Drive picker: `vectoreditor/js/io/hub.js:57`
- [ ] out: sendMenuItems: `vectoreditor/js/io/hub.js:89`
- [ ] out: sendMenuItems: `vectoreditor/js/io/hub.js:90`
- [ ] out: sendTo: `vectoreditor/js/io/hub.js:98`
- [ ] ?drive= launch: `vectoreditor/js/io/hub.js:105`
- [ ] paste listener: `vectoreditor/js/tools/keys.js:109`
- [ ] out: Open in/Send to label: `vectoreditor/js/ui/actions.js:78`
- [ ] out: Open in/Send to label: `vectoreditor/js/ui/menus.js:22`
- [ ] out: Open in/Send to label: `vectoreditor/js/ui/props.js:118`

### sorter

- [ ] file input: `sorter/index.html:45`
- [ ] file input: `sorter/index.html:46`
- [ ] TlbxDrop.attach: `sorter/js/app.js:112`

### tables

- [ ] paste listener: `tables/js/ui/actions.js:121`
- [ ] Drive picker: `tables/js/ui/storage.js:68`
- [ ] pickFiles: `tables/js/ui/storage.js:86`
- [ ] ?drive= launch: `tables/js/ui/storage.js:137`
- [ ] pickFiles: `tables/js/ui/templates.js:174`
- [ ] Drive picker: `tables/js/ui/templates.js:180`

### transcribe

- [ ] file input: `transcribe/index.html:54`
- [ ] TlbxDrop.attach: `transcribe/js/app.js:101`

### upscale

- [ ] Drive picker: `upscale/js/app/drive.js:38`
- [ ] file input: `upscale/js/app/main.js:221`
- [ ] TlbxDrop.attach: `upscale/js/app/main.js:238`
- [ ] ?drive= launch: `upscale/js/app/main.js:270`

### watermark

- [ ] file input: `watermark/index.html:42`
- [ ] file input: `watermark/index.html:96`
- [ ] TlbxDrop.attach: `watermark/js/main.js:71`

### workflows

- [ ] ?drive= launch: `workflows/js/ui/app.js:27`
- [ ] pickFiles: `workflows/js/ui/library.js:105`
- [ ] out: sendMenuItems: `workflows/js/ui/run.js:104`
- [ ] out: Open in/Send to label: `workflows/js/ui/run.js:104`
- [ ] TlbxDrop.attach: `workflows/js/ui/run.js:158`
- [ ] drop listener: `workflows/js/ui/steps.js:145`

