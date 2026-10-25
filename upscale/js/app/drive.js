/* Upscaler: Files. Results go to a "Upscaler" folder at the Drive root (tagged app: upscale). Classic script;
 * adds TlbxUpscale.drive. Needs shared/hub.js (TlbxHub); without it, available() is false.
 *   available()                  whether the hub is on this page
 *   save(blob, name, meta)       Promise<id>  saves a result into the folder
 * Files come in from Files through the intake (TlbxIntake.fromDrive and launch, app/main.js). */
(function (g) {
  'use strict';
  const U = (g.TlbxUpscale = g.TlbxUpscale || {}), D = (U.drive = {});
  const FOLDER = 'Upscaler', APP = 'upscale';
  const hub = () => g.TlbxHub || null;
  let folderP = null;

  D.available = () => !!hub();

  function folder() {
    if (!folderP) folderP = (async () => {
      const H = hub();
      const roots = await H.listFolders({ parentId: null, trashed: false });
      const found = roots.find((f) => f.app === APP) || roots.find((f) => f.name === FOLDER);
      return found ? found.id : H.createFolder(FOLDER, null, { app: APP });
    })().catch((e) => { folderP = null; throw e; });
    return folderP;
  }

  D.save = async function (blob, name, meta = {}) {
    const folderId = await folder();
    return hub().put(blob, { name, from: APP, folderId, meta });
  };
})(typeof window !== 'undefined' ? window : globalThis);
