/* Hex Editor: boot. Registers the app with Files, wires the toolbar, the Go to and Find bars, drag and drop, the
 * right-click menu and the commands. The open files come back as tabs (js/tabs.js); a file launched with ?drive=<id> (the way
 * Paste and Code launch) opens in a tab of its own.
 * Classic script, runs once the page is parsed. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const A = () => window.HexApp;

  function wire() {
    const act = (id, fn) => $(id).addEventListener('click', fn);
    act('hx-open', () => A().pickComputer());
    act('hx-open2', () => A().pickComputer());
    act('hx-drive', () => A().pickDrive());
    act('hx-drive2', () => A().pickDrive());
    act('hx-save', () => A().saveVersion());
    act('hx-saveas', () => A().saveAs());
    act('hx-dl', () => A().download());
    act('hx-sha-btn', () => A().computeSha());
    act('hx-cmd', () => { if (window.TlbxCmd && TlbxCmd.open) TlbxCmd.open(); });
    act('hx-menu', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      TlbxUI.menu(window.HexCommands.menuItems(), r.left, r.bottom + 4);
    });
    act('hx-prev', () => A().find(-1));
    $('hx-goform').addEventListener('submit', (e) => {
      e.preventDefault();
      if (A().gotoOffset($('hx-goto').value)) A().grid().focus();
    });
    $('hx-findform').addEventListener('submit', (e) => { e.preventDefault(); A().find(1); });
    if (window.TlbxCtx) TlbxCtx.bind($('hx-scroll'), () => window.HexCommands.contextItems());
    /* A file dropped on the tabs, the strip or the bytes opens (TlbxDrop, shared/drop; one file at a time, and a file that is
       already open is not opened again). */
    window.TlbxDrop.attach($('hx-drop'), {
      accept: { any: true, allowEmpty: true, noun: 'a file' },
      limit: 1,
      compact: true,
      targets: [$('hx-tabs'), $('hx-drop'), $('hx-main')],
      process: async (file) => {
        if (A().isOpen(file)) throw new Error('is already open');
        await A().openBlob(file, { name: file.name });
        return file.name;
      },
    });
  }

  async function boot() {
    TlbxHub.register('hex');
    const grid = HexGrid.create({
      scroll: $('hx-scroll'), spacer: $('hx-spacer'), rows: $('hx-rows'),
      onSelect: () => A().refresh(),
      onChange: () => A().changed(),
      onCopy: () => A().copySel(),
    });
    A().app.grid = grid;
    wire();
    window.HexCommands.register();
    // The launch is read before the tabs come back: showing a tab rewrites the address bar (its ?drive= id).
    let launch = null;
    try { launch = await TlbxHub.consumeLaunch(); } catch (e) { launch = null; }
    const session = HexTabs.mount($('hx-tabs'), { activate: A().activate, deactivate: A().deactivate, refresh: A().refresh });
    try { await session.restore(); } catch (e) { console.warn('Hex Editor: restore failed', e); }
    if (!HexTabs.current()) HexTabs.api().newTab();
    A().refresh();
    try {
      if (launch && launch.blob) await A().openBlob(launch.blob, { name: launch.name, driveId: launch.id });
    } catch (e) {
      TlbxUI.toast('Could not open that file: ' + e.message);
    }
    document.body.classList.add('ready');
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot().catch((e) => { console.error(e); document.body.classList.add('ready'); if (window.TlbxUI) TlbxUI.toast('Hex Editor could not start: ' + e.message); });
  });
})();
