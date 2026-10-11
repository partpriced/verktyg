/* TlbxBackup: the small helper any ITpris Verktyg page can include (or load lazily) to back up and restore
 * everything this site keeps in the browser. It loads the real work (zip.js, codec.js, core.js, ui.js)
 * on first use. Classic script, exposes window.TlbxBackup:
 *   TlbxBackup.exportNow()            build worksuite-backup-YYYY-MM-DD.backup and download it
 *   TlbxBackup.importFile(file, opts) restore a backup ({ mode: 'merge' | 'replace' })
 *   TlbxBackup.openDialog()           the Backup & restore dialog (export, import with merge/replace)
 *   TlbxBackup.kit()                  resolves with the TlbxUI dialog kit, loading it if the page lacks it */
(function () {
  'use strict';
  if (window.TlbxBackup) return;
  const me = document.currentScript && document.currentScript.src;
  const ROOT = me ? new URL('../../', me).href : new URL('/', location.href).href;
  const jobs = new Map();
  function load(rel) {
    if (!jobs.has(rel)) jobs.set(rel, new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = new URL(rel, ROOT).href;
      s.onload = res; s.onerror = () => { jobs.delete(rel); rej(new Error('Could not load ' + rel)); };
      document.head.append(s);
    }));
    return jobs.get(rel);
  }
  let kitP = null;
  /** The TlbxUI kit. Some pages own a different window.TlbxUI (the homepage), so load the kit beside it. */
  function kit() {
    if (window.TlbxUI && window.TlbxUI.dialog) return Promise.resolve(window.TlbxUI);
    if (!kitP) kitP = (async () => {
      if (!document.querySelector('link[href*="tlbxui.css"]')) {
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('shared/tlbxui.css', ROOT).href; document.head.append(l);
        await new Promise((r) => { l.onload = r; l.onerror = r; });
      }
      const prev = window.TlbxUI;
      window.TlbxUI = undefined;
      let k;
      try { await load('shared/tlbxui.js'); } finally { k = window.TlbxUI; if (prev) window.TlbxUI = prev; }
      return k;
    })();
    return kitP;
  }
  async function ready() {
    await Promise.all(['shared/backup/zip.js', 'shared/backup/codec.js', 'shared/backup/core.js'].map(load));
    return window.TlbxBackupCore;
  }
  async function exportNow({ onProgress } = {}) {
    const core = await ready(), ui = await kit();
    const { blob, name, manifest } = await core.exportAll({ onProgress });
    ui.download(blob, name);
    try { localStorage.setItem('tlbx-backup-last', String(Date.now())); } catch (e) { /* storage blocked */ }
    return { name, size: blob.size, manifest };
  }
  async function importFile(file, opts) { const core = await ready(); return core.importBackup(file, opts); }
  async function openDialog(opts) { await ready(); const ui = await kit(); await load('shared/backup/ui.js'); return window.TlbxBackupUI.open(ui, opts); }
  function lastExport() { try { return +localStorage.getItem('tlbx-backup-last') || 0; } catch (e) { return 0; } }
  window.TlbxBackup = { exportNow, importFile, openDialog, kit, ready, load, lastExport, ROOT };
})();
