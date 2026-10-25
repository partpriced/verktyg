// Import from Contacts: the newest saved list in Files is offered first, and Choose another list… is the one
// shared Files picker (TlbxIntake.fromDrive, part 'crm.contacts'); see the plan (new, already linked, cannot be
// stored), then import. Linked contacts are skipped, so a second import adds nothing that is already here.
(function (g) {
  'use strict';
  const NS = (g.TlbxCrm = g.TlbxCrm || {});
  const UI = g.TlbxUI;
  const el = UI.el;
  const SC_INFO = TlbxExamples.info('crm');

  /** The plan for the list the person picked: reads the file and checks it against the customers. */
  async function planFor(rec) {
    const parsed = await NS.contactsImport.readList(rec.blob);
    if (!parsed.ok) return parsed;
    const linked = await NS.customers.linkedContactIds();
    if (!linked.ok) return linked;
    return { ok: true, value: NS.contactsImport.plan(parsed.value, linked.value) };
  }

  /** Opens the import dialog, or says that there is no saved list yet. */
  async function open() {
    const lists = await NS.contactsImport.findLists();
    if (!lists.length) {
      UI.dialog({ title: 'Import from Contacts', body: 'No saved Contacts list was found in Files. Save your contacts in Contacts first, then come back here.',
        buttons: [{ label: 'OK', primary: true }] });
      return;
    }
    let current = lists[0];
    const name = el('b', null, current.name);
    const info = el('p', { class: 'note', role: 'status' });
    let plan = null;
    const show = async () => {
      name.textContent = current.name;
      const p = await planFor(current);
      plan = p.ok ? p.value : null;
      info.textContent = p.ok
        ? `${plan.add.length} new customer${plan.add.length === 1 ? '' : 's'}, ${plan.skipped} already linked or without an id, ${plan.invalid} that cannot be stored.`
        : NS.util.refusal(p);
    };
    const SI = g.TlbxIntake;
    const other = () => SI.fromDrive({ title: 'Choose a saved Contacts list', accept: ['application/x-tlbx-contacts', 'application/json'], to: SI.part({
      id: 'crm.contacts', limit: 1, accept: { types: ['application/x-tlbx-contacts', 'application/json'], exts: ['.scontacts', '.json'], noun: 'a Contacts list' },
      process: async (f, ctx) => { current = ctx.drive ? Object.assign({}, ctx.drive.record, { blob: f }) : { name: f.name, blob: f }; await show(); return f.name; },
    }) });
    UI.dialog({
      title: 'Import from Contacts',
      body: el('div', null, el('p', { class: 'note' }, 'Saved list: ', name, ' ', el('button', { type: 'button', class: 'sui-btn', onclick: other }, 'Choose another list…')), info,
        el('p', { class: 'note' }, 'Each contact becomes a lead. Contacts already linked to a customer are skipped.'),
        el('p', { class: 'note' }, SC_INFO.note),
        el('button', { type: 'button', class: 'sui-btn', onclick: () => TlbxExamples.download('crm') }, 'Download example CSV')),
      buttons: [
        { label: 'Cancel' },
        { label: 'Import', primary: true, act: async () => {
          if (!plan || !plan.add.length) { UI.toast('Nothing new to import.'); return false; }
          const r = await NS.contactsImport.apply(plan);
          if (!r.ok) { UI.toast(NS.util.refusal(r)); return false; }
          UI.toast(`Imported ${r.value} customer${r.value === 1 ? '' : 's'}`);
          return true;
        } },
      ],
    });
    show();
  }

  NS.importUi = { open };
})(typeof window !== 'undefined' ? window : globalThis);
