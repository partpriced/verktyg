/* TlbxTour: Background Remover (the bgremover folder). Targets are ids in bgremover/index.html. The words are keys in bgremover/i18n (cutout.tour.title,
 * cutout.tour.<step>_title and _text), read when the tour shows them (shared/tour/HANDOFF.md). */
TlbxTour.define({
  app: 'bgremover',
  ns: 'cutout',
  steps: [
    { id: 'stage', target: '#stage' },
    { id: 'undo', target: '#btnUndo' },
    { id: 'settings', target: '#props' },
    { id: 'download', target: '#btnDownload' },
  ],
});
