// Orders: the order's own words for refusals; the rest is TlbxBiz (shared/biz/biz.js). Classic script, loaded after
// shared/data and shared/biz/biz.js. Exposes window.TlbxOrders.util.
// Nothing here stores anything; it formats, parses and explains.
(function (g) {
  'use strict';
  const S = g.TlbxData;
  const NS = (g.TlbxOrders = g.TlbxOrders || {});

  // The order's own words where they differ from TlbxBiz.PLAIN; the data layer's message follows after a colon.
  const PLAIN = {
    invalid_transition: 'That change is not allowed for this order',
    posting_required: 'Stock changes go through the stock rules only',
  };
  const FIELD = { customerId: 'Customer', date: 'Date', lines: 'Lines', notes: 'Notes', currency: 'Currency', status: 'Status' };

  const B = g.TlbxBiz;
  /** One readable line for a failed Result, in the words of an order (TlbxBiz.refusal, shared/biz/biz.js). */
  const refusal = (r) => B.refusal(r, { plain: PLAIN, fields: FIELD });

  // settings, money and the DOM builder are TlbxBiz's (one copy for the business apps)
  NS.util = { PLAIN, FIELD, refusal, settings: B.settings, money: B.money, h: B.h, ok: S.result.ok, fail: S.result.fail };
})(typeof window !== 'undefined' ? window : globalThis);
