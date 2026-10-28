# shared/frame: the "List · View · Panel" pattern

One layout for every app that shows items one at a time and acts on them: mail (Email Viewer), files, records, attachments,
documents in a batch. People learn it once and find the same places in every app:

```
┌ header: Open (+ the shared header buttons, and the panel's own button) ────────────────┐
│ List (optional)      │ View (the item)                         │ Panel: details + actions │
│ search, sort, ticks  │                                         │ Title                    │
│ one row per item     │                                         │ ACTIONS  [Primary]       │
│                      │                                         │          [Export ▾] ...  │
│                      │                                         │ DETAILS  key  value      │
│                      │                                         │ FILES    name  Save  ▾   │
└──────────────────────┴─────────────────────────────────────────┴──────────────────────────┘
```

**When to use it.** The app opens several items, shows one, and has more actions than fit in a header. Keep only Open
(and the shared header buttons) in the header; every action goes in the panel, the File menu and the Ctrl+K commands
(the same functions: one source of truth). The list appears only when there is more than one item (`setList`).

**Phones** (`phone` media query, default `(max-width: 900px)`): the list is the page; tapping an item shows it over the
list (the app gives a "‹ List" button that calls `showList()`); the panel is a bottom sheet (shared/ui/sheet.js,
TlbxSheet: × in its corner, Escape, tap outside or swipe down closes it), opened by the header button or by the app's own
"Actions" button (`openSheet()`). With `phoneButton: false` the header button hides on phones (when the app has its own).

## The rule for every app: settings and the main button live in the right panel

Every app that has settings, a properties/inspector panel or a main action follows one layout, so people find things in
the same place everywhere:

1. **Right panel.** The settings (or properties, inspector, details) are in a panel on the RIGHT of the view. Lists and
   navigation (files, messages, albums, folders, a page rail, a toolbox) are on the LEFT.
2. **The main button is in that panel**, at its foot (`panel.footer()`), always in reach: "Upscale", "Resize all",
   "Read text", "Export"… While it runs it becomes Cancel. The result's actions (Download, Save to Files, Open in…
   through TlbxOuttake) are a section of the same panel.
3. **The header keeps only Open** (and From Files…) plus the shared header buttons and the panel's show/hide button.
4. **Phones** (≤900 px): the list is the page; the panel is a TlbxSheet bottom sheet. When the panel has a footer, the
   closed sheet still shows the footer at the bottom of the screen (the main button and a "Settings" button that opens
   the whole sheet), so the main button is never hidden.
5. **Big editors** (Image Editor, PDF Editor, Vector Editor, Video Editor, Page Layout, Label Designer, 3D Modeller…) keep their own panel
   code but follow the same placement: their properties/inspector on the right, their primary action (Export,
   Download, Print) in that panel's foot as well as in the File menu, and TlbxSheet on phones. Not a rewrite.

Tool apps use TlbxFrame directly:

```js
const fr = TlbxFrame.mount(root, { list, view, panel, panelLabel: 'upscale.panel.settings', storageKey: 'upscale', button: '.up-tools', phoneButton: false });
// panelLabel / listLabel: an i18n key (translated, and again on a language change: the button, the panel's aria-label, the
// sheet's × and the resize handles follow), a function, or plain text (TlbxI18n.label)
const p = TlbxFrame.panel(panel, { title: 'Upscale' });
p.render([
  { title: 'Size', settings: sizeGroupEl },            // the app's own controls (ids, listeners and values stay)
  { title: 'Output', settings: [formatField, qualityField] },
  { title: 'Result', actions: [{ label: 'Download', run }, { label: 'Open in…', menu: () => TlbxOuttake.items(o) }] },
]);
p.footer([{ id: 'up-run', label: 'Upscale 2 pictures', primary: true, run }], { note: 'Ctrl+Enter upscales', more: 'Settings' });
```

- `settings` moves the app's elements into the section (render() re-appends the same nodes), so call `render()` when
  the panel's shape changes (a file added, a result done), not on every input; call `footer()` on every state change.
- Styles for the controls inside: `.sf-field` (label + control, full width), `.sf-lab`, `.sf-seg` (a row of equal
  buttons, `aria-pressed="true"` is the chosen one), `.sf-note`.
- With a footer the panel is a column and the footer is `position: sticky; bottom: 0`; its height is in `--sf-foot-h` on
  the frame's root (frame.css leaves that much room under the page on phones).
- A footer in the bottom of the window also sets `--tlbx-foot-h` on `<html>` (the room from its top to the window's
  bottom; a `tlbx-foot` event on window when it changes): the consent card (shared/consent/banner.css, phones) and the
  buddy's button (shared/buddy/boot.js, until moved) sit above it, so nothing floats over the main button.
  Test: `tests/consent/sheet-foot.test.html`.

## Resizing side panels (every app)

Every side panel is resized one way: `shared/ui/resize-panel.js` (TlbxResizePanel). A handle on the panel's inner edge
(drag, or focus it and use Left/Right, Shift for bigger steps, Home/End; a double-click puts the default back), min and
max widths per panel, nothing on phones. The width is kept in the site's settings store (`TlbxProfile.panelSize(app,
panel)`, shared/profile/profile.js) and applied when the panel is attached, so an app that attaches before its first
paint shows it at once. "Reset panel sizes" is one TlbxCmd command, `view.resetPanels`; put it in the app's View menu.
Users: TlbxFrame (the panel and the list: `frame-panel`, `frame-list`; every app above), Assistant's side panel
(shared/ai/panel.js, `ai`), Image Editor's panels column, PDF Editor's and Background Remover's properties. An app whose grid comes
from shared/layouts passes `sizeVars` so the layout's column follows the width. Tests: `tests/shared/resize-panel.test.html`.

## API

```html
<link rel="stylesheet" href="…/shared/frame/frame.css">
<script src="…/shared/ui/sheet.js"></script>        <!-- the phone sheet -->
<script src="…/shared/ui/menubutton.js"></script>   <!-- menus on panel buttons ("Export ▾") -->
<script src="…/shared/frame/frame.js"></script>
<script src="…/shared/frame/panel.js"></script>
```

```js
const fr = TlbxFrame.mount(rootEl, {
  list: listEl, view: viewEl, panel: panelEl,        // list may be null; the order in the DOM does not matter
  phone: '(max-width: 900px)', panelLabel: 'Actions', storageKey: 'eml',
  button: '.smb-tools', phoneButton: true,           // the show/hide button in the header (a shared .tlbx-hbtn)
  width: 300, min: 240, max: 520,
});
fr.setList(n > 1); fr.showView(); fr.showList(); fr.openSheet(); fr.setPanel(false); fr.togglePanel(); fr.setWidth(320);

const panel = TlbxFrame.panel(panelEl, { title: 'Message' });
panel.setTitle('3 selected');
panel.render([
  { title: 'Actions', actions: [{ label: 'Export', primary: true, menu: () => [{ heading: 'Download' }, { label: 'PDF', act }] },
                                 { label: 'Print', run: print }] },
  { title: 'Details', rows: [['From', from], ['Date', date, rawDate]] },         // empty values are skipped
  { title: 'Attachments (2)', list: [{ name, meta: 'PDF · 2 KB', open: preview,
      actions: [{ label: 'Save', run }, { label: 'Open in', menu: () => TlbxHub.sendMenuItems(...) }] }] },
  { title: 'Note', note: 'Text' },
]);
```

- **Remembered** per `storageKey` in localStorage (`tlbx-frame:<key>`): the panel's width and whether it is hidden.
- **Command**: `<storageKey>.panel`, "Show or hide the … panel", Ctrl+Alt+B (TlbxCmd, registered by `mount` when the
  page has TlbxCmd). Put `cmd:<storageKey>.panel` in the View menu.
- **Resize**: drag the panel's edge, or focus it (a `role=separator`) and use Left/Right (Shift: bigger steps), Home, End.
- **Look**: the panel follows PDF Editor's properties panel (sticky title, small upper-case section headings, label/value
  rows, buttons that wrap). Colours are the theme's `--sl-*` tokens; `--sf-list-w` sets the list column (320px).
- `render()` keeps the keyboard focus on the same button across redraws (give actions an `id` for a stable key).
- `footer(actions, { more, note, stack })` is the one footer API (there is no `setFooter`): `{ stack: true }` puts the
  primary button on its own row with the others wrapping below, as in Watermark ("Watermark 3 files", Download,
  Save to Files…). `[]` removes it.

## Users

- Email Viewer (`eml/js/main.js` mounts it; `eml/js/side.js` fills the panel; `eml/js/list.js` is its list).
- Workflows (`workflows/js/ui/mount.js`; the run panel is `workflows/js/ui/run.js`).
- Upscaler (`upscale/js/app/layout.js`: settings sections and the Upscale footer).
- Resizer (`resize/js/app/layout.js`: no list column, the queue is the view).

## Tests

`tests/shared/frame.test.html` (on `tests/shared/frame-page.html`): regions and order, drag and key resize with limits,
hide/show by button, command and Ctrl+Alt+B (remembered across a reload), no list, phone list/view and the bottom sheet,
panel sections, menus and focus, settings sections and the footer (the phone's closed sheet shows only the footer).
Guard: `tests/node/right-panel.test.mjs` checks that every app marked done in the audit below loads TlbxFrame and puts
its main button in the panel. Upscaler: `tests/upscale/panel.test.html`. Resizer: `tests/resize/panel.test.html`. Email Viewer: `tests/eml/batch.test.html`, `tests/eml/look.test.html`.

## Screens (described)

- 1280 px: list 340 px on the left (tick box, sender, date, subject, paperclip count), the message in the middle, the
  panel 300 px on the right: "Message" with Actions (Export ▾ filled, then Open in PDF Editor, Print, Convert to PDF…,
  Pin as a tab, Close), Details, Attachments with Save and Open in ▾. With two or more ticked: "N selected" with Combine
  into one PDF, Export ▾, Save attachments (ZIP), Export list (CSV), Open in PDF Editor, Clear selection.
- 390 px: the list fills the page with an Actions button next to the sort; a tapped message shows "‹ Messages (10)" and
  "Actions" above it; Actions slides the panel up as a bottom sheet.

## Audit: every app against the rule

Status: **done** (follows the rule; checked by `tests/node/right-panel.test.mjs`: a tool or viewer mounts TlbxFrame and,
for a tool, its main button is in the panel's footer; an editor, or a viewer/records app that already had its own right panel, keeps that panel and takes the shared footer), **close** (panel already on the right, the
main button still elsewhere), **to do**, **n/a** (no settings and no main action: the rule has nothing to move).
Kind: tool (open → settings → run → save), editor, records (list + form), viewer, other.

| App | Folder | Kind | Layout before | Status | What is left |
|---|---|---|---|---|---|
| Upscaler | upscale/ | tool | settings LEFT, Upscale in the header | done | |
| Email Viewer | eml/ | viewer | TlbxFrame | done | |
| Workflows | workflows/ | tool | TlbxFrame, run panel right | done | |
| Resizer | resize/ | tool | settings right, Resize all + downloads in the header | done | |
| Watermark | watermark/ | tool | settings right, run/download in an app bar | done | rebuilt on TlbxFrame (watermark/js/main.js): files left, the preview, the watermark panel right; Watermark N files (primary), Download, Save to Files… and Open in… at its foot (stack); a phone bottom sheet |
| Background Remover | bgremover/ | editor | queue left, #props right; Download, Send back in the header | done | Send back, Open in… and Download at the settings panel's foot (the shared footer); one main button: Download (Export N pictures (ZIP) with two or more selected), the Export section keeps Export all; the closed phone sheet shows them; #props resizable |
| OCR | ocr/ | tool | settings row above the work area, Read in it | done | the model prompt shows before the tool, as before |
| Transcription | transcribe/ | tool | controls above, list left, text right | done | the file list stays in the view, left of the transcript |
| Screen Recorder | recorder/ | tool | new: stage centre, settings right, Record at the panel's foot | done | |
| Metadata Remover | clean/ | tool | choices panel right, Copy and clean in the header | done | |
| HTML to PDF | html2pdf/ | tool | settings LEFT, Print in the header | done | |
| Image to 3D | img3d/ | tool | settings LEFT, Send in the header | done | |
| Email Signature | signature/ | tool | form LEFT, preview right, Copy under the preview | done | |
| QR Code Generator | qr/ | tool | editor LEFT, preview right, downloads under it | done | Save to Drive, Open from Drive and Copy to buffer stay in its app bar (Drive actions, like Open) |
| Colours | colors/ | tool | new: TlbxFrame from the start | done | the colour, its values (type in any format, the others follow) and Copy in the main view (js/values.js); the panel holds only the settings (harmony, scale, picture, export format), Download palette at its foot with Save to Files…, Copy code and Open in… |
| Font Creator | fontcreator/ | other | new: TlbxFrame from the start (an editor on the tool layout) | done | the glyph grid is the list, the editor, Kerning and Type test the view; the panel holds the glyph's spacing, characters, handwriting sheet, export, names and metrics, Download font at its foot with Save to Files…, Save project and Open in… |
| Document Scanner | scan/ | other | new: TlbxFrame from the start | done | the pages are the list, the page (its result or its corners) the view; the panel holds the page's look, brightness and contrast, the PDF's size, margins, quality and OCR, Download PDF at its foot with Open in PDF Editor, Save as pictures and Open in… (Download PDF and More on a phone) |
| Motion Graphics | effects/ | editor | properties right, Render in the header | done | its own panel and TlbxSheet, the shared footer (bare) |
| Checksum | checksum/ | tool | three stacked cards, Copy under the hash | done | |
| Compare | diff/ | tool | new: A and B and the result in the view | done | Compare and Export at the panel's foot; the settings and the report's Save and Open in in the panel |
| Serial Counter | serials/ | tool | one column, bar + actions | done | |
| Photo Sorter | sorter/ | tool | one column, Start and downloads in bars | done | the view filters stay above the photos |
| File Converter | convert/ | tool | tool built in JS, one column | done | js/ui/frame.js: files left, results right, Convert + Clear in the panel footer; the Convert dialog (compact) keeps one column |
| AI Tools | aitools/ (+ ocr, speech, denoise, tags, portrait) | tool | each tool one column | done | one module for the five pages (aitools/frame.js, data-side marks); the hub is a list of tools |
| Video Remix | remix/ | editor | bin left, settings right, Remix in the panel | done | Remix and Export in the options panel's footer; the panel is a phone bottom sheet whose closed state shows them |
| Image Editor | imageeditor/ | editor | toolbox left, panels right, Export in the header | done | Export at the panels' foot; the top bar fits the app's width (container query, More ▾) beside the Assistant panel |
| Vector Editor | vectoreditor/ | editor | toolbar left, dock right, no main button | done | Export ▾ at the dock's foot (the File ▸ Export actions); the dock is a drawer on phones |
| PDF Editor | pdf/ | editor | rail left, properties right, Download in the header | done | Download at the properties panel's foot (the shared footer); its own phone sheet (openClass) shows the footer above the rail while closed; properties resizable (shared/ui/resize-panel.js) |
| Label Designer | label/ | editor | toolbox left, dock right, Print in the header | done | Print at the dock's foot (the shared footer) |
| Video Editor | videostudio/ | editor | bin left, inspector right, Export in the header | done | Export at the inspector's foot (the shared footer); the inspector is a phone bottom sheet whose closed state shows Export |
| Page Layout | press/ | editor | toolbar left, dock right, Export PDF in the control bar | done | Export PDF… at the dock's foot; the dock is a drawer on phones |
| Presentations | slides/ | editor | slides left, inspector right, Save in the header | done | Save and Present at the inspector's foot (the shared footer); the closed phone sheet shows them; File ▸ Save and Ctrl+S too |
| 3D Modeller | 3d/ | editor | outliner left, properties right, Save in the header | done | Save at the Properties foot (the shared footer) |
| Documents | docs/ | editor | outline left, no inspector | done | a Document panel on the right (docs/js/ui/panel.js: file, page, download and send; resizable), Save and PDF at its foot; a phone bottom sheet; the outline stays left |
| Spreadsheets | tables/ | editor | sheets and objects list LEFT | n/a | the left column is a list (sheets, charts, pivots), which the rule keeps on the left; no settings panel |
| Code Editor | code/ | editor | file tree left, preview right | n/a | an IDE: tree left is a list; no settings panel |
| Music Player | music/ | other | tags/playlists left | n/a | navigation only |
| Files | drive/ | viewer | places left, info right, New in the header | done | its own info panel takes the shared footer (bare: ui/info-foot.js): Open in…/Download, Restore/Delete forever, with a phone peek; New stays in the header as Drive's Open |
| Gallery | gallery/ | viewer | albums/filters/import left | done | js/ui/panel.js: selection, add photos and library tools on the right, Import photos at its foot; albums and filters stay left |
| Spreadsheet Viewer | sheetview/ | viewer | options in the header | done | js/panel.js: Look (style, colours) and Open in Spreadsheet on the right, Export at its foot |
| Hex Editor | hex/ | viewer | one column | done | js/panel.js: Inspector (file facts) on the right, Save version + Download at its foot; Go to and Find stay above the bytes |
| Invoices | invoices/ | records | list, document, ws-panel right; Save in the header | done | the details are TlbxBiz.panel (shared/biz/panel.js through shared/docs/doc-layout.js): Save draft and Issue… (or the status's main button) at its foot; a bottom sheet ≤720 px; Print stays in the record bar |
| Orders | orders/ | records | ws-panel right | done | Save and Confirm order / Fulfil… at the record panel's foot (shared/biz/panel.js); New order stays in the list and the File menu |
| Quotes | quotes/ | records | ws-panel right | done | Save and Mark as sent at the record panel's foot; a bottom sheet on phones |
| Purchase Orders | purchases/ | records | ws-panel right | done | Save and Place order at the record panel's foot; a bottom sheet on phones |
| Contacts | contacts/ | records | groups left, list, card right | done | Edit, Duplicate, Delete (Cancel, Save in the form) at the card's foot (the shared footer, bare); on a phone the card is a TlbxSheet bottom sheet over the list (js/app/card.js), its footer at its foot; × closes the contact |
| CRM | crm/ | records | filters left | done | the customer's record beside the list (shared/layouts) with Edit details and Delete customer at its foot (the shared footer, bare); on a phone a TlbxSheet bottom sheet over the tab it was opened from (js/ui/app.js), × closes it |
| Projects | projects/ | records | timeline, undated tasks right | done | a task opens in the TlbxFrame panel right of the board, timeline or list (projects/js/ui/task-panel.js), Cancel, Delete and Save at its foot; project settings stay a dialog |
| Timesheets | timesheets/ | records | tabs, one-column form | done | an open entry is the panel right of the list (TlbxBiz.panel.records), Save at its foot |
| Expenses | expenses/ | records | tabs, one-column form | done | an open expense is the panel right of the list (TlbxBiz.panel.records), Record expense / Mark as paid… at its foot |
| Inventory | inventory/ | records | tabs, one column | done | Receive, Sell, Adjust, Transfer: one form at a time in the stock view's right panel (TlbxBiz.panel.form), one main button at its foot (#sApply, named after the form; the palette's Stock commands choose the form there); the product form is the products view's right panel (js/ui/product-form.js), Create product / Save at its foot; bottom sheets on phones; Count and Scan unchanged |
| Ledger | ledger/ | records | tabs, one column | done | the new entry, account and rate forms are their view's right panel (TlbxBiz.panel.form), Post entry / Add account / Add rate at its foot |
| Reports | reports/ | other | one column | done | the report is the view; picker, definition and Export CSV (at the foot) in the TlbxFrame panel (reports/js/layout.js); shared/finder's classes are .fd-* (no clash with TlbxFrame's .sf-*), so Reports has no overrides |
| Assistant | ai/ | other | chat, workspace pane right | n/a | a chat: the composer is the main action |
| Notes | notes/ | other | notebooks left, list, editor | n/a | no settings |
| Paste | paste/ | other | list left, main | n/a | no settings |
| Node Calculator | nodes/ | other | canvas only | n/a | a canvas; Save is in the menu bar |
| Calculator | calculator/ | other | tape right | n/a | not a settings app |
| World Clock | time/ | other | tabs | n/a | |
| Calendar | calendar/ | other | one view | done | js/ui/panel.js: the day's events, display choices and calendar file on the right, New event at its foot; the event editor opens in the same panel (Cancel, Delete, Save at its foot; a bottom sheet on phones, closing it cancels) |
| To-do | todo/ | other | lists left | n/a | navigation left; add form in the list |
| Reminders | reminders/ | other | one column | n/a | |
| Admin | admin/ | other | tabs | n/a | settings pages themselves |
| AI Text Detector | (home page) | experiment | | n/a | |
| Paint Classic | imageeditor/classic/ | experiment | legacy | n/a | kept as it is |
