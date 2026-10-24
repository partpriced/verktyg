// Storage status: how much this site uses and whether the browser has promised to keep it (from TlbxQuota,
// shared/storage/quota.js). The plain-words message for the answer comes from shared/pwa.js (TlbxPWA.persistMessage),
// so every app says the same thing.
(function (g) {
  'use strict';
  const NS = (g.TlbxAdmin = g.TlbxAdmin || {});

  async function status() {
    const { usage, quota, persisted } = await g.TlbxQuota.estimate();   // shared/storage/quota.js: never throws
    const answer = g.TlbxPWA ? g.TlbxPWA.persistAnswer() : null;
    const message = g.TlbxPWA && answer ? g.TlbxPWA.persistMessage(answer) : '';
    return { usage, quota, persisted, answer, message: message || 'The browser has not been asked yet. Ask it to keep your business data, so it is not cleared when space runs low.' };
  }

  /** Asks the browser to keep this site's storage (a user-visible prompt in some browsers). Returns the answer. */
  async function ask() {
    return g.TlbxQuota.request();   // through TlbxPWA when loaded, so the answer is recorded
  }

  NS.storage = { status, ask };
})(typeof window !== 'undefined' ? window : globalThis);
