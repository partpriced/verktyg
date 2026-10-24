// Loads Projects' pure scripts (and TlbxTime, shared/calendar/tz.js) into one vm context. Helper for the
// projects-*.test.mjs files; not a test itself.
import vm from 'node:vm';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FILES = ['shared/calendar/tz.js', 'projects/js/core/board.js', 'projects/js/core/deps.js', 'projects/js/core/bars.js', 'projects/js/core/io.js', 'projects/js/core/sample.js'];

/** window.TlbxProjects (with board, deps, bars, io, sample) and TlbxTime from a fresh context. */
export async function load() {
  const ctx = { TextEncoder };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(await readFile(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return { P: ctx.TlbxProjects, T: ctx.TlbxTime };
}

/** Plain copy, so values made in the vm context compare equal to host values. */
export const plain = (v) => JSON.parse(JSON.stringify(v));
