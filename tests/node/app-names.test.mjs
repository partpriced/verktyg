// Covers: shared/apps.js, shared/app-labels.js
// The name helper: every app has a plain name; a profile with naming 'plain' swaps it in everywhere the registry is read
// (name, title, tagline, group labels), tlbxAppName adds the chosen language, hidden apps and media follow the profile.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = readFileSync(path.join(ROOT, 'shared/apps.js'), 'utf8');
const LABELS = readFileSync(path.join(ROOT, 'shared/app-labels.js'), 'utf8');
function load(src, extra = {}) {
  const win = Object.assign({}, extra);
  vm.runInNewContext(src, { window: win });
  vm.runInNewContext(LABELS, { window: win, localStorage: { getItem: () => null, setItem() {} } });
  return win;
}
const plain = SRC.replace("/*profile:naming*/"plain"", "/*profile:naming*/\"plain\"").replace('/*profile:hideApps*/[]', '/*profile:hideApps*/["paint-classic"]').replace('/*profile:media*/false', '/*profile:media*/false');

test('brand naming (this site): names as they are, every app with a plain name', () => {
  const w = load(SRC);
  const pdf = w.TLBX_APPS.find((a) => a.id === 'pdf');
  assert.equal(pdf.name, 'PDF Editor'); assert.equal(pdf.plain, 'PDF Editor');
  for (const a of w.TLBX_APPS) assert.ok(a.plain && a.plainTagline, a.id);
  assert.equal(w.tlbxAppName('pdf'), 'PDF Editor');
  assert.equal(w.TLBX_GROUP_LABELS.business, 'Business apps');
});

test('plain naming: one name everywhere, groups plain, hidden apps gone, no media', () => {
  const w = load(plain);
  const byId = Object.fromEntries(w.TLBX_APPS.map((a) => [a.id, a]));
  assert.equal(byId.pdf.name, 'PDF Editor'); assert.equal(byId.pdf.title, 'PDF Editor'); assert.equal(byId.pdf.brandName, 'PDF Editor');
  assert.equal(byId.imageeditor.name, 'Image Editor'); assert.equal(byId.drive.name, 'Files');
  assert.equal(byId.docs.tagline, 'Write documents with pages, styles and lists. Opens and saves DOCX.');
  assert.equal(byId['paint-classic'], undefined);
  assert.equal(byId.pdf.shot, undefined);
  assert.equal(w.TLBX_GROUP_LABELS.creative, 'Creative');
  assert.equal(w.tlbxAppLabel(byId.pdf, true), 'PDF Editor');
  for (const a of w.TLBX_APPS) assert.doesNotMatch(a.name, /tlbx/i, a.id);
});

test('plain naming in another language: the app.<id> string', () => {
  const tables = { 'app.pdf': 'PDF-redigerare', 'apptag.pdf': 'Redigera PDF:er.' };
  const I18n = { t: (k) => tables[k] || k };
  const w = load(plain, { TlbxI18n: I18n });
  assert.equal(w.tlbxAppName('pdf'), 'PDF-redigerare');
  assert.equal(w.tlbxAppTagline(w.TLBX_APPS.find((a) => a.id === 'pdf')), 'Redigera PDF:er.');
  assert.equal(w.tlbxAppName('docs'), 'Documents');
});
