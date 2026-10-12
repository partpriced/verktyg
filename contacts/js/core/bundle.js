/* Contacts: the Files bundle. The whole list is one vCard 4.0 file (contacts.vcf, UTF-8, CRLF). Each contact is
 * one VCARD block: the standard properties (N, FN, ORG, TITLE, TEL, EMAIL, ADR, BDAY, URL, NOTE) and the ITpris properties
 * that vCard does not have: X-TLBX-ID (the stable id, so a re-import updates the same record), X-TLBX-GROUP (one line per
 * group), X-TLBX-STAGE, X-TLBX-FOLLOWUP (ISO date) and X-TLBX-TAGS (one line, comma separated). Photos are not written.
 * Other apps ignore the X-TLBX lines. Reading goes through the vCard reader, so a bundle imports like any .vcf.
 * Classic script. Adds TlbxContacts.bundle. */
(function () {
  'use strict';
  const SC = (window.TlbxContacts = window.TlbxContacts || {});
  const T = SC.text, M = SC.model;
  const NAME = 'contacts.vcf', MIME = 'text/vcard';
  const STAGES = ['lead', 'contacted', 'customer', 'lost'];
  const esc = T.escVal;

  /** The X-TLBX lines of one contact (already normalised). */
  function tlbxLines(c) {
    const out = [`X-TLBX-ID:${esc(c.id)}`];
    for (const g of c.groups || []) out.push(`X-TLBX-GROUP:${esc(g)}`);
    if (c.stage) out.push(`X-TLBX-STAGE:${esc(c.stage)}`);
    if (c.followUp) out.push(`X-TLBX-FOLLOWUP:${esc(c.followUp)}`);
    if ((c.tagIds || []).length) out.push(`X-TLBX-TAGS:${c.tagIds.map(esc).join(',')}`);
    return out;
  }

  /** The whole list as one bundle string. */
  function write(list) {
    return (list || []).map((x) => {
      const c = M.normalise(x);
      return SC.vcard.one(c, '4.0', { tlbx: true, extra: tlbxLines(c) });
    }).join('');
  }

  /** Reads a bundle (or any vCard text) back. A stage that is not a pipeline stage and a follow-up date that is not
   *  YYYY-MM-DD are dropped, so a bad value cannot stop a save. */
  function read(text) {
    return SC.vcard.read(text, { photos: false }).map((c) => {
      if (!STAGES.includes(c.stage)) delete c.stage;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.followUp || '')) delete c.followUp;
      return c;
    });
  }

  SC.bundle = { NAME, MIME, STAGES, write, read, tlbxLines };
})();
