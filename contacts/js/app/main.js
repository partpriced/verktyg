/* Contacts: boot. Mounts the columns, reads the customers from TlbxData, and opens a .scontacts file that was
 * handed over from Files (?drive=). Load after every other app script. Sets TlbxContacts.ready for tests. */
(function () {
  'use strict';
  const SC = window.TlbxContacts;
  const S = SC.state;
  const $ = (id) => document.getElementById(id);

  async function launch() {
    const h = window.TlbxHub || null;
    if (h) { try { h.register('contacts'); } catch (e) { /* hub without register */ } }
    let rec = null;
    try { rec = h ? await h.consumeLaunch() : null; } catch (e) { rec = null; }
    if (rec && rec.blob) {
      // Not awaited: the import waits for the person to confirm the preview, and the page must not wait for that.
      SC.io.importFiles([{ name: rec.name || 'contacts.scontacts', text: () => rec.blob.text() }])
        .catch((e) => window.TlbxUI.toast(`Could not import: ${e.message}`));
    }
  }

  async function boot() {
    const storage = window.TlbxData && (await window.TlbxData.store.ready());
    if (storage && !storage.ok) {
      $('empty').hidden = false;
      $('empty').textContent = `Storage is not available here: ${storage.message}. Nothing can be saved in this window.`;
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
    const place = SC.urlPlace.peek(); // read before the session's place is applied, so the URL wins when it names one
    if (ok) { await launch(); await SC.viewState.restore(); } // js/app/view-state.js: the group, search, open card and selection
    SC.urlPlace.apply(place);
    S.ready = true;
    SC.ready = true;
    S.emit('render');
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();
