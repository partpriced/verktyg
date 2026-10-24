// Guides (tools/seo/guides.mjs, copy in shared/seo/guides/): the checks, the page in the guide layout, the JSON-LD.
// Covers: tools/seo/guides.mjs, shared/seo/guides/index.mjs, shared/seo/guides/creative.mjs, shared/seo/guides/documents.mjs,
//   shared/seo/guides/creative-2.mjs, shared/seo/guides/creative-3.mjs, shared/seo/guides/creative-4.mjs,
//   shared/seo/guides/documents-2.mjs, shared/seo/guides/documents-3.mjs, shared/seo/guides/documents-4.mjs,
//   shared/seo/guides/business.mjs, shared/seo/guides/everyday.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const G = await import(pathToFileURL(path.join(ROOT, 'tools/seo/guides.mjs')).href);
const { GUIDES } = await import(pathToFileURL(path.join(ROOT, 'shared/seo/guides/index.mjs')).href);
const { loadRegistry, SITE } = await import(pathToFileURL(path.join(ROOT, 'tools/seo/site.mjs')).href);
const apps = await loadRegistry(), app = (id) => apps.find((a) => a.id === id);
const good = { app: 'imageeditor', slug: 'getting-started', crumb: 'Getting started', title: 't', description: 'd', h1: 'Getting started with Image Editor', lead: 'l',
  sections: [{ h2: 'Open a picture', steps: ['Drop it', 'Look'] }, { h2: 'Layers', text: ['Each layer…'], image: { src: '/assets/shots/imageeditor.jpg', alt: 'The Layers panel' } },
    { h2: 'Save', text: ['Export.'], tip: 'Ctrl+S saves.' }], shortcuts: [['Ctrl+Z', 'Undo']] };

test('checks: at least 3 sections with text or steps, images under /assets/ with alt text, shortcut pairs', () => {
  assert.doesNotThrow(() => G.checkGuide(good, app('imageeditor')));
  assert.throws(() => G.checkGuide({ ...good, sections: good.sections.slice(0, 2) }, app('imageeditor')), /3 sections/);
  assert.throws(() => G.checkGuide({ ...good, sections: [...good.sections, { h2: 'Empty' }] }, app('imageeditor')), /text or steps/);
  assert.throws(() => G.checkGuide({ ...good, sections: [...good.sections, { h2: 'Pic', text: ['x'], image: { src: 'https://x.example/a.png', alt: 'a' } }] }, app('imageeditor')), /under \/assets\//);
  assert.throws(() => G.checkGuide({ ...good, shortcuts: [['Ctrl+Z']] }, app('imageeditor')), /pairs/);
});

test('a guide page: the guide sidebar with it marked, its sections listed, the video, the steps and the shortcuts', () => {
  const [p] = G.guidePages(apps, SITE, [good]);
  assert.equal(p.dir, 'imageeditor/getting-started/');
  assert.match(p.html, /<a href="\/imageeditor\/getting-started\/" aria-current="page">Getting started<\/a>/);
  assert.match(p.html, /On this page/);
  assert.match(p.html, /yt-vid00000004\.jpg/);   // Image Editor's tutorial video
  assert.match(p.html, /<ol><li>Drop it<\/li><li>Look<\/li><\/ol>/);
  assert.match(p.html, /<td><code>Ctrl\+Z<\/code><\/td><td>Undo<\/td>/);
  const ld = G.guideJsonLd(good, app('imageeditor'), `${SITE}/imageeditor/getting-started/`, SITE);
  assert.deepEqual(ld.map((x) => x['@type']), ['TechArticle', 'BreadcrumbList', 'VideoObject']);
});

test('every guide in the copy passes the checks', () => {
  for (const g of GUIDES) assert.doesNotThrow(() => G.checkGuide(g, app(g.app)), `${g.app}/${g.slug}`);
});
