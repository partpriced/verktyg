/* Background Remover — Send to Image Editor. Two results. "Send back" returns the mask of an image Image Editor sent here
 * (Layer ▸ Isolate Subject): Image Editor makes it that layer's mask. "Send to Image Editor as a new layer" sends the
 * cut-out itself (PNG with alpha). Both go over the Hub bus to the Image Editor tab that is waiting for them.
 * If no tab answers, the mask is saved to Files as a grey PNG and the cut-out opens in a new ImageEditor tab. */
(function () {
  'use strict';
  const CO = window.CO, U = CO.util, S = CO.state, P = CO.process, C = CO.compose, t = U.t;
  const SEND = CO.send = {};
  const ACK_MS = 3000;
  const hub = () => (document.documentElement.dataset.offline ? null : window.TlbxHub || null);
  const toast = (m) => window.TlbxUI && TlbxUI.toast(m);
  const ready = (it) => !!it && it.status === 'done';

  /** The finished record of an item: the active one, or a fresh job released after fn. */
  async function withRecord(it, fn) {
    const mine = !!P.active && P.active.item === it;
    const rec = mine ? P.active : await P.build(it);
    try { return await fn(rec); }
    finally { if (!mine) Promise.resolve(VideoStudioout.release(rec.jobId)).catch(() => {}); }
  }
  /** Post a message on the bus and wait for the matching reply (null after ACK_MS: nobody answered). */
  function ask(type, ackType, data) {
    return new Promise((res) => {
      let t = 0;
      const off = hub().on(ackType, (d) => { if (d && d.requestId === data.requestId) { clearTimeout(t); off(); res(d); } });
      t = setTimeout(() => { off(); res(null); }, ACK_MS);
      hub().emit(type, data);
    });
  }

  /** Send back the mask of a ImageEditor-launched image (it becomes that layer's mask in Image Editor). */
  SEND.mask = async function (it = S.current()) {
    if (!hub()) return toast(t('cutout.act.no_drive'));
    if (!ready(it)) return toast(t('cutout.send.wait'));
    if (!it.request) return toast(t('cutout.send.not_imageeditor'));
    await withRecord(it, async (rec) => {
      const { requestId } = it.request;
      const ack = await ask('bgremover:mask', 'imageeditor:mask-ack', { requestId, w: rec.w, h: rec.h, mask: rec.mask.slice() });
      if (ack && ack.ok) return toast(t('cutout.send.mask_sent'));
      if (ack) return toast(ack.error || t('cutout.send.mask_refused'));
      // Nobody is waiting for it (Image Editor was closed): keep the mask as a grey PNG in Files.
      const px = new ImageData(window.TlbxMaskTransfer.toGrey(rec.mask), rec.w, rec.h);
      const blob = await VideoStudioout.toBlob(px, 'image/png');
      await hub().put(blob, { name: U.baseName(it.name) + '-mask.png', from: 'cutout' });
      toast(t('cutout.send.mask_drive'));
    });
  };

  /** Send the cut-out (PNG with alpha) to Image Editor as a new layer, or open it in a new ImageEditor tab. */
  SEND.layer = async function (it = S.current()) {
    if (!hub()) return toast(t('cutout.act.no_drive'));
    if (!ready(it)) return toast(t('cutout.send.wait'));
    await withRecord(it, async (rec) => {
      const blob = await U.blobOf(C.cutCanvas(rec), 'image/png');
      const name = U.baseName(it.name) + '-cutout.png';
      if (it.request) {
        const ack = await ask('bgremover:layer', 'imageeditor:layer-ack', { requestId: it.request.requestId, blob, name });
        if (ack && ack.ok) return toast(t('cutout.send.layer_added'));
        if (ack) return toast(ack.error || t('cutout.send.layer_refused'));
      }
      await hub().sendTo('imageeditor', blob, name);
      toast(t('cutout.send.opened'));
    });
  };

  /** The top-bar button: "Send back to Image Editor", shown for images that came from Image Editor. */
  SEND.init = function () {
    const btn = U.$('#btnSendBack');
    if (!btn) return;
    const label = () => U.btnIcon(btn, 'send', t('cutout.app.send_back'));
    label();
    U.onLang(label);
    btn.addEventListener('click', () => SEND.mask());
    const sync = () => {
      const it = S.current();
      btn.hidden = !hub() || !(it && it.request);
      btn.disabled = !ready(it);
    };
    ['activeItem', 'item', 'list'].forEach((t) => CO.on(t, sync));
    sync();
  };
})();
