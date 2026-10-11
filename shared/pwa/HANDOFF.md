# PWA: install, offline and persistent storage

ITpris Verktyg installs as an app and works offline. Installing makes browsers more likely to grant
persistent storage to Files. It does not guarantee it: Chrome still decides.

## What installs

- `manifest.webmanifest` (site root): name "ITpris Verktyg", short name "Tlbx", `start_url` and
  `scope` "/", `display` standalone, colours `#0a0a0a` (the homepage). Icons: `favicon.svg`
  (any size), `assets/icons/icon-192.png` and `icon-512.png`. Shortcut: "Files" → `/drive/`.
- Every homepage and app page links the manifest. The homepage and the 15 registry apps (Files included) load `shared/pwa.js` and call `TlbxPWA.mount()`.

## What is cached

- `service-worker.js` (scope `/`, cache `worksuite-<VERSION>`):
  - **Precache** (`PRECACHE`, 685 files, about 6.5 MiB): the homepage, Files, every app's
    `index.html`, and the CSS, JS and fonts those pages load at boot (followed through `<script>`,
    `<link>`, static ES imports and CSS `url()`). `offline.html`, the manifest and the icons are
    included. The first visit fetches all of it in the background.
  - **HTML navigations**: network first, then the saved copy, then `offline.html`. `/drive/` is
    stored as `/drive/index.html`.
  - **Static files** (js, css, fonts, images, wasm, json, glb): cache first. Files not seen at
    install are added on first use.
  - Only same-origin GET requests are handled. Other origins and other methods go straight to the
    network and are never cached.
- Old `worksuite-*` caches are deleted when a new worker activates.

## Updating

1. Change the site as usual.
2. If you added, removed or moved a boot file, run `node tools/pwa-precache.mjs`. It rewrites the
   `PRECACHE` block in `service-worker.js` and warns about any entry that is not on disk.
3. **Bump `VERSION` in `service-worker.js`** (`'v1'` → `'v2'`) on every release that changes a
   precached or static file. Without the bump, returning visitors keep the old cached files. The
   browser also updates the worker only when its bytes change.
4. Run `node tests/run.mjs pwa`. The offline test checks that the homepage and Files open
   with the server stopped.

`tools/pwa-icons.mjs` regenerates the PNG icons from `favicon.svg`. Run it only if the icon changes.

## Install button and storage note

- `TlbxPWA.mount({ install: '#pwa-install' })` shows the "Install ITpris Verktyg" button only after the
  browser offers an install (`beforeinstallprompt`). The button hides after the click, after
  `appinstalled`, and when the app runs standalone.
- Persistent storage: after `appinstalled`, or once when the page is running standalone, `mount()`
  calls `navigator.storage.persist()` and records the answer in localStorage (`tlbx-pwa.persist`:
  `granted`, `denied` or `unsupported`). Files's "Storage" note shows the answer in plain
  words. A "no" points to Backup & restore.
- `TlbxPWA.mount()` does nothing (returns false) when the browser has no service worker support.

## Limits

- Chrome, not the site, decides whether storage persists. Installing raises the chance of a "yes"
  but does not guarantee it. Clearing site data always deletes everything. Export a backup
  (Backup & restore) for anything that matters.
- Safari and Firefox have their own rules. The install button may never appear there.
- The precache follows static references. Files loaded only with dynamic `import()` or
  `createElement('script')` are cached on first use instead.

## Tests

- `tests/pwa/`: manifest and icons, app-page wiring, the service worker (fake `self`, `caches`
  and `fetch`), the mount no-op, the install button, the persistent-storage answer and message,
  and the Files note.
- `tests/node/pwa-offline.test.mjs`: the real offline check, run with `node tests/run.mjs pwa`.
