/* TlbxTour: Video Editor (the videostudio folder). Targets are ids in videostudio/index.html. The words are keys in videostudio/i18n (videoedit.tour.title,
 * videoedit.tour.<step>_title and _text), read when the tour shows them (shared/tour/HANDOFF.md). */
TlbxTour.define({
  app: 'videostudio',
  ns: 'videoedit',
  steps: [
    { id: 'bin', target: '#bin' },
    { id: 'monitor', target: '#monitor' },
    { id: 'inspector', target: '#insp' },
    { id: 'timeline', target: '#timeline' },
    { id: 'undo', target: '#btnUndo' },
    { id: 'export', target: '#btnExport' },
  ],
});
