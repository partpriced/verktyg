// Invoices: the invoice's own words for refusals; the rest is TlbxBiz (shared/biz/biz.js). Classic script, loaded after
// shared/data and shared/biz/biz.js. Exposes window.TlbxInvoices.util. Nothing here stores anything.
(function (g) {
  'use strict';
  const S = g.TlbxData;
  const NS = (g.TlbxInvoices = g.TlbxInvoices || {});

  // The invoice's own words where they differ from TlbxBiz.PLAIN; the data layer's message follows after a colon.
  const PLAIN = {
    has_payments: 'Cannot void: this invoice has payments',
    overpayment: 'Payment is more than the balance due',
    invalid_transition: 'That change is not allowed for this invoice',
    posting_required: 'Status changes go through issue, payment and void only',
  };
  const FIELD = { customerId: 'Customer', date: 'Date', dueDate: 'Due date', lines: 'Lines', notes: 'Notes', currency: 'Currency', amount: 'Amount' };

  const B = g.TlbxBiz;
  /** One readable line for a failed Result, in the words of an invoice (TlbxBiz.refusal, shared/biz/biz.js). */
  const refusal = (r) => B.refusal(r, { plain: PLAIN, fields: FIELD });

  // settings, money and the DOM builder are TlbxBiz's (one copy for the business apps)
  NS.util = { PLAIN, FIELD, refusal, settings: B.settings, money: B.money, h: B.h, ok: S.result.ok, fail: S.result.fail };
})(typeof window !== 'undefined' ? window : globalThis);
