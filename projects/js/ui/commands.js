// Projects commands for TlbxCmd (and the menu bar's data-cmd buttons). Plain letters work outside text fields:
// b Board, t Timeline, l List, n new task, f find, p project settings. Ctrl+Z undoes (TlbxUndo). Exposes
// window.TlbxProjects.commands.
(function (g) {
  'use strict';
  const NS = (g.TlbxProjects = g.TlbxProjects || {});
  const $ = (id) => document.getElementById(id);
  const has = () => !!NS.state.project;
  const t = (k) => () => (g.TlbxI18n ? g.TlbxI18n.t(k) : k);   // read when the commands are registered
  const G = t('projects.cmd.g');
  const LIST = [
    { id: 'projects.board', title: t('projects.cmd.board'), group: G, keys: ['b'], keywords: ['kanban', 'columns', 'cards'], run: () => NS.app.go('board') },
    { id: 'projects.timeline', title: t('projects.cmd.timeline'), group: G, keys: ['t'], keywords: ['gantt', 'schedule', 'dates'], run: () => NS.app.go('timeline') },
    { id: 'projects.list', title: t('projects.cmd.list'), group: G, keys: ['l'], keywords: ['table', 'sort'], run: () => NS.app.go('list') },
    { id: 'projects.newTask', title: t('projects.cmd.new_task'), group: G, keys: ['n'], keywords: ['add', 'card'], when: has, run: () => NS.editor.open({}) },
    { id: 'projects.find', title: t('projects.cmd.find'), group: G, keys: ['f'], keywords: ['search', 'filter'], when: has, run: () => $('fText').focus() },
    { id: 'projects.editProject', title: t('projects.cmd.settings'), group: G, keys: ['p'], keywords: ['columns', 'people', 'wip'], when: has, run: () => NS.projectDialog.open() },
    { id: 'projects.newProject', title: t('projects.cmd.new_project'), group: G, keys: [], run: () => NS.projectDialog.create() },
    { id: 'projects.exportJson', title: t('projects.cmd.dl_json'), group: G, keys: [], keywords: ['export', 'save'], when: has, run: () => NS.files.exportJson() },
    { id: 'projects.exportCsv', title: t('projects.cmd.dl_csv'), group: G, keys: [], keywords: ['export', 'spreadsheet', 'excel'], when: has, run: () => NS.files.exportCsv() },
    { id: 'projects.import', title: t('projects.cmd.import'), group: G, keys: [], keywords: ['import', 'json'], run: () => NS.files.importFile() },
    { id: 'projects.sample', title: t('projects.cmd.sample'), group: G, keys: [], keywords: ['demo', 'example'], run: () => NS.files.trySample() },
    { id: 'projects.undo', title: t('projects.cmd.undo'), group: G, keys: [], keywords: ['undo', 'back'], when: () => NS.actions.history.size > 0, run: () => NS.actions.undo() },
    { id: 'projects.crm', title: t('projects.cmd.crm'), group: t('projects.cmd.g_goto'), keys: [], run: () => { location.href = '../crm/'; } },
  ];

  /** Registers the commands with TlbxCmd (TlbxBiz.commands also runs the menu bar's data-cmd buttons), then again with
   *  their letters, which TlbxBiz.commands leaves out. */
  function init() {
    g.TlbxBiz.commands('projects', LIST);
    // the commands with letters, again with their keys (TlbxBiz.commands registers them without), and after a language change
    const keyed = () => g.TlbxCmd.register(LIST.filter((c) => c.keys.length).map((c) => ({ ...c, title: c.title(), group: c.group() })));
    if (g.TlbxCmd) { keyed(); if (g.TlbxI18n) g.TlbxI18n.on(keyed); }
    if (NS.ai) NS.ai.init();   // the commands with arguments (ai-commands.js) for the palette, macros and the assistant
  }

  NS.commands = { init, list: LIST };
})(typeof window !== 'undefined' ? window : globalThis);
