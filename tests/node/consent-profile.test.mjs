// Covers: shared/consent/config.js, shared/consent/banner.js, shared/theme/theme.js
// The brand profile's switches outside the apps: "analytics": false empties every third-party ID and the consent strip
// never mounts; "themes" recolours the shared themes and hides the ones the profile lists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

test('analytics off: no IDs, thirdParty false, the strip does not mount', () => {
  const on = {}; vm.runInNewContext(read('shared/consent/config.js'), { window: on });
  assert.equal(on.TLBX_CONSENT_CONFIG.thirdParty, true);
  assert.ok(on.TLBX_CONSENT_CONFIG.ga4MeasurementId);
  const off = {}; vm.runInNewContext(read('shared/consent/config.js').replace('/*profile:analytics*/false', '/*profile:analytics*/false'), { window: off });
  const c = off.TLBX_CONSENT_CONFIG;
  assert.deepEqual([c.thirdParty, c.ga4MeasurementId, c.adsensePublisherId, c.patreonUrl], [false, '', '', '']);
  let appended = 0;
  const document = { readyState: 'complete', body: { getAttribute: () => null, append: () => { appended++; } }, getElementById: () => null };
  const win = { TLBX_CONSENT_CONFIG: c, TlbxConsent: { needsChoice: () => true, base: '/' }, TlbxConsentState: { needsChoice: () => true, base: '/' } };
  vm.runInNewContext(read('shared/consent/banner.js'), { window: win, document, requestAnimationFrame() {} });
  assert.equal(win.TlbxBanner.mount(), false);
  assert.equal(appended, 0);
});

test('themes: the profile recolours light and dark and hides lime', () => {
  const src = read('shared/theme/theme.js').replace('/*profile:themes*/{"light":{"background":"#f4f4f5","surface":"#ffffff","text":"#09090b","accent":"#115e59","border":"#71717a"},"dark":{"background":"#18181b","surface":"#27272a","text":"#f4f4f5","accent":"#2dd4bf","border":"#71717a"}}', '/*profile:themes*/{"light":{"accent":"#1d4ed8"},"hide":["lime"]}');
  const g = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
  vm.runInNewContext(src, { window: g, self: g, globalThis: g, document: undefined }, {});
  const T = g.TlbxTheme;
  assert.ok(T, 'TlbxTheme');
  const ids = T.THEMES.map((t) => t.id);
  assert.ok(!ids.includes('lime') && ids.includes('dark'));
  assert.equal(T.THEMES.find((t) => t.id === 'light').tokens.accent, '#1d4ed8');
});
