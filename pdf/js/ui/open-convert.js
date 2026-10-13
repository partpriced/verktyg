/* PDF Editor — Convert. The open document (its edits included, as Download would write it) goes to the Convert dialog
   (shared/convert/dialog.js, window.TlbxConvert) from the toolbar button and File ▸ Convert…. The dialog runs the converters
   on this device; a Drive-linked document offers Save to Files for the results. Classic script. */
(function () {
  'use strict';
  var SP = window.SP, U = SP.util, E = SP.engine, A = SP.app, S = A._;

  A.openConvert = function () {
    if (!window.TlbxConvert) { TlbxUI.toast('Convert is not in the offline file. Use the online PDF Editor.'); return; }
    if (!E.state.pages.length) return;
    return S.guarded('Preparing the document…', function () { return A.currentPdfBlob(); }).then(function (blob) {
      if (!blob) return;
      var name = U.safeName(S.els.fileName.value || 'document.pdf', 'pdf');
      window.TlbxConvert.open({ file: new File([blob], name, { type: 'application/pdf' }), drive: !!A.driveId });
    });
  };

  /** Dropped files the app cannot open (SVG, ui/drop-route.js): the Convert dialog takes them, Images to PDF among its targets. */
  A.convertFiles = function (files) {
    if (!window.TlbxConvert) { TlbxUI.toast('Convert is not in the offline file. Use the online PDF Editor.'); return; }
    window.TlbxConvert.open({ files: files });
  };

  var btn = document.getElementById('btnConvert');
  if (btn) {
    btn.addEventListener('click', function () { A.openConvert(); });
    if (SP.offline) btn.hidden = true;
  }
})();
