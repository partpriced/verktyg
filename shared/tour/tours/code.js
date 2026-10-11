/* TlbxTour: Code Editor. Targets are ids in code/index.html. */
TlbxTour.define({
  app: 'code',
  title: 'Code Editor tour',
  steps: [
    { id: 'open', title: 'Open', text: 'Open a file from Files (Ctrl+O). New starts a new one.', target: '#cd-open' },
    { id: 'save', title: 'Save', text: 'Save to the same Files file (Ctrl+S). Save as makes a copy.', target: '#cd-save' },
    { id: 'explorer', title: 'Explorer', text: 'Your files from Files, in folders. Open a file to edit it.', target: '#cd-tree' },
    { id: 'editor', title: 'Editor', text: 'Write your code here.', target: '#cd-editor' },
    { id: 'run', title: 'Run', text: 'Run the preview (Ctrl+Enter).', target: '#cd-run' },
    { id: 'console', title: 'Console', text: 'Output from the preview appears here.', target: '#cd-console' },
  ],
});
