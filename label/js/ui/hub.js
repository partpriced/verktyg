/* Label Designer — ui/hub: Hub integration. Announces the app, opens files other apps sent here
 * (?drive=<id>: images are placed, CSV/Excel become the data source), Files pickers, and
 * File → Send to (PDF to PDF Editor, PNG to Image Editor / Vector Editor). Off under file:// and offline. */
'use strict';

const hubAvailable = () => !!window.TlbxHub && location.protocol !== 'file:' && !isOfflineBuild();
const DRIVE_DATA = ['text/csv', 'text/tab-separated-values', 'text/plain', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
function driveFile(rec) { return new File([rec.blob], rec.name || 'file', { type: rec.type || '' }); }
async function hubBoot() {
  if (!hubAvailable()) return false;
  try { TlbxHub.register('label'); } catch (e) { return false; }
  const rec = await TlbxHub.consumeLaunch().catch(() => null);
  if (!rec) return false;
  const f = driveFile(rec);
  if (/^image\//.test(f.type)) await insertImageFile(f);
  else if (/\.labeldesigner$/i.test(f.name) || /^application\/json$/.test(f.type)) await openProjectFromDrive(rec);
  else if (/\.(zpl|prn)$/i.test(f.name)) await importZPLText(await f.text(), f.name);
  else await importDataDialog(f);
  return true;
}
/** Open a label project from Files; Save then writes back to this same file. Other JSON goes to openFiles. */
async function openProjectFromDrive(rec) {
  const f = driveFile(rec), text = await f.text();
  if (!/"app"\s*:\s*"labeldesigner"/.test(text.slice(0, 400))) return openFiles([f]);
  if (!(await confirmDiscard())) return;
  try { setDoc(parseProject(text)); App.driveId = rec.id; status('Opened ' + f.name, '', 2500); }
  catch (e) { TlbxUI.alert('Could not open ' + f.name, e.message || String(e)); }
}
async function openProjectDrive() {
  if (!hubAvailable()) return TlbxUI.toast('Files is not available here');
  const rec = await TlbxHub.pickFromDrive({ accept: ['application/json'], title: 'Open label from Files' });
  if (rec) await openProjectFromDrive(rec);
}
/** File ▸ Save: writes the project back to the linked Drive file, or asks for a folder the first time. */
async function saveProjectToDrive() {
  const name = safeName(App.doc.name, '.labeldesigner'), blob = projectBlob(App.doc);
  if (!App.driveId) { const id = await TlbxHub.saveToDrive(blob, name, { from: 'label' }); if (!id) return; App.driveId = id; }
  else if (!(await TlbxHub.update(App.driveId, { blob, name, type: blob.type }))) await TlbxHub.put(blob, { id: App.driveId, name, from: 'label' });
  App.dirty = false;
  status('Saved ' + name + ' to Files', '', 2500);
}
async function imageFromDrive() {
  if (!hubAvailable()) return TlbxUI.toast('Files is not available here');
  const rec = await TlbxHub.pickFromDrive({ accept: ['image/*'], title: 'Insert image from Files' });
  if (rec) await insertImageFile(driveFile(rec));
}
async function dataFromDrive() {
  if (!hubAvailable()) return TlbxUI.toast('Files is not available here');
  const rec = await TlbxHub.pickFromDrive({ accept: DRIVE_DATA, title: 'Data from Files' });
  if (rec) await importDataDialog(driveFile(rec));
}
const pdfBlob = async () => new Blob([await pdfBytes({ prompts: App.prompts })], { type: 'application/pdf' });
/** File → Send to ▸ rows. */
function sendToItems() {
  if (!hubAvailable()) return [];
  const pdfApps = TlbxHub.appsAccepting('application/pdf').map((a) => a.id);
  const pdf = TlbxHub.sendMenuItems(pdfBlob, () => fileBase() + '.pdf', 'application/pdf').map((i) => Object.assign(i, { label: i.label + ' (PDF)' }));
  const png = TlbxHub.sendMenuItems(() => labelPNGBlob(), () => fileBase() + '.png', 'image/png')
    .filter((i) => !pdfApps.some((id) => (TlbxHub.appById(id) || {}).name && i.label.endsWith(TlbxHub.appById(id).name)))
    .map((i) => Object.assign(i, { label: i.label + ' (PNG)' }));
  return [...pdf, ...png, '-',
    { label: 'Save PDF to Files', act: async () => { await TlbxHub.put(await pdfBlob(), { name: fileBase() + '.pdf', from: 'label' }); TlbxUI.toast('Saved a PDF to Files'); } },
    { label: 'Save PNG to Files', act: async () => { await TlbxHub.put(await labelPNGBlob(), { name: fileBase() + '.png', from: 'label' }); TlbxUI.toast('Saved a PNG to Files'); } }];
}
