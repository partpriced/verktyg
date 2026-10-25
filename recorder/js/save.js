/* Screen Recorder: what happens to a recording. Download, Save to Files and Open in… (Video Editor and every app that takes
 * the file, through TlbxOuttake, the one way out). Each makes the file once (output.js: trimmed, in the chosen format) and
 * keeps it until the recording, the trim or the format changes. Classic script: TlbxRec.save.
 *   use(rec)            the recording to save (null: none); drops the file made for the last one
 *   file(o)             → Promise<{ blob, name, type }> for the current trim and format (o: { progress, signal })
 *   download(), toDrive() → the Drive record id, openInItems() → TlbxOuttake menu items
 *   stale()             the trim or the format changed: the next save makes the file again */
(function (g) {
  'use strict';
  const R = (g.TlbxRec = g.TlbxRec || {});
  let rec = null, made = null, key = '', name = '', busy = null;
  const toast = (m) => { if (g.TlbxUI && g.TlbxUI.toast) g.TlbxUI.toast(m); };

  function want() {
    const t = R.view.trim(), f = R.settings.format();
    return { trim: t, format: f, key: `${f}|${t.start}|${t.end}` };
  }
  function use(r) { rec = r; made = null; key = ''; name = r ? (r.name || R.plan.fileName(new Date(), 'x')) : ''; }
  function stale() { made = null; key = ''; }
  async function file(o = {}) {
    if (!rec) throw new Error('Record something first.');
    const w = want();
    if (made && key === w.key) return made;
    if (busy && busy.key === w.key) return busy.p;
    const p = R.output.make(rec, { format: w.format, trim: w.trim, opts: R.settings.get(), name, progress: o.progress, signal: o.signal })
      .then((out) => { made = out; key = w.key; return out; })
      .finally(() => { if (busy && busy.p === p) busy = null; });
    busy = { key: w.key, p };
    return p;
  }
  async function download(o) {
    const out = await file(o);
    g.TlbxUI.download(out.blob, out.name);
    return out;
  }
  async function toDrive(o) {
    const out = await file(o);
    if (!g.TlbxHub) throw new Error('Files is not available on this page.');
    const id = await g.TlbxHub.put(out.blob, { name: out.name, from: 'recorder' });
    toast(`Saved ${out.name} to Files.`);
    return { id, name: out.name };
  }
  /** Open in…: Video Editor first (it takes every video), then every other app that takes the file, then Save to Files…. */
  function openInItems() {
    const O = g.TlbxOuttake;
    if (!O || !rec) return [];
    const f = R.settings.format(), type = f === 'gif' ? 'image/gif' : f === 'mp4' ? 'video/mp4' : f === 'wav' ? 'audio/wav' : (rec.blob.type || 'video/webm');
    const items = O.items({ get: () => file().then((x) => x.blob), name: () => (made ? made.name : name.replace(/\.[^.]+$/, '') + '.' + (f === 'webm' ? rec.ext : f)), type, from: 'recorder' });
    const cut = items.findIndex((i) => i.to === 'videoedit');
    if (cut > 0) items.unshift(items.splice(cut, 1)[0]);
    return items;
  }
  R.save = { use, file, download, toDrive, openInItems, stale, current: () => rec };
})(typeof window !== 'undefined' ? window : globalThis);
