// The order on the page: the shared paper view and PDF download (shared/docs/doc-page.js) for an order. Draft and
// confirmed orders are edited in place; fulfilled and cancelled ones show read only.
(function (g) {
  'use strict';
  const NS = (g.TlbxOrders = g.TlbxOrders || {});
  NS.page = g.TlbxDocs.docPage.create({
    ns: NS, kind: 'order', title: 'Order', statusLabel: g.TlbxDocs.model.STATUS_LABEL,
    editable: (st) => st.status === 'draft' || st.status === 'open',
    pdf: (id) => NS.pdf.orderPdf(id),
  });
})(typeof window !== 'undefined' ? window : globalThis);
