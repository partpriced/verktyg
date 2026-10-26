/* TlbxTour: Vector Editor. Targets are ids in vectoreditor/index.html. The words are keys in vectoreditor/i18n (vector.tour.title,
 * vector.tour.<step>_title and _text), read when the tour shows them (shared/tour/HANDOFF.md). */
TlbxTour.define({
  app: 'vectoreditor',
  ns: 'vector',
  steps: [
    { id: 'menus', target: '#menus' },
    { id: 'controls', target: '#controlbar' },
    { id: 'tools', target: '#toolbar' },
    { id: 'artboard', target: '#workspace' },
    { id: 'panels', target: '#dock' },
    { id: 'status', target: '#statusbar' },
  ],
});
