/* Contacts: boot. Mounts the columns, reads the customers from TlbxData, and opens a .scontacts file that was
 * handed over from Files (?drive=). Load after every other app script. Sets TlbxContacts.ready for tests. */
(function () {
  'use strict';
  const SC = window.TlbxContacts;
  const S = SC.state;
  const $ = (id) => document.getElementById(id);

  /** Opens a file handed over from Files. Resolves with true when one was handed over. */
  async function launch() {
    const h = window.TlbxHub || null;
    if (h) { try { h.register('contacts'); } catch (e) { /* hub without register */ } }
    // through the intake (drop-import.js); the import waits for the person to confirm the preview, the page does not
    try { return await SC.dropImport.launch(); } catch (e) { return false; }
  }

  async function boot() {
    const storage = window.TlbxData && (await window.TlbxData.store.ready());
    if (storage && !storage.ok) {
      $('empty').hidden = false;
      $('empty').textContent = SC.tr('contacts.list.storage', { why: storage.message });
      return;
    }
    SC.list.mount();
    SC.select.mount();
    SC.groups.mount();
    SC.card.mount();
    SC.table.mount();
    SC.layout.mount();
    SC.filterPanel.mount();
    SC.urlPlace.mount();
    SC.dropImport.mount();
    SC.keys.mount();
    SC.commands.init();
    $('btnNew').addEventListener('click', () => SC.newContact.open());
    $('btnGroups').setAttribute('aria-expanded', 'false');
    const ok = await SC.records.init();
    SC.drive.init(); // the Files copy: the Save button, the status line and the save after each change
    const place = SC.urlPlace.peek(); // read before the session's place is applied, so the URL wins when it names one
    if (ok) {
      const handed = await launch();
      await SC.viewState.restore(); // js/app/view-state.js: the group, search, open card and selection
      if (!handed) SC.driveLoad.offerAtStart().catch(() => {}); // an empty list is offered contacts.vcf from Files
    }
    SC.urlPlace.apply(place);
    S.ready = true;
    SC.ready = true;
    S.emit('render');
    if (window.TlbxI18n) window.TlbxI18n.on(() => { SC.card.redraw(); S.emit('render'); });   // every column in the new language
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();
