/* Contacts — app/view-state: coming back to Contacts returns to the group, the search, the contact that was
 * open and the selection, and to the same place in the list. The contacts themselves come back from the draft and
 * Data (storage.js). The place is kept in TlbxSession. Classic script; exposes TlbxContacts.viewState. */
(function () {
  'use strict';
  const SC = (window.TlbxContacts = window.TlbxContacts || {});
  const S = SC.state, APP = 'contacts';
  let ready = false; // nothing is saved until the saved place has been applied
  const rows = () => document.getElementById('rows');
  const auto = window.TlbxSession.autosave(APP, 'place', function () {
    return { group: S.group, query: S.query, open: S.open, sel: [...S.sel], scroll: rows() ? rows().scrollTop : 0 };
  }, { delay: 400 });
  const touch = function () { if (ready && S.ready) auto.touch(); };
  S.on('render', touch);
  ['pointerup', 'keyup', 'click', 'input'].forEach(function (t) { document.addEventListener(t, touch, true); });
  if (rows()) rows().addEventListener('scroll', touch, { passive: true });

  const GROUP_OK = /^(recent|cat:.+|stage:(lead|contacted|customer|lost))$/;
  SC.viewState = {
    /** Boot, after the list has loaded: the group, search, open card, selection and scroll position. */
    restore: async function () {
      const p = await window.TlbxSession.load(APP, 'place', null).catch(function () { return null; });
      if (p && typeof p === 'object') {
        S.group = p.group === null || (typeof p.group === 'string' && GROUP_OK.test(p.group)) ? (p.group || null) : null;
        S.query = typeof p.query === 'string' ? p.query : '';
        const search = document.getElementById('search');
        if (search) search.value = S.query;
        S.sel = new Set(Array.isArray(p.sel) ? p.sel.filter(function (id) { return !!S.byId(id); }) : []);
        S.open = S.byId(p.open) ? p.open : null;
        S.emit('render');
        if (rows() && p.scroll > 0) requestAnimationFrame(function () { rows().scrollTop = p.scroll; });
      }
      ready = true;
    },
  };
})();
