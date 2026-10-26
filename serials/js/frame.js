/* Serial Counter: the tool as the suite's View · Panel (shared/frame): the photos, the serials and the totals in the
 * middle, and on the right the serial pattern, the downloads and Clear, with "Read photos" stuck to the panel's foot (the
 * suite rule, shared/frame/HANDOFF.md). Phones: the panel is a bottom sheet whose foot (Options + Read photos) always
 * shows. The controls stay in the page's markup (the menu bar names them) and the panel adopts them; js/app.js wires them.
 * Classic script, before the app module runs. */
(function (g) {
  'use strict';
  const t = (k) => (g.TlbxI18n ? g.TlbxI18n.t(k) : k);
  const $ = (id) => document.getElementById(id);
  const fr = g.TlbxFrame.mount($('ui'), {
    list: null, view: $('srView'), panel: $('srSide'), phone: '(max-width: 760px)', panelLabel: 'serials.app.options',
    storageKey: 'serials', button: '.smb-tools', phoneButton: false, width: 300, min: 260,
  });
  const panel = g.TlbxFrame.panel($('srSide'), { title: t('serials.app.count_serials') });
  // built again on a language change, so the panel's words follow it
  function draw() {
    panel.setTitle(t('serials.app.count_serials'));
    panel.render([
      { title: t('serials.app.pattern'), key: 'pattern', settings: $('srPattern') },
      { title: t('serials.app.save'), key: 'save', actions: ['export-serials', 'export-photos', 'clear'].map((id) => ({ el: $(id) })) },
    ]);
    panel.footer([{ el: $('read') }], { more: t('serials.app.options') });
  }
  draw();
  if (g.TlbxI18n && g.TlbxI18n.on) g.TlbxI18n.on(draw);
  g.TlbxSerialsFrame = { frame: fr, panel };
})(typeof window !== 'undefined' ? window : globalThis);
