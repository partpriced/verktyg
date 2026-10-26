// Admin commands, registered with TlbxCmd (palette, remappable keys). Also wires every [data-cmd] button.
(function (g) {
  'use strict';
  const NS = (g.TlbxAdmin = g.TlbxAdmin || {});
  const t = (k) => (g.TlbxI18n ? g.TlbxI18n.t(k) : k);
  // title and group are keys of the string tables (admin/i18n), read when the commands are registered
  const COMMANDS = [
    { id: 'view.company', title: 'admin.cmd.company', group: 'admin.cmd.g_goto', run: () => NS.app.show('company') },
    { id: 'view.numbering', title: 'admin.cmd.numbering', group: 'admin.cmd.g_goto', run: () => NS.app.show('numbering') },
    { id: 'view.taxes', title: 'admin.cmd.taxes', group: 'admin.cmd.g_goto', run: () => NS.app.show('taxes') },
    { id: 'view.data', title: 'admin.cmd.data', group: 'admin.cmd.g_goto', run: () => NS.app.show('data') },
    { id: 'view.storage', title: 'admin.cmd.storage', group: 'admin.cmd.g_goto', run: () => NS.app.show('storage') },
    { id: 'data.backup', title: 'admin.cmd.backup', group: 'admin.cmd.g_data', run: () => { NS.app.show('data'); document.getElementById('dBackup').click(); } },
    { id: 'data.everything', title: 'admin.cmd.everything', group: 'admin.cmd.g_data', run: () => { NS.app.show('data'); document.getElementById('dEverything').click(); } },
    { id: 'data.restore', title: 'admin.cmd.restore', group: 'admin.cmd.g_data', run: () => { NS.app.show('data'); document.getElementById('dRestore').click(); } }, // the button opens the intake's picker
    { id: 'data.reset', title: 'admin.cmd.reset', group: 'admin.cmd.g_data', run: () => { NS.app.show('data'); NS.views.data.reset(); } },
  ];
  const byId = Object.fromEntries(COMMANDS.map((c) => [c.id, c]));

  /** Runs a command through TlbxCmd when it is loaded (recents and remapped keys apply), else directly. */
  function run(id) {
    if (g.TlbxCmd && g.TlbxCmd.get(id)) return g.TlbxCmd.run(id);
    const c = byId[id];
    if (!c) return false;
    c.run();
    return true;
  }

  function init() {
    if (g.TlbxCmd) {
      g.TlbxCmd.init({ app: 'admin' });
      const reg = () => g.TlbxCmd.register(COMMANDS.map((c) => ({ id: c.id, title: t(c.title), group: t(c.group), keywords: [], keys: [], run: () => c.run() })));
      reg();
      if (g.TlbxI18n) g.TlbxI18n.on(reg);   // the palette and the menus in the new language
      // the assistant's commands (shared/data/ai-records.js through shared/biz/biz.js), loaded when the AI panel first asks
      if (g.TlbxCmd.provide && g.TlbxBiz && g.TlbxBiz.assistant) g.TlbxCmd.provide({ prepare: () => g.TlbxBiz.assistant('admin') });
    }
    document.addEventListener('click', (e) => {
      const el = e.target.closest && e.target.closest('[data-cmd]');
      if (!el || el.disabled) return;
      e.preventDefault();
      run(el.dataset.cmd);
    });
  }

  NS.commands = { init, run, list: COMMANDS };
})(typeof window !== 'undefined' ? window : globalThis);
