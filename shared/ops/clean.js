/* Metadata Remover's headless operation, for Workflows (registry: shared/ops/registry.js):
 *   clean.metadata   removes GPS, camera, dates and the rest with Metadata Remover's own core (clean/js/core/index.js strip: the
 *                    picture data is copied as it is, never re-encoded, and the result is read back). JPEG, PNG, WebP, TIFF.
 * TIFF is left to Metadata Remover itself: the other picture steps cannot read it in a browser.
 * removeOf(choice, cats) is the category set for each choice; the categories themselves are Metadata Remover's (tags.js CATS). */
import { register } from './registry.js';
import { scripts } from './load.js';
import { opt } from './i18n.js';

const g = globalThis;
const FILES = ['clean/js/core/bytes.js', 'clean/js/core/tags.js', 'clean/js/core/xmp.js', 'clean/js/core/tiff.js', 'clean/js/core/jpeg.js',
  'clean/js/core/png.js', 'clean/js/core/webp.js', 'clean/js/core/index.js'];
const KIND = { jpeg: 'jpg', png: 'png', webp: 'webp', tiff: 'tif' };

/** The categories to remove: 'app' is Metadata Remover's own default (each category's def), 'location' only GPS, 'all' every one. */
export function removeOf(choice, cats) {
  const out = {};
  for (const c of cats) out[c.id] = choice === 'all' ? true : choice === 'location' ? c.id === 'location' : !!c.def;
  return out;
}

async function strip(files, o) {
  await scripts(FILES, () => !!(g.TlbxClean && g.TlbxClean.strip));
  const f = files[0], C = g.TlbxClean;
  const r = C.strip(new Uint8Array(await f.file.arrayBuffer()), { remove: removeOf(o.remove || 'app', C.CATS) });
  return [{ name: f.name, blob: new Blob([r.bytes], { type: r.mime }), kind: KIND[r.format] || f.kind }];
}

export const CLEAN_OPS = register([
  { id: 'clean.metadata', group: 'Pictures', from: ['jpg', 'png', 'webp'], mode: 'each', out: (k) => k,   // i18n-ignore: a group id (search words), an app name
    keywords: ['exif', 'gps', 'metadata', 'privacy', 'location', 'strip', 'clean'],
    options: [opt('ui.ops.clean.remove', { key: 'remove', type: 'select', value: 'app', options: ['app', 'location', 'all'] })],
    run: strip },
], { app: 'clean', label: 'Metadata Remover' });   // i18n-ignore: a group id (search words), an app name
