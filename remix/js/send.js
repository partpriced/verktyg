/* Video Remix: send the project to VideoEdit through Files, the way Gallery sends a reel. Every clip is
   stored in Drive, the manifest (type application/x-tlbx-reel+json, with the remix options) is stored too, and
   VideoEdit opens the manifest with ?drive=<id>. VideoEdit replays the same plan from the same options. */
(function () {
  'use strict';
  const RM = window.RM;
  const TYPE = 'application/x-tlbx-reel+json';
  /** Store the clips and the manifest in Files, then open VideoEdit on the manifest. */
  RM.sendToVideoEdit = async function () {
    const st = RM.state;
    if (!window.TlbxHub) { $('rm-status').textContent = 'Files is not available here'; return null; }
    if (!RM.media().length) { $('rm-status').textContent = 'Add some clips or photos first'; return null; }
    if (!st.plan) RM.remix();
    $('rm-status').textContent = 'Sending to VideoEdit…';
    const ids = [];
    for (const it of RM.media()) ids.push(await TlbxHub.put(it.file, { name: it.name, from: 'remix' }));
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '.');
    const blob = new Blob([JSON.stringify(RM.manifest(ids), null, 1)], { type: TYPE });
    const name = 'Remix ' + stamp + '.reel.json';
    const mid = await TlbxHub.put(blob, { name, from: 'remix' });
    await TlbxHub.sendTo('videoedit', null, name, { id: mid });
    $('rm-status').textContent = 'Opened in VideoEdit: ' + ids.length + ' clips, manifest ' + name;
    return mid;
  };
  function $(id) { return document.getElementById(id); }
})();
