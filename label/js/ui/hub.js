/* Label Designer — ui/hub: Hub integration. Announces the app, takes what the page was opened with (?drive=<id> from
 * another app, a PWA launch: through the intake, ui/intake.js), saves the project to Files, and File → Send to (the
 * one builder, TlbxOuttake: the PDF and the PNG of the current label). Off under file:// and offline. */
'use strict';

const hubAvailable = () => !!window.TlbxHub && location.protocol !== 'file:' && !isOfflineBuild();
async function hubBoot() {
  if (hubAvailable()) { try { TlbxHub.register('label'); } catch (e) { /* bus unavailable */ } }
  const r = await launchLabel();
  return !!(r && r.added && r.added.length);
}
/** File ▸ Save: writes the project back to the linked Drive file, or asks for a folder the first time. */
async function saveProjectToDrive() {
  const name = safeName(App.doc.name, '.labeldesigner'), blob = projectBlob(App.doc);
  if (!App.driveId) { const id = await TlbxHub.saveToDrive(blob, name, { from: 'label' }); if (!id) return; linkDrive(id); }
  else if (!(await TlbxHub.update(App.driveId, { blob, name, type: blob.type }))) await TlbxHub.put(blob, { id: App.driveId, name, from: 'label' });
  markSaved();
  status(LT('label.hub.saved', { name }), '', 2500);
}
const pdfBlob = async () => new Blob([await pdfBytes({ prompts: App.prompts })], { type: 'application/pdf' });
/** File → Send to ▸ rows: the PDF to the apps that take PDFs (and Workflows), the PNG to the apps that take only
 *  pictures, and Save PDF / PNG to Files. */
function sendToItems() {
  if (!hubAvailable() || !window.TlbxOuttake) return [];
  const pdfApps = TlbxHub.appsAccepting('application/pdf').map((a) => a.id); // outtake-ok: the ids only, left out of the PNG list
  const tag = (items, kind) => items.map((i) => Object.assign(i, {
    label: i.label === LT('ui.outtake.save_drive') || i.label === 'Save to Files…' ? LT('label.hub.save_kind', { kind }) : i.label.startsWith(LT('label.menu.send_to') + ' ') ? i.label + ' (' + kind + ')' : i.label,
  }));
  const pdf = TlbxOuttake.items({ get: pdfBlob, name: () => fileBase() + '.pdf', type: 'application/pdf', from: 'label', verb: LT('label.menu.send_to') });
  const png = TlbxOuttake.items({ get: () => labelPNGBlob(), name: () => fileBase() + '.png', type: 'image/png', from: 'label', verb: LT('label.menu.send_to'), exclude: pdfApps })
    .filter((i) => /^Send to |^Save to Files/.test(i.label)); // the workflow items are there once, with the PDF
  const save = (items) => items.filter((i) => /^Save /.test(i.label)), send = (items) => items.filter((i) => !/^Save /.test(i.label));
  const p = tag(pdf, 'PDF'), g = tag(png, 'PNG');
  return [...send(p), ...send(g), '-', ...save(p), ...save(g)];
}
