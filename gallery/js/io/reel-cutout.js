/* Gallery: "Cut out subjects first" for a reel. Runs one photo through Cutout's engine (shared/cutout/cutout.js,
 * loaded on first use) with the Fast model, as it is, and returns a PNG with alpha. Nothing is re-implemented here.
 * Exposes window.TlbxGallery.reelCutout.cutOut(blob, { signal, onProgress }) -> Promise<Blob> (image/png). */
(function () {
  'use strict';
  const G = (window.TlbxGallery = window.TlbxGallery || {});

  /** The engine, loaded once from the site's shared folder. */
  async function engine() {
    if (!window.VideoStudioout) {
      if (!window.TlbxHub || !TlbxHub.loadScript) throw new Error('Hub is not available');
      await TlbxHub.loadScript('shared/cutout/cutout.js');
    }
    if (!window.VideoStudioout) throw new Error('Cutout did not start');
    return window.VideoStudioout;
  }

  /** blob: the photo's original bytes. Rejects with an AbortError when signal fires. */
  async function cutOut(blob, { signal, onProgress } = {}) {
    const C = await engine();
    const r = await C.removeBackground(blob, { model: 'fast', signal, onProgress: onProgress || (() => {}) });
    return r.toBlob('image/png');
  }

  G.reelCutout = { cutOut, engine };
})();
