// The order PDF: the shared document PDF (shared/docs/doc-pdf.js) for an order. Pure: bytes out.
(function (g) {
  'use strict';
  const NS = (g.TlbxOrders = g.TlbxOrders || {});
  const P = g.TlbxDocs.docPdf.create({ ns: NS, collection: 'orders', kind: 'order', title: 'Order', statusLabel: g.TlbxDocs.model.STATUS_LABEL });
  NS.pdf = { load: P.load, viewOf: P.viewOf, orderPdf: P.pdf };
})(typeof window !== 'undefined' ? window : globalThis);
