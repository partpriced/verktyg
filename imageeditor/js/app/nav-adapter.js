/* PhotoTLBX navigation presets: the viewport adapter for shared/nav (wheel, pan, touch and keys).
 * Only this file touches the view: the presets, the engine and the dialog live in shared/nav.
 * Loaded after view.js (V, setZoom, fitView, actualPixels, zoomStep, dirty are its globals). */
(function () {
  'use strict';
  const host = document.getElementById('viewport');
  if (!window.TlbxNav || !host) return;
  const APP = 'imageeditor';
  TlbxNav.attach(APP, {
    title: 'PhotoTLBX',
    host,
    adapter: {
      zoomAt: (f, x, y) => setZoom(V.zoom * f, { x, y }),
      panBy: (dx, dy) => { V.ox += dx; V.oy += dy; dirty(); },
      fit: () => fitView(),
      actual: () => actualPixels(),
      zoomStep: (dir, x, y) => zoomStep(dir, { x, y }),
      // A second finger takes over from a stroke the first finger started.
      cancelStroke: () => { if (V.op) { const t = V.op.tool; if (t.cancel) t.cancel(); V.op = null; dirty(); } },
    },
    shortcuts: TlbxNav.shortcutsFrom({ fit: 'Fit on Screen', actual: '100%', zoomIn: 'Zoom In', zoomOut: 'Zoom Out', handTool: 'Hand Tool' }),
  });
  if (window.TlbxCmd && TlbxCmd.register) {
    TlbxCmd.register([{ id: 'ps.nav-preset', title: 'Navigation preset…', group: 'View', keywords: ['navigation', 'zoom', 'pan', 'wheel', 'trackpad', 'touch', 'preset', 'mouse'], keys: [], run: () => TlbxNav.openModal(APP) }]);
  }
})();
