/* Calculator for the assistant: TlbxCmd commands with arguments, loaded on demand by TlbxCmd.prepare() (commands.js).
 * Through the page itself (TlbxCalcApp): add_calculation (an expression, calculated as Enter does, onto the paper tape;
 * the answer comes back), clear_tape (destructive), save_calculation (the last one to Files, as Save does) and
 * export_tape (the tape as CSV or text, to Files and/or a download). The calculator makes no documents to create. */
(function () {
  'use strict';
  const C = window.TlbxCmd, A = () => window.TlbxCalcApp;
  if (!C || C.get('calc.ai.add-calculation')) return;
  const add = (tool, title, args, run, extra) => Object.assign({ id: 'calc.ai.' + tool.replace(/_/g, '-'), tool, title, group: 'AI', hidden: true, destructive: false, args,
    run: (a) => run(a || window.TlbxCmdArgs.defaults(args)) }, extra);
  const TO = { name: 'to', type: 'enum', values: ['drive', 'download', 'both'], default: 'drive' };
  C.register([
    add('add_calculation', 'Calculate', [{ name: 'expression', type: 'string', required: true, maxLength: 2000, description: 'e.g. 12% of 340, 3 h 20 min in min, tax(100, 20%), 2026-03-01 + 45 days, 100 USD in EUR, price = 19.99' }],
      async (a) => {
        const before = A().snapshot().tape.length;
        A().setExpr(a.expression);
        await A().commit();
        const s = A().snapshot();
        if (s.tape.length === before) throw new Error(document.getElementById('sc-status') ? document.getElementById('sc-status').textContent : 'Not calculated');
        return { expression: s.last.expr, result: s.last.text };
      }, { description: 'Calculate an expression (units, currency, dates, percentages, tax, variables) and add it to the paper tape.' }),
    add('clear_tape', 'Clear the paper tape', [], () => { A().clearTape(); return 'The tape is empty (the history is kept).'; }, { destructive: true }),
    add('save_calculation', 'Save the last calculation to Files', [], async () => {
      const s = A().snapshot();
      if (!s.last) throw new Error('Calculate something first');
      await A().saveDrive();
      return `Saved “${s.last.expr} = ${s.last.text}” to Files as a note.`;
    }),
    add('export_tape', 'Export the paper tape', [{ name: 'format', type: 'enum', values: ['csv', 'txt'], default: 'csv' }, TO, { name: 'name', type: 'string', maxLength: 120, default: 'tape' }], async (a) => {
      const tape = A().snapshot().tape;
      if (!tape.length) throw new Error('The tape is empty');
      const q = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
      const text = a.format === 'csv' ? ['Expression,Result', ...tape.map((r) => `${q(r.expr)},${q(r.text)}`)].join('\n') + '\n' : tape.map((r) => `${r.expr} = ${r.text}`).join('\n') + '\n';
      const name = `${a.name}.${a.format}`, blob = new Blob([text], { type: a.format === 'csv' ? 'text/csv' : 'text/plain' }), out = [];
      if (a.to !== 'download') out.push(`Saved ${name} to Files (id ${await window.TlbxHub.put(blob, { name, from: 'calculator' })})`);
      if (a.to !== 'drive') { window.TlbxUI.download(blob, name); out.push(`downloaded ${name}`); }
      return out.join(' and ') + '.';
    }),
  ]);
  C.provide({ state: () => Object.assign({ app: 'Calculator' }, A().snapshot()),
    checkpoint: () => { const tape = A().snapshot().tape; return () => { A().restoreTape(tape); return true; }; } });
})();
