/* TlbxTour: Image Editor. Targets are ids in imageeditor/index.html. The words are keys in imageeditor/i18n (imageeditor.tour.title,
 * imageeditor.tour.<step>_title and _text), read when the tour shows them (shared/tour/HANDOFF.md). A button the top bar folds
 * into More ▾ when it is narrow (app/topbar-fit.js: .ps-fold) is pointed at through that menu: "#x:not(.ps-fold), #topMore"
 * finds the button, else More ▾. */
TlbxTour.define({
  app: 'imageeditor',
  steps: [
    { id: 'new', target: '#newBtn:not(.ps-fold), #topMore' },
    { id: 'menus', target: '#menubar' },
    { id: 'tools', target: '#toolbox' },
    { id: 'options', target: '#options' },
    { id: 'canvas', target: '#viewport' },
    { id: 'panels', target: '#panels' },
    { id: 'export', target: '#exportBtn' },
    { id: 'theme', target: '#themeToggle:not(.ps-fold), #topMore' },
  ],
});
