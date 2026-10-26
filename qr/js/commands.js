/* QR Code Generator: TlbxCmd commands. Drive, the buffer, the code's downloads and the tabs. Classic script; exposes window.QRCommands. */
(function () {
  'use strict';
  if (window.QRCommands) return;
  const A = () => window.QRApp;
  const ready = () => !!A().last();
  const t = (k, v) => (window.TlbxI18n ? window.TlbxI18n.t(k, v) : k);

  function commandList() {
    const C = (id, title, group, extra = {}) => Object.assign({ id: 'qr.' + id, title, group, keys: [], run: () => {} }, extra);
    const tabs = ['templates', 'content', 'design', 'logo', 'raw', 'batch'];
    const DRIVE = t('qr.cmd.group_drive'), CODE = t('qr.cmd.group_code'), VIEW = t('menu.view');
    return [
      C('save', t('qr.cmd.save'), DRIVE, { keywords: ['store', 'drive', 'settings', 'png'], when: ready, run: () => A().saveDrive() }),
      C('open', t('qr.cmd.open'), DRIVE, { keywords: ['load', 'restore', 'edit again'], run: () => A().openDrive() }),
      C('buffer', t('qr.cmd.buffer'), CODE, { keywords: ['clipboard', 'paste', 'drag', 'share'], when: ready, run: () => A().toBuffer() }),
      C('copy', t('qr.cmd.copy'), CODE, { keywords: ['clipboard', 'payload', 'text'], when: ready, run: () => A().copyText() }),
      C('svg', t('qr.cmd.svg'), CODE, { keywords: ['vector', 'save'], when: ready, run: () => A().downloadSvg() }),
      C('png', t('qr.cmd.png'), CODE, { keywords: ['picture', 'image', 'save', 'transparent'], when: ready, run: () => A().downloadPng() }),
      C('pdf', t('qr.cmd.pdf'), CODE, { keywords: ['print', 'pdf', 'page'], when: ready, run: () => A().downloadPdf() }),
      ...tabs.map((k) => C('tab-' + k, t('qr.cmd.show_tab', { name: A().tabName(k) }), VIEW, { keywords: ['tab', 'panel', 'show'], run: () => A().setTab(k) })),
    ];
  }

  function register() {
    if (!window.TlbxCmd) return;
    TlbxCmd.init({ app: 'qr' });
    TlbxCmd.register(commandList());
    // the titles and groups again after a language change, so the palette follows
    if (window.TlbxI18n && window.TlbxI18n.on) window.TlbxI18n.on(() => TlbxCmd.register(commandList()));
    // the assistant's commands with arguments (js/ai-commands.js), loaded when the AI panel first asks
    if (TlbxCmd.provide) TlbxCmd.provide({ prepare: () => (window.QRAI ? null : new Promise((res, rej) => document.head.append(Object.assign(document.createElement('script'),
      { src: new URL('js/ai-commands.js', location.href).href, onload: res, onerror: () => rej(new Error('Could not load ai-commands.js')) })))) });
  }

  window.QRCommands = { register, commandList };
})();
