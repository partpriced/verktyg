/* Compare: the header (TlbxAppBar), mounted by a classic script before shell/shell.js, so the shell finds the header
 * and adds its buttons (Theme, Apps, the bell) and brand/brand.js draws the app's icon in the home link. The page's module
 * (main.js) runs later and fills the bar's actions through window.TlbxCompareBar. */
(function () {
  'use strict';
  const t = (k) => (window.TlbxI18n ? window.TlbxI18n.t(k) : k);
  window.TlbxCompareBar = window.TlbxAppBar.mount(document.getElementById('df-bar'), {
    home: '../', title: 'Compare', subtitle: t('diff.app.subtitle'), actions: [], menu: [],
  });
  if (window.TlbxI18n && window.TlbxI18n.on) window.TlbxI18n.on(() => window.TlbxCompareBar.setSubtitle(t('diff.app.subtitle')));
})();
