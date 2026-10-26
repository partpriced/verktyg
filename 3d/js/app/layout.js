/* 3D Modeller: workspace layouts (shared/layouts). Mounts the outliner, viewport and inspector on the .workspace grid;
   the top bar stays put (Save is at the foot of the Properties panel). Below 900 px the viewport fills the screen and the panels are TlbxSheets (shared/ui/sheet.js):
   the Scene outliner a drawer from the left, the Properties a bottom sheet, each opened and closed by its button over the
   viewport, with the shared ×, Escape, a tap outside and a swipe. Classic script. */
(function () {
  'use strict';
  const PHONE = '(max-width: 900px)', $ = (s) => document.querySelector(s);
  const t = (k) => (window.TlbxI18n ? TlbxI18n.t(k) : k);
  if (window.TlbxLayouts) {
    TlbxLayouts.mount({
      app: '3d',
      root: $('.workspace'),
      phone: PHONE,
      panels: {
        outliner: { el: $('.panel-left') },
        viewport: { el: $('.viewport') },
        inspector: { el: $('.panel-right') },
      },
    });
  }
  if (!window.TlbxSheet) return;
  const root = $('.workspace');
  const scene = TlbxSheet.attach({ root, panel: $('.panel-left'), side: 'start', phone: PHONE, toggles: [$('#btnScene')], get label() { return t('3d.app.scene'); } });
  const props = TlbxSheet.attach({ root, panel: $('.panel-right'), phone: PHONE, toggles: [$('#btnProps')], get label() { return t('3d.app.properties'); } });
  window.Tlbx3DSheets = { scene, props };   // for the tests
  // The suite rule (shared/frame/HANDOFF.md): Save, the main button, sits at the foot of the Properties panel (the shared
  // footer, shared/frame/panel.js); on a phone the closed Properties sheet still shows it. Ctrl+S and File ▸ Save too.
  if (window.TlbxFramePanel) {
    const fp = TlbxFramePanel.create($('.panel-right'), { bare: true });
    const foot = () => fp.footer([{ el: $('#btnSave') }], { more: t('3d.app.properties'), onMore: () => props.toggle() });
    foot();
    if (window.TlbxI18n && TlbxI18n.on) TlbxI18n.on(foot);   // the More button in the new language
  }
})();
