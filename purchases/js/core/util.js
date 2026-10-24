// Purchase Orders: the purchase order's own words for refusals and its status names; the rest is TlbxBiz (shared/biz/biz.js).
// Classic script, loaded after shared/data and shared/biz/biz.js. Exposes window.TlbxPurchases.util.
(function (g) {
  'use strict';
  const S = g.TlbxData;
  const NS = (g.TlbxPurchases = g.TlbxPurchases || {});

  const PLAIN = { invalid_transition: 'That change is not allowed for this purchase order', conflict: 'Already done' };
  const FIELD = { customerId: 'Supplier', date: 'Date', expectedDate: 'Expected', lines: 'Lines', notes: 'Notes', currency: 'Currency', status: 'Status' };
  const STATUS = { draft: 'Draft', ordered: 'Ordered', received: 'Received', cancelled: 'Cancelled' };

  const B = g.TlbxBiz;
  /** One readable line for a failed Result, in the words of a purchase order (TlbxBiz.refusal). */
  const refusal = (r) => B.refusal(r, { plain: PLAIN, fields: FIELD });

  NS.util = { PLAIN, FIELD, STATUS, refusal, settings: B.settings, money: B.money, h: B.h, ok: S.result.ok, fail: S.result.fail };
})(typeof window !== 'undefined' ? window : globalThis);
