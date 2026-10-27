/* The brand facts a test needs, in one place: the brand profile's switches, as the same /*profile:key*\/ markers the
 * site's code holds (the white-label build rewrites every marker from the profile, so here they always match the code;
 * tests/node/brand-facts.test.mjs checks that each one equals its marker in the code). A test of a feature a profile can
 * switch off reads its switch here and checks the switch's contract either way, instead of assuming this site's values.
 * Classic script: sets window.BRAND_FACTS (and globalThis.BRAND_FACTS in Node; tests/brand-facts.mjs loads it there).
 *   naming      'brand' (this site's app names) or 'plain' (the PLAIN table in shared/apps.js)
 *   tone        'playful' or 'plain' (brand/copy/plain.json)
 *   mascot      'builtin' (the buddy engine, shared/buddy), 'overlay' (a mascot of the build's own in brand/mascot/, run by
 *               shared/mascot/slot.js) or 'none'
 *   media, analytics   screenshots, clips and videos shown; third parties (analytics, ads, the consent strip)
 *   defaultLang the language a visitor gets when nothing is stored
 *   hideApps    app ids left out of every list
 *   aiModels    the AI models the site hides ({} none; shared/ai/makers.js): { hideOrigins, hideMakers, onlyMakers, hideModels, hideProviders }
 *   seoIndex    search engines may index the site (brand profile seo.index): generated SEO pages, sitemaps, language
 *               folders and hreflang; without it every page says noindex and none of those exist (tools/seo/robots.mjs)
 *   savings     the homepage's yearly savings line and its list (shared/savings) shown
 *   themes      the theme ids the build offers, in menu order (shared/theme/theme.js; the profile's themes.hide left out)
 *   themeBrand  the brand text that names Light and Dark ("<brand> Light"; '' for the plain names)
 *   defaultTheme  the theme of a visitor who never chose one ('system' or a theme id) */
(function (root) {
  'use strict';
  var builtin = /*profile:mascot*/false, overlay = /*profile:mascotOverlay*/true;
  var themes = /*profile:themes*/{"light":{"background":"#f9fafb","surface":"#ffffff","text":"#030712","accent":"#b42318","border":"#6b7280"},"dark":{"background":"#111827","surface":"#1f2937","text":"#f9fafb","accent":"#fda29b","border":"#6b7280"},"hide":["classic","lime"],"brand":"ITpris"}, hide = themes.hide || [];
  root.BRAND_FACTS = Object.freeze({
    naming: /*profile:naming*/"plain",
    tone: /*profile:tone*/"plain",
    mascot: builtin ? 'builtin' : overlay ? 'overlay' : 'none',
    media: /*profile:media*/false,
    analytics: /*profile:analytics*/false,
    defaultLang: /*profile:defaultLang*/"sv",
    hideApps: Object.freeze(/*profile:hideApps*/[]),
    aiModels: Object.freeze(/*profile:aiModels*/{}),
    seoIndex: /*profile:seoIndex*/true,
    savings: /*profile:savings*/true,
    themes: Object.freeze(['light', 'dark', 'classic', 'lime'].filter(function (id) { return hide.indexOf(id) < 0; })),
    themeBrand: themes.brand || '',
    defaultTheme: /*profile:defaultTheme*/"light",
  });
})(typeof window !== 'undefined' ? window : globalThis);
