/* Image Editor: workspace layouts (shared/layouts). Mounts the tools, the document area and the docked panels on the
   .main grid; the menu bar, option bar and status bar stay put. Below 900 px the layout steps aside. Classic script. */
(function () {
  'use strict';
  if (!window.TlbxLayouts) return;
  const main = document.querySelector('.main');
  TlbxLayouts.mount({
    app: 'imageeditor',
    root: main,
    phone: '(max-width: 900px)',
    // Show / Hide Panels (Tab) sets body.no-panels: the layout steps aside, and comes back when it is cleared.
    active: () => !document.body.classList.contains('no-panels'),
    panels: {
      canvas: { el: main && main.querySelector('.docarea') },
      tools: { el: document.getElementById('toolbox') },
      panels: { el: document.getElementById('panels') },
    },
  });
  new MutationObserver(() => TlbxLayouts.refresh('imageeditor')).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
