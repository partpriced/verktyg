/* TlbxTour: 3D Modeller (the 3d folder). Targets are ids in 3d/index.html. */
TlbxTour.define({
  app: '3d',
  title: '3D Modeller tour',
  steps: [
    { id: 'add', title: 'Add', text: 'Add a shape or a model to the scene.', target: '#btnAdd' },
    { id: 'open', title: 'Open', text: 'Open a 3D file to work on.', target: '#btnOpen' },
    { id: 'view', title: 'Viewport', text: 'Drag to orbit, Shift-drag to pan, wheel to zoom. Press F to frame the selection.', target: '#view' },
    { id: 'outliner', title: 'Outliner', text: 'Every object in the scene. Select one here to edit it.', target: '#outliner' },
    { id: 'edit', title: 'Edit mesh', text: 'Edit vertices, edges and faces. Tab turns edit mode on and off.', target: '#btnEdit' },
    { id: 'export', title: 'Export', text: 'Export the scene to a file.', target: '#btnExport' },
  ],
});
