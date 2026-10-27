/* The name shown for an app on the homepage. Each registry entry (shared/apps.js) has a descriptive `title`, such as
 * "EML previewer and converter" or "Video Editor: video editor", and the brand `name`. The homepage shows the title, or the brand
 * name when the visitor turns on the switch (remembered in this browser). The registry keeps both; lookups and the sort use `name`. */
(() => {
  'use strict';
  const BRAND_KEY = 'tlbx.home.names';
  window.tlbxBrandNamesOn = () => { try { return localStorage.getItem(BRAND_KEY) === '1'; } catch (e) { return false; } };
  window.tlbxSetBrandNames = (on) => { try { localStorage.setItem(BRAND_KEY, on ? '1' : '0'); } catch (e) { /* storage blocked: the switch still works for this visit */ } };
  // A profile with plain names (shared/apps.js) has one name per app, in the chosen language: tlbxAppName. The title is
  // in the chosen language too (tlbxAppTitle: the SEO tables' words); the brand name stays as it is.
  window.tlbxAppLabel = (a, withBrand) => (window.TLBX_NAMING === 'plain' && window.tlbxAppName ? window.tlbxAppName(a)
    : withBrand ? a.name : window.tlbxAppTitle ? window.tlbxAppTitle(a) : a.title || a.name);
})();
