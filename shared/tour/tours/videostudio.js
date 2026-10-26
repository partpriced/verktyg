/* TlbxTour: Video Editor (the videostudio folder). Targets are ids in videostudio/index.html. The words are in videostudio/i18n (videoedit.tour.*), read when the
   tour shows them, so they follow the chosen language. */
(function () {
  const t = (k) => (globalThis.TlbxI18n ? TlbxI18n.t(k) : k);
  const step = (id, target) => ({ id, target, get title() { return t('videoedit.tour.' + id); }, get text() { return t('videoedit.tour.' + id + '_text'); } });
  TlbxTour.define({
    app: 'videostudio',
    get title() { return t('videoedit.tour.title'); },
    steps: [step('bin', '#bin'), step('monitor', '#monitor'), step('inspector', '#insp'), step('timeline', '#timeline'), step('undo', '#btnUndo'), step('export', '#btnExport')],
  });
})();
