/* Checksum for the assistant: TlbxCmd commands with arguments, loaded on demand by TlbxCmd.prepare() (checksum.js).
 * The page's own hashing (Web Crypto, TlbxChecksum.use): new_check (an empty check: no file, no published hash),
 * hash_file (a file from Files, any algorithm, optionally checked against a published hash; the page shows the same
 * result), add_text (typed text as the file), paste_hash (the published hash to check against) and save_hash (a
 * "<hash>  <name>" file such as name.sha256, to Files and/or a download). */
(function () {
  'use strict';
  const C = window.TlbxCmd, K = () => window.TlbxChecksum;
  if (!C || C.get('checksum.ai.hash-file')) return;
  const ALGS = ['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'];
  const add = C.aiAdder('checksum');   // shared/commands/commands.js
  async function driveFile(q) {
    const H = window.TlbxHub, s = String(q).toLowerCase(), all = await H.list();   // intake-ok: an AI command looks a Drive file up by name or id (a lookup; the person's picker is TlbxIntake.fromDrive)
    const hit = all.find((f) => f.id === q) || all.find((f) => f.name.toLowerCase() === s) || all.find((f) => f.name.toLowerCase().includes(s));
    if (!hit) throw new Error(`No file in Files “${q}”`);
    const rec = await H.get(hit.id);
    return new File([rec.blob], rec.name, { type: rec.type || rec.blob.type });
  }
  const ALG = { name: 'algorithm', type: 'enum', values: ALGS, description: 'the hash to compute; the one chosen on the page when empty' };
  C.register([
    add('new_check', 'Start a new check', [{ name: 'algorithm', type: 'enum', values: ALGS, default: 'SHA-256' }], async (a) => {
      await K().use(null, a.algorithm, '');
      return `Started a new ${a.algorithm} check: no file and no published hash yet (hash_file or add_text, then paste_hash).`;
    }, { description: 'Clear the page for a new check: no file, no published hash, the algorithm chosen.' }),
    add('add_text', 'Hash a text', [{ name: 'text', type: 'string', required: true, maxLength: 1000000, description: 'the exact text, hashed as UTF-8 with no newline added' },
      { name: 'name', type: 'string', maxLength: 200, default: 'text.txt', description: 'a name for it, used by save_hash' }, ALG],
    async (a) => {
      const r = await K().use(new File([a.text], a.name || 'text.txt', { type: 'text/plain' }), a.algorithm || null, null);
      return { hash: r.hash, algorithm: K().current().algorithm, verdict: r.verdict || null };
    }, { description: 'Put a text in as the file to hash (UTF-8 bytes), checked against the published hash if one is pasted.', macro: false }),
    add('paste_hash', 'Paste the published hash', [{ name: 'hash', type: 'string', required: true, maxLength: 200, description: 'the hash from the download page; a "sha256:" prefix and spaces are fine' }], (a) => {
      const verdict = K().expectHash(a.hash);
      return { expected: K().clean(a.hash), verdict: verdict || null };
    }, { description: 'Set the published hash the file is checked against, and give the verdict when a file is hashed.' }),
    add('hash_file', 'Hash a file', [{ name: 'file', type: 'string', required: true, maxLength: 300, description: 'Files name or id' },
      { name: 'algorithm', type: 'enum', values: ALGS, default: 'SHA-256' }, { name: 'expected', type: 'string', maxLength: 200, description: 'a published hash to check against' }],
    async (a) => {
      const r = await K().use(await driveFile(a.file), a.algorithm, a.expected || '');
      return { hash: r.hash, algorithm: a.algorithm, verdict: r.verdict || null };
    }, { description: 'The SHA-256 (or SHA-384, SHA-512, SHA-1) of a file from Files, and whether it matches a published hash.', macro: false }),
    add('save_hash', 'Save the hash as a file', [{ name: 'to', type: 'enum', values: ['drive', 'download', 'both'], default: 'drive' }], async (a) => {
      const cur = K().current();
      if (!cur.hash) throw new Error('Hash a file first (hash_file)');
      const ext = cur.algorithm.toLowerCase().replace('-', ''), name = `${cur.file}.${ext}`, blob = new Blob([`${cur.hash}  ${cur.file}\n`], { type: 'text/plain' }), out = [];
      if (a.to !== 'download') out.push(`Saved ${name} to Files (id ${await window.TlbxHub.put(blob, { name, from: 'checksum' })})`);
      if (a.to !== 'drive') { window.TlbxUI.download(blob, name); out.push(`downloaded ${name}`); }
      return out.join(' and ') + '.';
    }),
  ]);
  C.provide({ state: () => Object.assign({ app: 'Checksum' }, K().current()), checkpoint: () => () => true });
})();
