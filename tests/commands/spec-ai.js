/* The assistant's side of TlbxCmd: aiAdder (the one add() helper of the apps' ai-commands.js), sources() (loads
 * shared/commands/sources.js once), and state(), which may be a value or a promise: TlbxCmd.state() and the AI panel's
 * app_state (shared/ai/cmdtools.js) give an async state's value, and a failing state as { error }. */
// Covers: shared/commands/commands.js, shared/commands/sources.js, shared/ai/cmdtools.js
(function () {
  const { describe, it, expect } = TlbxTest;
  describe('assistant helpers', () => {
    it('aiAdder makes hidden AI commands, pushes them into the list and fills the defaults when run with no arguments', async () => {
      T.fresh();
      const list = [], add = TlbxCmd.aiAdder('tst', list), got = [];
      const c = add('set_size', 'Set the size', [{ name: 'size', type: 'number', min: 1, max: 9, default: 4 }], (a) => { got.push(a); return 'ok ' + a.size; }, { description: 'd' });
      expect(list.length).toBe(1); expect(list[0]).toBe(c);
      expect(c.id).toBe('tst.ai.set-size'); expect(c.tool).toBe('set_size'); expect(c.group).toBe('AI');
      expect(c.hidden).toBe(true); expect(c.destructive).toBe(false); expect(c.description).toBe('d');
      expect(TlbxCmd.aiAdder('one')('x', 'X', [], () => 1, { destructive: true }).destructive).toBe(true);   // extra wins; no list: returned only
      TlbxCmd.register(list); T.made.push(c.id);
      expect((await TlbxCmd.exec('tst.ai.set-size', { size: 7 })).value).toBe('ok 7');
      await TlbxCmd.exec('tst.ai.set-size', {});
      TlbxCmd.run('tst.ai.set-size');   // a key or the palette: no arguments, so the defaults
      expect(got.map((a) => a.size)).toEqual([7, 4, 4]);
    });
    it('sources() loads shared/commands/sources.js once and finds a Files file by id, name or part of it', async () => {
      const was = window.TlbxHub, files = [{ id: 'f1', name: 'Sales 2026.xlsx', type: 'text/plain', blob: new Blob(['a,b'], { type: 'text/plain' }) }];
      window.TlbxHub = { get: async (id) => files.find((f) => f.id === id) || null, list: async () => files.map(({ id, name }) => ({ id, name })) };
      try {
        const [a, b] = await Promise.all([TlbxCmd.sources(), TlbxCmd.sources()]);
        expect(a).toBe(window.TlbxCmdSources); expect(b).toBe(a);
        expect(document.querySelectorAll('script[src$="commands/sources.js"]').length).toBe(1);
        for (const q of ['f1', 'sales 2026.xlsx', 'sales']) expect((await a.driveFile(q)).id).toBe('f1');
        const f = await a.driveAsFile('Sales');
        expect(f instanceof File).toBe(true); expect(f.name).toBe('Sales 2026.xlsx'); expect(await f.text()).toBe('a,b');
        let err = ''; try { await a.driveAsFile('nope'); } catch (e) { err = e.message; }
        expect(err).toContain('No Files file “nope”');
      } finally { window.TlbxHub = was; }
    });
    it('state() and app_state give an async state, and a failing one as { error }', async () => {
      T.fresh();
      try {
        TlbxCmd.provide({ state: () => ({ n: 1 }) });
        expect(TlbxCmd.state().n).toBe(1);   // a plain value stays a plain value
        TlbxCmd.provide({ state: async () => ({ job: { tool: 'tags' } }) });
        expect((await TlbxCmd.state()).job.tool).toBe('tags');
        const tool = TlbxAIKit.cmdTools.build(TlbxCmd, { label: 'Test' }).find((t) => t.name === 'app_state');
        expect(JSON.stringify(await tool.run({ detail: true }))).toContain('tags');
        TlbxCmd.provide({ state: async () => { throw new Error('no models'); } });
        expect((await TlbxCmd.state()).error).toBe('no models');
        TlbxCmd.provide({ state: () => { throw new Error('sync fail'); } });
        expect(TlbxCmd.state().error).toBe('sync fail');
      } finally { TlbxCmd.provide({ state: undefined }); }
    });
  });
})();
