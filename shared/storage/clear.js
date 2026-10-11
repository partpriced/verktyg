/* TlbxStorage.clear(kind): removes only what the site makes again on demand. Never touches user files, documents,
 * saved projects, Files's Drive database (tlbx-hub), the backups or localStorage settings.
 *   'thumbs'      Drive thumbnails and previews (IndexedDB tlbx-drive-thumbs)
 *   'faces'       face-detection results (IndexedDB tlbx-faces)
 *   'models'      downloaded AI model files (Cache webllm/*), kept: models imported from a folder
 *   'cutout'      the cut-out model cache
 *   'packs'       downloaded library packs (IndexedDB tlbx-library), downloaded again when you use them
 *   'aitools'     AI Tools models installed from Get more (IndexedDB tlbx-aitools), downloaded again with the licence
 *   'oldCaches'   offline caches of earlier releases (worksuite-*); the newest one is kept
 *   'extras'      all of the above
 * Resolves with { kind, removed } (removed: count of entries, or of caches for oldCaches). Never throws. Classic script. */
(function (g) {
  'use strict';
  const SS = (g.TlbxStorage = g.TlbxStorage || {});
  const KINDS = ['thumbs', 'faces', 'models', 'cutout', 'packs', 'aitools'];

  function versionOf(name) { const m = /^worksuite-v(\d+)$/.exec(name); return m ? Number(m[1]) : -1; }
  /** Deletes every worksuite-* cache except the newest version. The worker that is running uses the newest. */
  async function clearOldCaches() {
    if (!g.caches) return 0;
    const names = (await caches.keys().catch(() => [])).filter((n) => n.startsWith('worksuite-'));
    if (names.length < 2) return 0;
    const newest = names.reduce((a, b) => (versionOf(b) > versionOf(a) ? b : a));
    let n = 0;
    for (const name of names) if (name !== newest && (await caches.delete(name).catch(() => false))) n++;
    return n;
  }

  SS.clear = async function (kind) {
    try {
      if (kind === 'oldCaches') return { kind, removed: await clearOldCaches() };
      if (kind === 'extras') {
        let removed = 0;
        for (const k of KINDS) removed += await g.TlbxRegen.only(k).catch(() => 0);
        return { kind, removed: removed + (await clearOldCaches()) };
      }
      if (KINDS.includes(kind)) return { kind, removed: await g.TlbxRegen.only(kind).catch(() => 0) };
    } catch (e) { /* a blocked store counts as nothing removed */ }
    return { kind, removed: 0 };
  };
})(window);
