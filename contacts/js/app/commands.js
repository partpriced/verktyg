/* Contacts commands: every main action, registered with TlbxCmd (palette, remappable keys) and run from any
 * element with data-cmd. Keys are handled in keys.js, so they work without TlbxCmd too. Adds TlbxContacts.commands. */
(function () {
  'use strict';
  const SC = window.TlbxContacts;
  const S = SC.state;
  const UI = window.TlbxUI;
  const hasSel = () => S.sel.size > 0;
  const hasOpen = () => !!(S.open && S.byId(S.open));
  const hasContacts = () => S.list.length > 0;
  const tools = () => SC.tools;

  function editOpen() { if (hasOpen()) { S.mode = 'edit'; S.emit('render'); } }
  function dupOpen() { const c = hasOpen() && S.byId(S.open); if (c) SC.cardRead.duplicate(c); }
  function selectShown(on) { S.setSel(on ? S.visible().map((c) => c.id) : []); }
  function about() {
    UI.alert('Contacts', 'Your contacts are the customers of CRM and Orders, kept in this browser. Nothing is uploaded. Import and export vCard, CSV or .scontacts files from the File menu.');
  }

  const COMMANDS = [
    { id: 'contacts.new', title: 'New contact…', group: 'Contacts', run: () => SC.newContact.open() },
    { id: 'contacts.edit', title: 'Edit the open contact', group: 'Contacts', run: editOpen, when: hasOpen },
    { id: 'contacts.dup', title: 'Duplicate the open contact', group: 'Contacts', run: dupOpen, when: hasOpen },
    { id: 'contacts.delete', title: 'Delete selected or open contact…', group: 'Contacts', run: () => SC.select.remove(hasSel() ? new Set(S.sel) : new Set([S.open])), when: () => hasSel() || hasOpen() },
    { id: 'contacts.selectAll', title: 'Select all shown', group: 'Contacts', run: () => selectShown(true), when: hasContacts },
    { id: 'contacts.clearSel', title: 'Clear selection', group: 'Contacts', run: () => S.setSel([]), when: hasSel },
    { id: 'contacts.selectMode', title: 'Toggle select mode (checkboxes)', group: 'Contacts', run: () => { S.selectMode = !S.selectMode; S.emit('render'); } },
    { id: 'import.files', title: 'Import vCard, CSV or .scontacts…', group: 'File', run: () => SC.io.importPick() },
    { id: 'export.open', title: 'Export…', group: 'File', run: () => SC.io.exportDialog(), when: hasContacts },
    { id: 'contacts.dupes', title: 'Find duplicates…', group: 'Tools', run: () => tools().dupesDialog(), when: () => S.list.length > 1 },
    { id: 'contacts.clean', title: 'Clean up contacts…', group: 'Tools', run: () => tools().cleanDialog(), when: hasContacts },
    { id: 'contacts.findReplace', title: 'Find and replace…', group: 'Tools', run: () => tools().findDialog(), when: hasContacts },
    { id: 'groups.add', title: 'Add selected to group…', group: 'Groups', run: () => tools().addGroupDialog(), when: hasSel },
    { id: 'groups.remove', title: 'Remove selected from group…', group: 'Groups', run: () => tools().removeGroupDialog(), when: hasSel },
    { id: 'groups.showAll', title: 'Show all contacts', group: 'Groups', run: () => { S.group = null; S.query = ''; S.emit('render'); } },
    { id: 'groups.sheet', title: 'Show groups', group: 'Groups', run: () => SC.groups.sheet(true) },
    { id: 'settings.country', title: 'Default country code…', group: 'Settings', run: () => tools().countryDialog() },
    { id: 'view.search', title: 'Search contacts', group: 'View', run: () => { const q = document.getElementById('search'); if (q) q.focus(); } },
    { id: 'view.table', title: 'Show contacts as a table', group: 'View', run: () => SC.layout.setView('table'), when: hasContacts },
    { id: 'view.cards', title: 'Show contacts as cards', group: 'View', run: () => SC.layout.setView('cards') },
    { id: 'filters.clear', title: 'Clear all filters', group: 'View', run: () => { S.filters = SC.filters.clean({}); S.emit('render'); }, when: () => SC.filters.active(S.filters) },
    { id: 'help.about', title: 'About Contacts', group: 'Help', run: about },
  ];
  const byId = Object.fromEntries(COMMANDS.map((c) => [c.id, c]));

  /** Runs a command by id. Goes through TlbxCmd when it is loaded (recents and remapped keys apply). */
  function run(id) {
    const c = byId[id];
    if (!c) return false;
    try {
      if (window.TlbxCmd && window.TlbxCmd.get(id)) return window.TlbxCmd.run(id);
      if (c.when && !c.when()) return false;
      c.run();
      return true;
    } catch (err) {
      console.error(err);
      UI.toast(`${c.title} failed: ${err.message}`);
      return false;
    }
  }

  /** Registers with TlbxCmd and wires every [data-cmd] element. */
  function init() {
    const C = window.TlbxCmd;
    if (C) {
      C.init({ app: 'contacts' });
      C.register(COMMANDS.map((c) => ({ id: c.id, title: c.title, group: c.group, keys: [], when: c.when, run: () => c.run() })));
      C.register([{ id: 'help.keys', title: 'Keyboard shortcuts…', group: 'Help', run: () => C.openKeymap() }]);
    }
    document.addEventListener('click', (e) => {
      const el = e.target.closest && e.target.closest('[data-cmd]');
      if (el && !el.disabled) { e.preventDefault(); run(el.dataset.cmd); }
    });
  }

  SC.commands = { COMMANDS, run, init };
})();
