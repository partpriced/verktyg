/* Shared by the Image Editor test pages (after tests/harness.js): loads the real app in a same-origin iframe.
 * By default it clears the app's saved state first (localStorage keys, and the autosave database) and marks the
 * tour as already shown, so the tour does not cover the page. Pass { keep: true } to reload with the saved state,
 * or { tour: true } to leave the first-run tour on; { query: '?connect=1' } adds a query to the page address. */
(function () {
  'use strict';
  const { waitFor } = TlbxTest;
  window.freshApp = async function freshApp({ keep = false, tour = false, query = '' } = {}) {
    const old = document.getElementById('app');
    if (old) old.remove();
    if (!keep) {
      for (const k of Object.keys(localStorage)) if (/^(imageeditor|tlbxshop)\./.test(k)) localStorage.removeItem(k);
      await new Promise((res) => { const r = indexedDB.deleteDatabase('tlbxshop'); r.onsuccess = r.onerror = r.onblocked = () => res(); });
      if (!tour) localStorage.setItem('imageeditor.tourShown', '1');
    }
    const frame = document.createElement('iframe');
    frame.id = 'app';
    frame.src = '../../imageeditor/index.html' + query;
    document.body.append(frame);
    const win = frame.contentWindow;
    await waitFor(() => win.document && win.document.body && win.document.body.classList.contains('ready'), { timeout: 30000 });
    const W = new Proxy({}, { get: (_, k) => win.eval(String(k)) });
    return { win, W, frame };
  };
})();
