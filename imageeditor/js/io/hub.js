/* Image Editor: Hub integration. Open files from Files, send the image to other
 * ITpris Verktyg apps, and open whatever another app sent here (?drive=<id>).
 * Works without the hub (offline file, old browsers): every entry point checks for it. */
'use strict';

// The offline single-file edition has no Files (it lives with the website), so the hub is off there.
const hub = () => (document.documentElement.dataset.offline ? null : window.TlbxHub || null);
async function finishPending() {
  if (TE.el) await endTypeEdit();
  if (TRANSFORM.active) commitTransform();
}
async function docBlob(type) {
  await finishPending();
  if (type === 'image/vnd.adobe.photoshop') return new Blob([writePSD()], { type });
  return canvasToBlob(wmApplyExport(flattenCanvas(type === 'image/jpeg' ? '#fff' : null)), type, 0.92);
}
// Open from Files and ?drive=<id> are sources of the one intake (app/intake.js): a tab opened from a Drive file
// remembers its record (CUR.driveId), so Save writes back to that same file.
function openFromDrive(place) {
  return TlbxIntake.fromDrive({ to: 'imageeditor', mode: place ? 'add' : 'new', title: place ? 'Place from Files' : 'Open from Files' });
}
/** File ▸ Save (Ctrl+S): writes the layered PSD back to the linked Drive file, or asks for a folder the first time. */
async function saveDrive() {
  if (!hub()) return savePSD();
  const H = hub(), blob = await docBlob('image/vnd.adobe.photoshop'), name = safeName() + '.psd';
  if (!CUR.driveId) { const id = await H.saveToDrive(blob, name, { from: 'imageeditor' }); if (!id) return; CUR.driveId = id; }
  else { if (!(await H.update(CUR.driveId, { blob, name, type: blob.type }))) await H.put(blob, { id: CUR.driveId, name, from: 'imageeditor' }); toast('Saved ' + name + ' to Files'); }
  D.dirty = false; emit('docname');
}
async function saveToDrive() {
  if (!hub()) return;
  await hub().put(await docBlob('image/png'), { name: safeName() + '.png', from: 'imageeditor' });
  toast('Saved a PNG to Files');
}
/** The "Send to" submenu: one row per app that opens PNGs, plus a PSD copy into Files. */
function sendToMenu() {
  if (!hub()) return [{ label: 'Files is not available here', act: () => {}, en: () => false }];
  const rows = hub().sendMenuItems(() => docBlob('image/png'), () => safeName() + '.png', 'image/png');
  return rows.concat(['-', { label: 'Save PNG to Files', act: () => saveToDrive() }]);
}
/** Called once at boot: announce ourselves and open a file another app sent here (through the intake). */
async function hubBoot() {
  if (hub()) hub().register('imageeditor');
  const got = await TlbxIntake.launch({ to: 'imageeditor', mode: 'new' });
  return !!(got && got.added.length);
}
// Convert… in the header (shared/convert/provided.js): the open image, flattened, as PNG.
addEventListener('tlbx:convert-files', (e) => e.detail.provide(async () => (CUR ? [{ name: safeName() + '.png', blob: await docBlob('image/png') }] : null)));
