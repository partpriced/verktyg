/* QR Code Generator: boot. Builds the single view and the batch view, wires the Commands button, registers the TlbxCmd commands,
 * and marks the page ready for the tests. Classic script, runs once the page is parsed. */
(function () {
  'use strict';
  function boot() {
    window.QRApp.init();
    window.QRBatch.init();
    document.getElementById('qr-cmd').addEventListener('click', () => { if (window.TlbxCmd && TlbxCmd.open) TlbxCmd.open(); });
    window.QRCommands.register();
    document.body.classList.add('ready');
  }
  document.addEventListener('DOMContentLoaded', () => {
    try { boot(); } catch (e) {
      console.error(e);
      document.body.classList.add('ready');
      if (window.TlbxUI) TlbxUI.toast('QR Code Generator could not start: ' + e.message);
    }
  });
})();
