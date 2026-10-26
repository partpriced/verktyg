/* TlbxTour: Font Creator. Targets are ids in fontcreator/index.html. The words are keys in fontcreator/i18n (fontcreator.tour.title,
 * fontcreator.tour.<step>_title and _text), read when the tour shows them (shared/tour/HANDOFF.md). */
TlbxTour.define({
  app: 'fontcreator',
  steps: [
    { id: 'grid', target: '#fc-list' },
    { id: 'draw', target: '#fc-stage' },
    { id: 'start', target: '#fc-start' },
    { id: 'kerning', target: '#fc-tab-kerning' },
    { id: 'test', target: '#fc-tab-test' },
    { id: 'panel', target: '#fc-panel' },
  ],
});
