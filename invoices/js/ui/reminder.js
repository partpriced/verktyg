// A payment reminder from a customer statement: the subject and message (TlbxData.statement.reminder: the tone follows how
// late the oldest open invoice is) in a dialog, to edit, copy, or open in the person's email app addressed to the customer
// (a mailto: link; nothing is sent from here).
(function (g) {
  'use strict';
  const S = g.TlbxData;
  const NS = (g.TlbxInvoices = g.TlbxInvoices || {});
  const U = NS.util;
  const UI = g.TlbxUI;
  const h = U.h;
  const t = (k, v) => (g.TlbxI18n ? g.TlbxI18n.t(k, v) : k);
  // The subject and message (TlbxData.statement.reminder) go to the customer: in the document's language (words, the
  // statement's: TlbxBiz.docLang); the dialog around them speaks the page's language.
  const TONE = () => ({ friendly: t('invoices.rm.friendly'), firm: t('invoices.rm.firm'), final: t('invoices.rm.final') });

  /** The mailto: link for an address, subject and body. */
  const mailto = (to, subject, body) => `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  /** Opens the dialog for a statement (st) of a customer, with the settings for the company name and the words of the
   *  document's language (default: the company's, TlbxBiz.docLang; its tables must be in, as the statement loads them). */
  function open(st, customer, settings, words) {
    const w = words || g.TlbxBiz.docLang.words(g.TlbxBiz.docLang.pick('', settings.docLang), settings.locale);
    const r = S.statement.reminder(st, { customer: customer.name, company: settings.companyName }, (m) => U.money(m, st.currency, w.locale), w);
    if (r.tone === 'none') { UI.toast(t('invoices.rm.nothing')); return null; }
    const subject = h('input', { type: 'text', value: r.subject, class: 'sui-input' });
    const body = h('textarea', { rows: 12, class: 'sui-input rem-body' });
    body.value = r.body;
    const mail = h('a', { class: 'btn primary', href: mailto(customer.email, r.subject, r.body), text: customer.email ? t('invoices.rm.open_mail_to', { email: customer.email }) : t('invoices.rm.open_mail') });   // i18n-ignore: CSS class names
    const sync = () => { mail.href = mailto(customer.email, subject.value, body.value); };
    subject.addEventListener('input', sync);
    body.addEventListener('input', sync);
    const copy = h('button', { type: 'button', class: 'btn', text: t('invoices.rm.copy'), onclick: async () => {
      try { await navigator.clipboard.writeText(`${subject.value}\n\n${body.value}`); UI.toast(t('invoices.rm.copied')); } catch (e) { body.select(); UI.toast(t('invoices.rm.select')); }
    } });
    UI.dialog({
      title: TONE()[r.tone],
      body: h('div', { class: 'rem' }, customer.email ? null : h('p', { class: 'note', text: t('invoices.rm.no_email', { name: customer.name }) }),
        UI.field(t('invoices.rm.subject'), subject), UI.field(t('invoices.rm.message'), body), h('div', { class: 'toolbar' }, mail, copy)),
      buttons: [{ label: t('invoices.rm.close') }],
    });
    return { tone: r.tone, subject, body, mail };
  }

  NS.reminder = { open, mailto };
})(typeof window !== 'undefined' ? window : globalThis);
