/* Background Remover — Open in. A menu on the toolbar ("Open in…") with the apps a result can go to:
 *   Image Editor  (image)  the cut-out as a new layer, via CO.send.layer (send.js; the mask can come back there)
 *   Vector Editor     (image)  the cut-out PNG as an image object
 *   Video Editor        (video)  a colour video + its matte video (a matte pair). If Cut is open the clip is sent to it
 *                            over the Hub bus; otherwise a new Cut tab opens on it. A clip that came from Cut
 *                            goes back above its own clip.
 * The original stays in Files (drive.js saves it when the item is processed). */
(function () {
  'use strict';
  const CO = window.CO, U = CO.util, S = CO.state, P = CO.process, O = CO.openIn = {};
  const hub = () => (document.documentElement.dataset.offline ? null : window.TlbxHub || null);
  const toast = (m) => window.TlbxUI && TlbxUI.toast(m);

  /** The cut-out of an image as a PNG (the active record if this image is on screen, else built and released). */
  async function cutoutBlob(it) {
    const act = P.active && P.active.item === it ? P.active : null;
    const rec = act || (await P.build(it));
    try { return await CO.drive.imageBlob(rec.cutout); } finally { if (!act && rec.jobId) VideoStudioout.release(rec.jobId).catch(() => {}); }
  }
  /** Video to Video Editor: the colour and matte as two Drive files, then Cut opens on the pair. */
  async function toCut(it) {
    const h = hub(), V = CO.video;
    if (!h || !it.vid || !it.vid.res) return toast('Cut out the video first');
    toast('Preparing the clip for Video Editor…');
    const base = U.baseName(it.name), folderId = await CO.drive.folder();
    const colour = (await V.enc.colourMp4(it.vid.src, it.vid.res, {})).blob;
    const matte = (await V.enc.matteMp4(it.vid.src, it.vid.res, {})).blob;
    const matteId = await h.put(matte, { name: base + '-matte.mp4', from: 'cutout', meta: { role: 'matte' }, folderId });
    const colourName = base + '-cutout.mp4';
    const colourId = await h.put(colour, { name: colourName, from: 'cutout', meta: { role: 'colour', matteId, clipId: it.origin && it.origin.meta ? it.origin.meta.clipId || null : null }, folderId });
    const clipId = it.origin && it.origin.from === 'videoedit' && it.origin.meta ? it.origin.meta.clipId : null;
    const payload = { id: colourId, matteId, name: colourName, clipId: clipId || null };
    if (h.openApps().includes('videoedit')) { h.emit('cutout-result', payload); toast('Sent to the open Video Editor'); }
    else window.open(h.urlOf(h.appById('videoedit'), { drive: colourId }), '_blank');
  }
  async function toVector(it) {
    const h = hub();
    if (!h) return;
    const blob = await cutoutBlob(it);
    await h.sendTo('vector', blob, U.baseName(it.name) + '-cutout.png');
  }

  /** The menu items for an item (used by the toolbar button and the queue's context menu). */
  O.items = function (it) {
    if (!it || it.status !== 'done') return [];
    const send = (label, fn) => ({ label, act: () => fn(it).catch((e) => toast('Could not send: ' + (e.message || e))) });
    if (it.kind === 'video') return it.vid && it.vid.res ? [send(it.origin && it.origin.from === 'videoedit' ? 'Back to Video Editor' : 'Open in Video Editor', toCut)] : [];
    const out = [];
    if (CO.send && CO.send.layer) out.push({ label: 'Open in Image Editor', act: () => CO.send.layer(it) });
    if (hub()) out.push(send('Open in Vector Editor', toVector));
    return out;
  };
  O.show = function (anchor) {
    const it = S.current(), items = O.items(it);
    if (!items.length) return toast(it ? 'Wait until the cut-out is ready' : 'Open an image first');
    const r = anchor.getBoundingClientRect();
    TlbxUI.menu(items, r.left, r.bottom + 4);
  };

  O.init = function () {
    const top = U.$('.topbar'), dl = U.$('#btnDownload');
    if (!top || !dl) return;
    const b = U.h('button', { type: 'button', class: 'btn', id: 'btnOpenIn', title: 'Open the cut-out in another app' }, 'Open in…');
    b.addEventListener('click', () => O.show(b));
    top.insertBefore(b, dl);
    const sync = () => { const it = S.current(); b.disabled = !(it && it.status === 'done'); };
    CO.on('activeItem', sync); CO.on('item', sync);
    sync();
  };
})();
