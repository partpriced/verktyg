/* Colours: boot. The header (TlbxAppBar: Open… only, plus the shell's buttons), the suite's View · Panel layout
 * (shared/frame, TlbxFrame: the colour and its values, picture, palette and contrast check in the middle; the settings and
 * Download palette on the right; a bottom sheet on phones whose foot always shows), the drop zone (TlbxDrop, spec 'colors'), a
 * file sent from another app (?drive=) and the redraw on every state change. Classic script, after the other parts. */
(function (g) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => (g.TlbxI18n ? g.TlbxI18n.t(k, v) : k);
  let frame = null, zone = null, bar = null;

  function paint(s) {
    const W = g.CO.swatches;
    g.CO.values.paint(s); W.palette(s); W.generated(s);
    g.CO.contrast.paint(s);
    g.CO.panel.paint(s);
    if (g.CO.picture.has()) g.CO.picture.paintDominant();
  }
  function wireDrop() {
    g.CO.io.register();
    zone = g.TlbxDrop.attach($('co-drop'), {
      intake: 'colors',
      targets: [$('co-drop'), $('co-pic')],
      label: 'colors.drop.label',
      hint: 'colors.drop.hint',
      sample: { label: 'colors.drop.sample', files: () => g.TlbxSamples.photos(1) },
    });
  }
  /** The header's words, again on a language change. */
  function barText() {
    bar.setSubtitle(t('colors.app.subtitle'));
    bar.setActions([{ id: 'open', label: t('colors.app.open'), icon: 'open', onClick: () => g.TlbxIntake.pick({ to: 'colors' }) }]);
  }
  function boot() {
    bar = g.TlbxAppBar.mount($('co-bar'), {
      home: '../', title: 'Colours', subtitle: t('colors.app.subtitle'),
      actions: [{ id: 'open', label: t('colors.app.open'), icon: 'open', onClick: () => g.TlbxIntake.pick({ to: 'colors' }) }], menu: [],
    });
    frame = g.TlbxFrame.mount($('co-main'), { list: null, view: $('co-view'), panel: $('co-panel'), panelLabel: 'ui.settings',
      storageKey: 'colors', phone: '(max-width: 860px)', phoneButton: false, width: 320, min: 280, max: 480 });
    g.CO.panel.mount($('co-panel'));
    g.CO.swatches.wire(); g.CO.picture.wire(); g.CO.contrast.wire();
    $('co-pic-open').addEventListener('click', () => g.TlbxIntake.pick({ to: 'colors', accept: 'image/*' }));
    wireDrop();
    g.CO.state.on(paint);
    paint(g.CO.state.get());
    // a language change: the header, the panel's sections and every text drawn from the state, in the new language
    if (g.TlbxI18n && g.TlbxI18n.on) g.TlbxI18n.on(() => { barText(); g.CO.panel.redraw(); paint(g.CO.state.get()); });
    if (g.TlbxHub) g.TlbxHub.register('colors');
    g.TlbxIntake.launch({ to: 'colors' });
  }
  g.CO.main = { frame: () => frame, dropEmpty: (on) => { if (zone && zone.empty) zone.empty(on); }, paint: () => paint(g.CO.state.get()) };
  document.addEventListener('DOMContentLoaded', () => {
    try { boot(); } catch (e) { console.error(e); if (g.TlbxUI) g.TlbxUI.toast(t('colors.app.start_failed', { msg: e.message })); }
    document.body.classList.add('ready');
  });
})(window);
