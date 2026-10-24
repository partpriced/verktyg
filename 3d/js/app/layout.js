/* 3D Modeller: workspace layouts (shared/layouts). Mounts the outliner, viewport and inspector on the .workspace grid;
   the top bar stays put. Below 900 px the viewport fills the screen and the panels are TlbxSheets (shared/ui/sheet.js):
   the Scene outliner a drawer from the left, the Properties a bottom sheet, each opened and closed by its button over the
   viewport, with the shared ×, Escape, a tap outside and a swipe. Classic script. */
(function () {
  'use strict';
  const PHONE = '(max-width: 900px)', $ = (s) => document.querySelector(s);
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
  const scene = TlbxSheet.attach({ root, panel: $('.panel-left'), side: 'start', phone: PHONE, toggles: [$('#btnScene')], label: 'Scene' });
  const props = TlbxSheet.attach({ root, panel: $('.panel-right'), phone: PHONE, toggles: [$('#btnProps')], label: 'Properties' });
  window.Tlbx3DSheets = { scene, props };   // for the tests
})();
