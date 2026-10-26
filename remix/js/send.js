/* Video Remix: send the project to Video Editor through Files, the way Gallery sends a reel. Every clip is
   stored in Drive, the manifest (type application/x-tlbx-reel+json, with the remix options) is stored too, and
   Video Editor opens the manifest with ?drive=<id>. Video Editor replays the same plan from the same options. */
(function () {
  'use strict';
  const RM = window.RM;
  const TYPE = 'application/x-tlbx-reel+json';
  /** Store the clips and the manifest in Files, then open Video Editor on the manifest. */
  RM.sendToVideoStudio = async function () {
    const st = RM.state;
    if (!window.TlbxHub) { $('rm-status').textContent = RM.t('remix.send.no_drive'); return null; }
    if (!RM.media().length) { $('rm-status').textContent = RM.t('remix.ui.add_first'); return null; }
    if (!st.plan) RM.remix();
    $('rm-status').textContent = RM.t('remix.send.sending');
    const ids = [];
    for (const it of RM.media()) ids.push(await TlbxHub.put(it.file, { name: it.name, from: 'remix' }));
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '.');
    const blob = new Blob([JSON.stringify(RM.manifest(ids), null, 1)], { type: TYPE });
    const name = 'Remix ' + stamp + '.reel.json'; // i18n-ignore: a file name
    const mid = await TlbxHub.put(blob, { name, from: 'remix' });
    await window.TlbxOuttake.send('videoedit', { id: mid, name, type: TYPE, from: 'remix' }); // the one way out, no copy
    $('rm-status').textContent = RM.t('remix.send.opened', { n: ids.length, name });
    return mid;
  };
  function $(id) { return document.getElementById(id); }
})();
