// Purchase Orders: the purchase order's own words for refusals and its status names; the rest is TlbxBiz (shared/biz/biz.js).
// Classic script, loaded after shared/data and shared/biz/biz.js. Exposes window.TlbxPurchases.util.
(function (g) {
  'use strict';
  const S = g.TlbxData;
  const NS = (g.TlbxPurchases = g.TlbxPurchases || {});

  // words in the chosen language, read each time a refusal is shown (getters); printed statuses are biz.st.* in the document's language (shared/docs/doc-view.js)
  const t = (k) => (g.TlbxI18n ? g.TlbxI18n.t(k) : k);
  const PLAIN = { get invalid_transition() { return t('purchases.core.not_allowed'); }, get conflict() { return t('purchases.core.done'); } };
  const FIELD = { get customerId() { return t('purchases.core.supplier'); }, get date() { return t('purchases.core.date'); }, get expectedDate() { return t('purchases.core.expected'); },
    get lines() { return t('purchases.core.lines'); }, get notes() { return t('purchases.core.notes'); }, get currency() { return t('purchases.core.currency'); }, get status() { return t('purchases.core.status'); } };

  const B = g.TlbxBiz;
  /** One readable line for a failed Result, in the words of a purchase order (TlbxBiz.refusal). */
  const refusal = (r) => B.refusal(r, { plain: PLAIN, fields: FIELD });

  NS.util = { PLAIN, FIELD, refusal, settings: B.settings, money: B.money, h: B.h, ok: S.result.ok, fail: S.result.fail };
})(typeof window !== 'undefined' ? window : globalThis);
