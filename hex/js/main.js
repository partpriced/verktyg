/* Hex Editor: boot. Registers the app with Files, wires the toolbar, the Go to and Find bars, drag and drop, the
 * right-click menu and the commands, and opens the file launched with ?drive=<id> (the way Paste and Code launch).
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
    /* Drop a file anywhere on the page to open it (TlbxDrop, shared/drop: one file, the browser would otherwise navigate). */
    window.TlbxDrop.attach($('hx-drop'), {
      accept: { any: true, allowEmpty: true, noun: 'a file' },
      limit: 1,
      compact: true,
      targets: [document.body],
      process: async (file) => { await A().openBlob(file, { name: file.name }); return file.name; },
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
    A().refresh();
    try {
      const launch = await TlbxHub.consumeLaunch();
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
