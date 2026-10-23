// The Data view: full backup and restore (TlbxBiz.backup, shared/biz/backup.js).
(function (g) {
  'use strict';
  const NS = (g.TlbxQuotes = g.TlbxQuotes || {});
  NS.dataActions = { backup: () => g.TlbxBiz.backup.backup(), restore: (f) => g.TlbxBiz.backup.restore(f) };
  NS.views = NS.views || {};
  NS.views.data = { mount: () => g.TlbxBiz.backup.mount(), refresh: () => {}, onShow: () => {} };
})(typeof window !== 'undefined' ? window : globalThis);
