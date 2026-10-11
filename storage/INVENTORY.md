# Browser storage inventory

Built for the "Export everything" work (shared/backup/central*.js). The storage audit agent's file was not in the
repo when this was written, so this list was made from a grep of the code (`indexedDB.open`, `localStorage` keys,
the store and key constants). Names marked "not read" were found by grep only and were not opened in detail.

Status: **in** = in the one-file export (`apps` or `settings`), **excluded** = never exported (secret or cache),
**out** = not in this format yet (own autosave or library of one app; still in that app).

## IndexedDB

| Database | Stores | Owner (file) | Status | Export app id |
|---|---|---|---|---|
| tlbx-data | settings, customers, products, orders, invoices, payments, accounts, journal, exchangeRates, stockMovements, stockCounts, numbering | shared/data/store.js | in | data (replace) |
| tlbx-drive | files, folders | shared/hub.js | in | drive |
| tlbx-drive-thumbs | thumbs | drive/js/core/thumb-cache.js | excluded: cache | |
| tlbx-gallery | photos, originals, thumbs, albums | gallery/js/core/db.js | in | gallery |
| tlbx-music | playlists | music/js/core/store.js | in | music (playlists only) |
| tlbx-music | analysis | music/js/core/store.js | excluded: cache of tags and waveforms | |
| tlbx-tables-templates | templates | tables/js/ui/template-store.js | in | tables |
| tlbx-tables-drafts | drafts | tables/js/ui/drafts.js | out: autosave | |
| tlbx-slides-templates | templates | slides/js/io/template-store.js | in | slides |
| slides draft DB (name in slides/js/io/draft.js) | draft store | slides/js/io/draft.js | out: autosave | |
| tlbx-docs | templates | docs/js/ui/files.js | in | docs (templates only) |
| tlbx-docs | drafts | docs/js/ui/files.js | out: autosave | |
| tlbx-session | kv | shared/session/session.js | in, optional (checkbox) | session |
| tlbx-sync | kv (tokens, encrypted) | shared/sync/tokens.js | excluded: secrets | |
| tlbx-sync-local | (local provider) | shared/sync/providers/local.js | excluded: sync, not read | |
| tlbx-code | drafts | code/js/drafts.js | out: autosave | |
| tlbx-ai | convs | ai/js/core/store.js | out: chat history of one app (not read in detail) | |
| tlbx-ai-bridge | (not read) | shared/ai/bridge.js | out (not read) | |
| tlbx-faces | results | shared/faces/cache.js | out: cache | |
| tlbx-pdf, labeldesigner, tlbxshop, videoedit, press (name in its store.js) | kv, media, docs | pdf, label, imageeditor, videoedit, press | out: each app's own files and autosave | |

## localStorage

| Key | Owner | Status |
|---|---|---|
| tlbx-profile | shared/profile/profile.js | in (settings, profile) |
| tlbx-consent | shared/consent/state.js | excluded: consent record and tokens |
| tlbx-sync, tlbx-sync-pending | shared/sync/config.js, sync.js | excluded: sync settings and queue |
| tlbx-backup-last | shared/backup/index.js | out (timestamp only) |
| tlbx-session.* | shared/session/session.js (mirror of the kv store) | covered by the session app through IndexedDB |
| tlbx-music.*, tlbx-drive.*, tlbx-docs.outline, tlbx-contacts.cc, tlbx-code.open-folders, tlbx-ai.*, tlbx-nav, tlbx-pwa.persist, tlbx-guard-off, videoedit.*, tlbxshop.*, tlbx-slides.*, tlbx-pdf.*, vectoreditor.autosave.v1, tlbxguides.presets.v1, tlbx.mascot.v1, tlbx.buddy, orders-editor | the apps listed | out: preferences and autosaves of each app |

## Known problems found while reading

- shared/sync/sync.js and shared/sync/ui.js call `TlbxData.exportAll()`, which does not exist. Cloud sync's backup
  therefore reports "Backup is not available in this app yet." This was there before the export work and is not fixed here.
- The Contacts app keeps its records in TlbxData's `customers` collection (contacts/js/app/records.js). They are
  exported with the `data` app, not separately.
- The Music app has no export for its analysis cache on purpose (it is rebuilt from the tracks).
