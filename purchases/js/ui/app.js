// Purchase Orders boot: the shared document app (shared/docs/doc-app.js) with the routes list, new, po/<id> and data.
(function (g) {
  'use strict';
  g.TlbxDocs.docApp.start({ ns: (g.TlbxPurchases = g.TlbxPurchases || {}), app: 'purchases', route: 'po', noun: 'purchase order' });
})(typeof window !== 'undefined' ? window : globalThis);
