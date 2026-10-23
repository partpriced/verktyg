# Browser storage inventory

Every place the site keeps the person's data in their browser: IndexedDB databases and object stores, and
localStorage keys. Each app's own autosave, drafts and preferences are included. Rules for changing any of
them are in [HANDOFF.md](HANDOFF.md). "Unknown" means the code was not read far enough to name it.

Totals at the time of writing (2026-10-11, working tree):

- 19 IndexedDB databases with 36 object stores (the app databases), plus one generic opener in
  `shared/backup/core.js` (opens the databases named in a backup) and the third-party WebLLM model cache
  (`vendor/web-llm`, not app data).
- 49 localStorage rows below: 39 single keys (18 of them theme keys) and 10 key families (a prefix or an `<app>` suffix).
- Contacts drafts: `contacts/js/store/drafts.js` (database `tlbx-contacts-drafts`, store `drafts`, key `current`)
  was deleted in commit c94e877. No code opens it now. A device that still has that database keeps it
  untouched; nothing reads it. Listed under "Retired" at the end.

Versions: "v" is the value passed to `indexedDB.open` (IndexedDB), or the envelope version `v` (localStorage).

## IndexedDB: TlbxData (`tlbx-data`, shared/data)

Version 5 (`DB_VERSION` in `shared/data/store.js`). v2 adds `exchangeRates`, v3 `customerGroups` and `customerTags`, v4
`events`, `tasks` and `reminders`, v5 `expenses`. Every step only creates the stores that are missing (`createStores`), so a
database of any earlier version keeps all of its records; `tests/storage/upgrade.test.html` opens a v1 database and checks
every collection exists after the upgrade. TlbxData's collections are listed in `schema-defs.js`.

| Owner | Store | Version | Record format | Read by | Upgrade |
|---|---|---|---|---|---|
| shared/data | settings (key `id`, singleton `main`) | 2 | record; base currency is `defaultCurrency` (v1 called it `currency`) | shared/data, invoices, orders, ledger, inventory, crm, settings | v1 `currency` moved once in `seedDefaults`; tested |
| shared/data | customers | 2 | record with stage, categories, phones, emails, addresses | shared/data, contacts, crm, invoices, orders | create-only upgrade; tested |
| shared/data | products | 2 | record with sku, ean, prices | shared/data, inventory, invoices, orders | create-only upgrade |
| shared/data | orders | 2 | record with lines, status | shared/data, orders | create-only upgrade |
| shared/data | invoices | 2 | record with lines, status, payments | shared/data, invoices, ledger | create-only upgrade |
| shared/data | payments | 2 | record | shared/data, invoices | create-only upgrade |
| shared/data | accounts (key `code`) | 2 | chart of accounts record | shared/data, ledger | create-only upgrade; default chart seeded if missing |
| shared/data | journal | 2 | ledger entry with lines, currency, rate | shared/data, ledger | create-only upgrade |
| shared/data | exchangeRates | 2 | rate row (base, quote, date, rate); added in v2 | shared/data (fx), ledger | new in v2; created on upgrade |
| shared/data | stockMovements | 2 | stock movement record | shared/data, inventory | create-only upgrade |
| shared/data | stockCounts | 2 | count record | shared/data, inventory | create-only upgrade |
| shared/data | numbering (key `id`) | 2 | sequence record | shared/data (numbering) | create-only upgrade; default sequences seeded if missing |
| shared/data | customerGroups, customerTags | 3 | label records (name, colour) | shared/data, crm, contacts | new in v3; created on upgrade |
| shared/data | events, tasks, reminders | 4 | calendar event, to-do task and reminder records | shared/data, calendar, todo, reminders, crm | new in v4; created on upgrade |
| shared/data | expenses | 5 | expense record (date, supplier, account, amount, tax, method, status); posted with its journal entry | shared/data (expenses), expenses, ledger, reports | new in v5; created on upgrade |

## IndexedDB: other databases

| Owner | Database / store | Version | Record format | Read by | Upgrade |
|---|---|---|---|---|---|
| shared/hub.js (Files) | `tlbx-drive` / files | 2 | file record `{ id, name, type, size, from, time, folderId, starred, trashedAt, meta, blob }` | every app through TlbxHub, Files | v1 to v2 normalises each record with a cursor (no test yet) |
| shared/hub.js (Files) | `tlbx-drive` / folders | 2 | folder record `{ id, name, parentId, ... }` | Files, TlbxHub | created if missing |
| drive/js/core/thumb-cache.js | `tlbx-drive-thumbs` / thumbs | 1 | cached thumbnail by file id | Files | create-if-missing |
| shared/session/session.js | `tlbx-session` / kv | 1 | session values (large values only here; small ones mirrored to localStorage) | shared/session, apps that save sessions | create-if-missing |
| shared/sync/tokens.js | `tlbx-sync` / kv | 1 | cloud sync tokens | shared/sync | create-if-missing |
| shared/sync/providers/local.js | `tlbx-sync-local` / handles (key `dir`) | 1 | folder handle for local sync | shared/sync | create-if-missing |
| shared/cutout/loader.js | `tlbx-cutout` / files | 1 | model file bytes (fallback when the Cache API is unavailable) | Cutout, shared/cutout | create-if-missing |
| ai/js/core/store.js | `tlbx-ai` / convs | 1 | chat conversation `{ id, title, updated, messages }` | Assistant | create-if-missing; index `updated` |
| tables/js/ui/template-store.js | `tlbx-tables-templates` / templates | 1 | template `{ id, ... }` | Spreadsheets | create-if-missing |
| tables/js/ui/drafts.js | `tlbx-tables-drafts` / drafts (key `current`) | 1 | autosaved workbook | Spreadsheets | create-if-missing |
| videoedit/js/core/util.js | `videoedit` / kv | 1 | autosaved project | Video Editor | create-if-missing |
| videoedit/js/core/util.js | `videoedit` / media | 1 | imported files as Blobs (keyPath `id`) | Video Editor | create-if-missing |
| label/js/io/files.js | `labeldesigner` / kv | 1 | label design autosave | Label Designer | create-if-missing |
| press/js/core/store.js | `tlbx-press` / docs (key `autosave`) | 1 | autosaved layout project | Page Layout | create-if-missing |
| slides/js/io/draft.js | `tlbx-slides` / drafts (key `last`) | 1 | autosaved deck | Presentations | create-if-missing |
| slides/js/io/template-store.js | `tlbx-slides-templates` / templates | 1 | saved slide template | Presentations | create-if-missing |
| gallery/js/core/db.js | `tlbx-gallery` / photos | 1 | photo record `{ id, name, type, size, sha, w, h, takenAt, fav, liked, tags, addedAt, driveId }` | Gallery (library.js) | create-if-missing; indexes `sha`, `takenAt`; a record with no `tags` loads as `[]` (tested) |
| gallery/js/core/db.js | `tlbx-gallery` / originals | 1 | `{ id, blob }` original bytes | Gallery | create-if-missing |
| gallery/js/core/db.js | `tlbx-gallery` / thumbs | 1 | `{ id, blob }` JPEG, long edge 320 px | Gallery | create-if-missing |
| gallery/js/core/db.js | `tlbx-gallery` / albums | 1 | `{ id, name, photoIds, time }` | Gallery | create-if-missing |
| imageeditor/js/io/save.js | `tlbxshop` / kv | 1 | saved document (Imageeditor) | Imageeditor | create-if-missing |
| docs/js/ui/files.js | `tlbx-docs` / drafts (keyPath `key`, `d:<id>` or `untitled`) | 2 | `{ key, ...draft }` autosave | Documents | v1 had drafts only; v2 adds templates only when `oldVersion < 2` |
| docs/js/ui/files.js | `tlbx-docs` / templates | 2 | template `{ id, ... }` | Documents | added in v2 |
| pdf/js/core/util.js | `tlbx-pdf` / kv | 1 | autosaved PDF session | PDF Editor | create-if-missing |
| shared/backup/core.js | any database named in a backup (generic) | caller | whatever the database holds | Backup and restore | opens by name, with a version from the backup manifest; creates an empty shell only when it has no stores |

## localStorage: shared (shared/)

Keys marked "unversioned" have no envelope. Their readers accept a missing or partial object (defaults).

| Owner | Key | Version | Record format | Read by | Upgrade |
|---|---|---|---|---|---|
| shared/profile | `tlbx-profile` | envelope v1 | `{ v: 1, data: { <app>: { <key>: value } } }` | every app through TlbxProfile; Settings | v1 envelope; the flat object before it is still read (tested) |
| shared/theme | `tlbx-profile` (app `theme`, key `mode`) | envelope v1 (same key as above) | `system` (default, stored as no override), `light`, `dark`, `classic` or `lime` | shared/theme (every page), Settings | the choice is the default when unset; the app keys below are the fallback for a person who chose before it existed (tested) |
| shared/consent | `tlbx-consent` | record `version` = policy version (config.js, now 2) | `{ version, timestamp, categories: { necessary, analytics, ads, rates } }` | consent banner, Settings, rates-ecb, ledger rates | old policy records are kept; they are asked again and shown as the default (tested) |
| shared/nav | `tlbx-nav` | envelope v1 | `{ v: 1, apps: { <app>: { preset, custom: { from, bindings } \| null } } }` | every app through TlbxNav.store; Settings | v1; unknown preset ids fall back to ITpris without rewriting (tested) |
| shared/sync/config.js | `tlbx-sync` | unversioned | `{ <provider>: { clientId, lastSync } }` | shared/sync | unversioned; missing fields take defaults |
| shared/backup/index.js | `tlbx-backup-last` | unversioned scalar | ms timestamp string | Backup | unversioned scalar |
| shared/pwa.js | `tlbx-pwa.persist` | unversioned scalar | `granted` or `denied` | PWA storage prompt | unversioned scalar |
| shared/guard.js | `tlbx-guard-off` | unversioned scalar | `'1'` or absent | Guard (keep-my-files) | unversioned scalar |
| shared/session/session.js | `tlbx-session.<key>` (prefix) | unversioned | JSON value mirrored from IndexedDB (under 200,000 characters) | shared/session | unversioned; IndexedDB is the source |
| shared/ai/webllm.js | `tlbx-ai.local-models` | unversioned | JSON array of local model entries | Assistant | unversioned array |
| shared/buddy/prefs.js | `tlbx.buddy` | unversioned | `{ apps: { <app>: bool } }` plus global switches | Buddy | unversioned; `apps` defaults to `{}` |
| shared/buddy/store.js | `tlbx.mascot.v1` | key suffix v1 | `{ xp, hats, ... }` | Buddy (XP and levels) | key suffix v1 |
| shared/commands/keymap.js | `tlbx.keys.<app>` | unversioned | shortcut map per app (format not read in full) | every app's keyboard map | unversioned; a missing binding takes the default |
| shared/guides/presets.js | `tlbxguides.presets.v1` | key suffix v1 | custom guide presets, each `{ name, tab, form? \| notation? \| intervals?, unit?, snap? }` | Guides panel | key suffix v1 |
| shared/guides | `tlbxguides.state` and `tlbxguides.state.<app>` | unversioned | guide panel state | Guides panel | unversioned; `deepAssign` onto defaults |

## localStorage: apps

The 18 theme keys below are written by `shared/theme/theme.js` whenever the person picks a theme in Settings (JSON string, or the `theme` field of `tlbx-ai.prefs`, or a plain string for `vectoreditor.theme`). The value is the app's own name for the theme (`pro` for Dark; `system` where the choice follows the operating system, which the app ignores). An app keeps its own value when it differs from the choice, so a theme changed in that app's menu stays on that page.

| Owner | Key | Version | Record format | Read by | Upgrade |
|---|---|---|---|---|---|
| drive/js/core/util.js | `tlbx-drive.prefs` | envelope v1 | `{ v: 1, data: { view, usageMode, sorts, cols, info, tree, collapsed } }` | Files | v1 envelope; the flat object from before envelope (and before `sorts`, `cols`) still loads (tested) |
| drive/js/core/io.js | `tlbx-drive.openIn` | unversioned | map from file type to remembered app id | Files "open with" | unversioned map |
| drive/js/ui/info-width.js | `tlbx-drive.info-width` | unversioned scalar | width in px | Files info panel | unversioned scalar |
| drive/js/ui/shell.js and drive/index.html | `tlbx-drive.theme` | unversioned (JSON string) | `'light'`, `'classic'` or `'pro'` | Files, first paint | unversioned; unknown values fall back |
| shared/ai/panel.js, ai/js/core/util.js | `tlbx-ai.prefs` | unversioned | JSON object `{ theme, ... }` | Assistant, first paint | unversioned; `load()` returns `{}` on error |
| ai/js/core/engine.js | `tlbx-ai.fake-cache` | unversioned | JSON cache object | Assistant (test sandbox) | unversioned; reads `{}` on error |
| ai/index.html | `tlbx-ai.theme` (inside `tlbx-ai.prefs`) | unversioned | see above | first paint | see `tlbx-ai.prefs` |
| admin/index.html | `tlbx-admin.theme` | unversioned (JSON string) | `'light'` or `'pro'` | Admin | unversioned |
| cutout/js/core/util.js | `tlbx-cutout.<key>` (prefix: panel, model, brush, look, export) | unversioned | JSON per key | Cutout | unversioned; `U.store.get` returns the default on error |
| cutout/index.html | `tlbx-cutout.theme` | unversioned (JSON string) | theme name | Cutout, first paint | unversioned |
| videoedit/js/core/util.js | `videoedit.<key>` (prefix) | unversioned | JSON per key (export options etc.) | Video Editor | unversioned |
| videoedit/index.html | `videoedit.theme` | unversioned (JSON string) | theme name | Video Editor, first paint | unversioned |
| imageeditor/js/core/util.js | `tlbxshop.<key>` (prefix) | unversioned | JSON per key | Imageeditor | unversioned |
| slides/js/core/util.js | `tlbx-slides.<key>` (prefix) | unversioned | JSON per key | Presentations | unversioned |
| pdf/js/core/util.js | `tlbx-pdf.<key>` (prefix; includes `signatures`) | unversioned | JSON per key; saved signatures are an array | PDF Editor, Sign | unversioned; signature list defaults to `[]` |
| pdf/index.html | `tlbx-pdf.theme` | unversioned (JSON string) | theme name | PDF Editor, first paint | unversioned |
| watermark/js/settings.js | `tlbxwatermark.setup` | envelope v1 | `{ v: 1, data: { cfg, logo } }`, where logo is `{ name, dataUrl }` (under 500 KB) or null | Watermark | v1 envelope; a missing, corrupt or other-version record means the defaults |
| docs/js/ui/outline.js | `tlbx-docs.outline` | unversioned | outline open state | Documents | unversioned |
| docs/index.html | `tlbx-docs.theme` | unversioned (JSON string) | theme name | Documents, first paint | unversioned |
| tables/index.html | `tlbx-tables.theme` | unversioned (JSON string) | theme name | Spreadsheets, first paint | unversioned |
| crm/index.html | `tlbx-crm.theme` | unversioned (JSON string) | theme name | CRM, first paint | unversioned |
| invoices/index.html | `tlbx-invoices.theme` | unversioned (JSON string) | theme name | Invoices, first paint | unversioned |
| orders/index.html | `tlbx-orders.theme` | unversioned (JSON string) | theme name | Orders, first paint | unversioned |
| contacts | none | none | Contacts has no theme key; it follows the operating system and its own `data-theme` (light or dark), set by shared/theme | Contacts | n/a |
| contacts/js/app/state.js | `tlbx-contacts.cc` | unversioned scalar | default country code for phone numbers (E.164), per viewer | Contacts | unversioned scalar; `''` on error |
| ledger/index.html | `tlbx-ledger.theme` | unversioned (JSON string) | theme name | Ledger, first paint | unversioned |
| press/index.html | `tlbx.press.theme` | unversioned (JSON string) | theme name | Page Layout, first paint | unversioned |
| press/js/core/store.js | `tlbx.press.<key>` (prefix) | unversioned | JSON prefs | Page Layout | unversioned |
| gallery/index.html | `tlbx-gallery.theme` | unversioned (JSON string) | theme name | Gallery, first paint | unversioned |
| 3d/index.html | `tlbx-3d.theme` | unversioned (JSON string) | theme name | 3D Modeller, first paint | unversioned |
| inventory/index.html | `tlbx-inventory.theme` | unversioned (JSON string) | theme name | Inventory, first paint | unversioned |
| vector/index.html | `vectoreditor.theme` | unversioned scalar | theme name | Vector Editor, first paint | unversioned |
| vector/js/ui/color.js | `vectoreditor.recentColors` | unversioned | JSON array of recent hex colours | Vector Editor colour picker | unversioned array; `[]` on error |
| vector/js/core/state.js | `vectoreditor.*` (other keys) | unknown | not enumerated | Vector Editor | unknown |
| label/js/io/files.js, label/js/ui/view-state.js | label prefs keys (passed to `lsGet`/`lsSet`) | unknown | not enumerated | Label Designer | unknown |

## Retired

| Owner | Name | Notes |
|---|---|---|
| contacts (commit c94e877) | `tlbx-contacts-drafts` / drafts (key `current`) | File `contacts/js/store/drafts.js` deleted. No open in code. Data on a device stays put; nothing reads it. A reader for it would need the old name. |

## Renamed keys

| Old | New | Status |
|---|---|---|
| TlbxData settings `currency` | `defaultCurrency` | Read once in `seedDefaults` and moved; `fx.baseIn` also falls back to `currency` (tested) |
