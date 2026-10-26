// Expenses commands (the palette and [data-cmd] buttons), through TlbxBiz.commands (shared/biz/biz.js).
(function (g) {
  'use strict';
  const NS = (g.TlbxExpenses = g.TlbxExpenses || {});
  const open = () => { const e = NS.editor && NS.editor.current(); return !!e && location.hash.startsWith('#e/'); };
  const t = (k) => () => (g.TlbxI18n ? g.TlbxI18n.t(k) : k);   // read when the commands are registered
  const GO = t('expenses.cmd.g_goto'), XS = t('expenses.cmd.g_expenses'), X = t('expenses.cmd.g_expense');
  const COMMANDS = [
    { id: 'view.list', title: t('expenses.cmd.list'), group: GO, run: () => NS.app.go('list') },
    { id: 'view.summary', title: t('expenses.cmd.summary'), group: GO, keywords: ['totals', 'report', 'month'], run: () => NS.app.go('summary') },
    { id: 'expenses.new', title: t('expenses.cmd.new'), group: XS, keywords: ['add', 'record', 'receipt', 'bill'], run: () => NS.app.go('new') },
    { id: 'expenses.csv', title: t('expenses.cmd.csv'), group: XS, keywords: ['export', 'spreadsheet', 'accountant'], run: () => NS.summaryView.exportCsv() },
    { id: 'expense.void', title: t('expenses.cmd.void'), group: X, when: () => open() && NS.editor.current().status === 'posted', run: () => NS.listView.voidOne(NS.editor.current()) },
    { id: 'expense.copy', title: t('expenses.cmd.copy'), group: X, when: open, run: () => NS.app.go(`new/${NS.editor.current().id}`) },
  ];
  NS.commands = { init: () => { NS.commands.run = g.TlbxBiz.commands('expenses', COMMANDS); }, list: COMMANDS };
})(typeof window !== 'undefined' ? window : globalThis);
