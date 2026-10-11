// Storage status: how much this site uses and whether the browser has promised to keep it. The plain-words message
// for the answer comes from shared/pwa.js (TlbxPWA.persistMessage), so every app says the same thing.
(function (g) {
  'use strict';
  const NS = (g.TlbxAdmin = g.TlbxAdmin || {});

  async function status() {
    const nav = g.navigator || {};
    let usage = null, quota = null, persisted = null;
    try {
      if (nav.storage && nav.storage.estimate) { const e = await nav.storage.estimate(); usage = e.usage; quota = e.quota; }
      if (nav.storage && nav.storage.persisted) persisted = await nav.storage.persisted();
    } catch (e) { /* the browser refused the estimate: show what is known */ }
    const answer = g.TlbxPWA ? g.TlbxPWA.persistAnswer() : null;
    const message = g.TlbxPWA && answer ? g.TlbxPWA.persistMessage(answer) : '';
    return { usage, quota, persisted, answer, message: message || 'The browser has not been asked yet. Ask it to keep your business data, so it is not cleared when space runs low.' };
  }

  /** Asks the browser to keep this site's storage (a user-visible prompt in some browsers). Returns the answer. */
  async function ask() {
    if (!g.TlbxPWA || !g.TlbxPWA.requestPersist) return null;
    return g.TlbxPWA.requestPersist();
  }

  NS.storage = { status, ask };
})(typeof window !== 'undefined' ? window : globalThis);
