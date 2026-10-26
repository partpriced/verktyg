// The English words of shared modules that run as ES modules (shared/finance warnings, shared/templates scheme names,
// shared/nav and shared/commands messages: shared/i18n/ui/en/data2.js, templates.js, print.js) on this Node global, as
// a page has them: those modules read globalThis.TlbxI18n when they speak. Import it first. Not a test file itself.
import vm from 'node:vm';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const I18N = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'shared', 'i18n');
const PARTS = ['data2', 'templates', 'print'];
const run = (f) => vm.runInThisContext(`(function (window) {${readFileSync(path.join(I18N, f), 'utf8')}\n})(globalThis);`, { filename: f });
const tables = (code) => [`ui/${code}.js`, ...PARTS.map((p) => `ui/${code}/${p}.js`)];
if (!globalThis.TlbxI18n) {
  run('i18n.js');
  globalThis.TlbxI18n = globalThis.TlbxI18n.create({ defaultLang: 'en', profile: null });   // English in any build
  tables('en').forEach(run);
}

/** Runs fn with Swedish chosen, then puts the English instance back. */
export function inSwedish(fn) {
  const en = globalThis.TlbxI18n;
  globalThis.TlbxI18n = en.create({ defaultLang: 'sv', profile: null });
  try {
    [...tables('en'), ...tables('sv')].forEach(run);
    return fn();
  } finally { globalThis.TlbxI18n = en; }
}
