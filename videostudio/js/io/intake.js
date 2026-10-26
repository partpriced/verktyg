/* Video Editor: the one way files come in (shared/intake, spec 'videoedit'). Import media (Ctrl+I, the bin's buttons), Open
   project (Ctrl+O), Import from Files, a drop on the window or the strip over the monitor (and its Choose files), a
   drop on a timeline lane (the batch goes where it is dropped), a paste, ?drive=<id> (another app's Send to…, a reel from
   Gallery, a matte pair from Background Remover), Background Remover's 'cutout-result' message, a PWA launch and the sample
   project all call TlbxIntake.take and reach one reader, which reads the whole batch at once:
     data.cutout   a matte pair from Background Remover: placed above its clip (io/cutout.js)
     data.sample   the sample project's media: imported, then laid out by io/sample.js
     a reel        (a Files manifest from Gallery): io/reel.js makes the project
     a matte pair  sent with ?drive= (the record's meta.matteId): io/cutout.js
     data.tl       a drop on a timeline lane: imported and placed there (timeline/menu.js)
     otherwise     SE.app.importFiles: a .videoedit opens (a Drive one stays linked), media go to the bin (and the
                   timeline when the project is empty). */
(function () {
  'use strict';
  const SE = window.SE, SI = window.TlbxIntake;
  const IN = SE.intake = {};
  const REEL = 'application/x-tlbx-reel+json', PROJECT = /\.videoedit$/i;
  IN.RULES = {
    types: ['video/*', 'audio/*', 'image/*', 'application/x-videoedit', 'application/zip', REEL, 'application/json'],
    exts: ['.mp4', '.m4v', '.mov', '.webm', '.mkv', '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.flac', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.videoedit'],
    noun: 'videoedit.io.a_video_audio_picture_or',
  };
  const DRIVE = ['video/*', 'audio/*', 'image/*', 'application/x-videoedit', 'application/zip'];
  const names = (files) => files.map((f) => f.name);

  async function read(files, ctx) {
    const d = ctx.data || {}, rec = files.length === 1 && ctx.drive ? ctx.drive.record : null;
    if (d.cutout) { if (!(await SE.cutout.place(files, d.cutout))) throw new Error('could not be placed'); return names(files); }
    if (d.sample) { const metas = await SE.media.importFiles(files, { from: 'sample' }); return files.map((f) => metas.find((m) => m.name === f.name) || null); }
    if (rec && SE.reel && SE.reel.isManifest(rec)) { await SE.reel.launch(rec); return names(files); }
    if (rec && rec.meta && rec.meta.matteId) { // the colour file came in; its matte is the record's partner in Files
      const m = window.TlbxHub && (await TlbxHub.get(rec.meta.matteId));
      if (!m) throw new Error('came without its matte (it is no longer in Files)');
      if (!(await SE.cutout.place([files[0], new File([m.blob], m.name, { type: m.type })], { clipId: rec.meta.clipId || null }))) throw new Error('could not be placed');
      return names(files);
    }
    const from = ctx.source === 'drive' || ctx.source === 'launch' ? 'drive' : 'file';
    if (d.tl && SE.timeline) { const metas = await SE.timeline.dropFiles(files, d.tl); if (!metas.length) throw new Error('could not be imported'); return names(files); }
    const hasProject = files.some((f) => PROJECT.test(f.name));
    const metas = await SE.app.importFiles(files, { from });
    if (!hasProject && !metas.length) throw new Error('could not be imported');
    return names(files);
  }
  SI.register({ id: 'videoedit', accept: IN.RULES, driveAccept: DRIVE, processAll: read });

  /** Import media… (Ctrl+I): many files, into the bin. */
  IN.importMedia = () => SI.pick({ to: 'videoedit', accept: SE.app.ACCEPT + ',.videoedit' });
  /** Open project (.videoedit)… (Ctrl+O). */
  IN.openProject = () => SI.pick({ to: 'videoedit', multiple: false, accept: '.videoedit,application/zip,' + SE.project.MIME });
  IN.fromDrive = () => SI.fromDrive({ to: 'videoedit', title: SE.util.t('videoedit.bin.import_from_tlbx_drive') });
  /** What the page was opened with (?drive=<id>, a PWA launch). Resolves true when something came in. */
  IN.launch = async () => { const r = await SI.launch({ to: 'videoedit' }); return !!(r && r.added && r.added.length); };
  /** Files (or Files records) another app handed over while Video Editor is open, with what they are for (data). */
  IN.handed = (items, data) => SI.take(items, { to: 'videoedit', source: 'launch', data });
  /** The sample project's media (io/sample.js); resolves their metas in order. */
  IN.sample = async (files) => { const r = await SI.sample(files, { to: 'videoedit', data: { sample: true } }); return r.added.map((a) => a.value).filter(Boolean); };
  /** The drop places: a timeline lane (the batch lands where it is dropped) and the strip over the monitor (the window). */
  IN.attachDrops = function (zone) {
    SI.dropTarget(document.getElementById('timeline'), { to: 'videoedit', data: (e) => ({ tl: SE.timeline ? SE.timeline.dropTarget(e) : null }) });
    TlbxDrop.attach(zone, { intake: 'videoedit', compact: true, targets: [document.getElementById('app')] });
  };
})();
