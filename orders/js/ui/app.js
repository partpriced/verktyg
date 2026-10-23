// Orders boot: the shared document app (shared/docs/doc-app.js) with the order routes (list, new, o/<id>, data).
(function (g) {
  'use strict';
  g.TlbxDocs.docApp.start({ ns: (g.TlbxOrders = g.TlbxOrders || {}), app: 'orders', route: 'o', noun: 'order' });
})(typeof window !== 'undefined' ? window : globalThis);
