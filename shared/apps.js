/* The ITpris Verktyg app registry: the single source of truth for every app, game and experiment.
 * Used by the homepage, the cross-app "Send to…" menus (hub.js) and the status board.
 * Classic script: sets window.TLBX_APPS. Paths are relative to the site root.
 *   kind:    app | game | experiment
 *   status:  live | beta | building
 *   accepts: MIME patterns the app can open from Files (for "Send to…") */
(function () {
  'use strict';
  const A = (id, kind, name, path, tagline, extra = {}) => Object.assign({ id, kind, name, path, tagline, status: 'live', accepts: [], features: [] }, extra);
  window.TLBX_APPS = [
    A('imageeditor', 'app', 'PhotoTLBX', 'imageeditor/', 'Photoshop, rebuilt for the browser.', {
      accepts: ['image/*', 'image/vnd.adobe.photoshop', 'application/x-openraster'],
      features: ['Layers, masks & 17 blend modes', 'Real PSD open & save', '50+ filters, brush packs, .abr import', 'Tabs, autosave, offline .html'],
      shot: 'assets/shots/imageeditor.jpg', icon: 'brush' }),
    A('vector', 'app', 'Vector Editor', 'vector/', 'Illustrator, rebuilt for the browser.', {
      accepts: ['image/svg+xml', 'image/*'],
      features: ['Pen, shapes, type & layers', 'Real pathfinder booleans', 'SVG, PNG, PDF & .ai export', 'Offline .html'],
      shot: 'assets/shots/vector.jpg', icon: 'pen' }),
    A('pdf', 'app', 'PDF Editor', 'pdf/', 'Organise, edit and sign PDFs. Nothing uploaded.', {
      accepts: ['application/pdf', 'image/*'],
      features: ['Reorder, merge & split', 'Text, shapes, images & signatures', 'Page numbers, watermarks, forms', 'Compress & convert'],
      shot: 'assets/shots/pdf.jpg', icon: 'doc' }),
    A('label', 'app', 'Label Designer', 'label/', 'Design and print barcode labels.', {
      accepts: ['image/*', 'text/csv'],
      features: ['Barcodes & QR, GS1', 'Data merge from CSV & Excel', 'Zebra ZPL export & import', 'Sheets & thermal rolls'],
      shot: 'assets/shots/label.jpg', icon: 'tag', status: 'beta' }),
    A('lighter', 'experiment', 'Lighter', 'lighter/', 'Flick it. Strike it. ITpris flames.', { shot: 'assets/shots/lighter.jpg' }),
    A('unsubscribe', 'experiment', 'Unsubscribe', 'unsubscribe/', 'Every dark pattern on the internet, in one form.', { shot: 'assets/shots/unsubscribe.jpg' }),
    A('authenticator', 'experiment', 'AI Text Detector', '#detector', 'Check whether a text reads as machine-written.', { shot: 'assets/shots/authenticator.jpg' }),
    A('paint-classic', 'experiment', 'Paint Classic', 'imageeditor/classic/', 'The 1998 experience. Every MS Paint tool.', { shot: 'assets/shots/paint-classic.jpg' }),
  ];
})();
