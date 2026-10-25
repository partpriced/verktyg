// Motion Graphics files: a new project, Files (save and open a project file, kind 'effects', and add media from Drive),
// media from this computer (and relinking a missing one), and the 'effects-project' config kind through shared/config.
// A project references media by name, size and Drive id; the files stay in the media bin. Opening a project reports the
// media it lists that is not in this session, so the person can relink it. Classic script: window.TlbxEffects.io.
(function (g) {
  'use strict';
  const ns = (g.TlbxEffects = g.TlbxEffects || {});
  const P = () => ns.project;
  const M = () => ns.media;
  const DEFAULT_COMP = { width: 1920, height: 1080, fps: 30, duration: 5, background: '#000000' };
  const MEDIA_ACCEPT = 'image/*,video/*';
  const fileName = (doc) => `${String(doc.name || 'Untitled').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'Untitled'}.effects.json`;

  /** Builds the io actions. S, act, ka, ui: the state, the actions, the key actions, and { toast, dialog }. */
  function create(S, act, ui) {
    const toast = (m) => { if (g.TlbxUI) g.TlbxUI.toast(m); else ui.toast && ui.toast(m); };
    const UI = () => g.TlbxUI;

    /** Kind for a picked file or Drive record, or null with a message. */
    function kindFor(type, name) {
      const k = M().kindOf(type);
      if (!k) toast(`${name || 'That file'} is not an image or video`);
      return k;
    }

    /* The one way in (shared/intake, spec 'effects'): Add media (this computer or Files), Relink media, Open project
       from Files, a drop on the view, a paste, ?drive=<id> and a PWA launch. A project file opens; mode 'relink'
       (data.mediaId) points a missing media id at the file; any other picture or video is added as a layer. */
    async function read(f, ctx) {
      if (/json/.test(f.type || '') || /\.json$/i.test(f.name || '')) return openProjectFile(f, ctx.drive ? ctx.drive.id : '');
      const kind = kindFor(f.type, f.name);
      if (!kind) throw new Error('is not an image or video');
      if (ctx.mode === 'relink') {
        const entry = await M().add({ id: ctx.data.mediaId, name: f.name, size: f.size, kind }, f);
        S.edit('Relink media', (d) => ns.layers.addMedia(d, M().info(entry)));
        toast('Relinked ' + f.name);
        return f.name;
      }
      const entry = await M().add({ id: act.nextMediaId(), name: f.name, size: f.size, kind, driveId: ctx.drive ? ctx.drive.id : undefined }, f);
      act.addMediaLayer(entry);
      return f.name;
    }
    g.TlbxIntake.register({ id: 'effects', accept: { types: ['image/*', 'video/*', 'application/json'], exts: ['.json'], noun: 'an image, a video or a Motion Graphics project' }, process: read });
    const importFromComputer = () => g.TlbxIntake.pick({ to: 'effects', accept: MEDIA_ACCEPT });
    const importFromDrive = () => g.TlbxIntake.fromDrive({ to: 'effects', accept: ['image/*', 'video/*'], title: 'Add an image or video from Files' });
    /** Relinks a missing media id to a file from this computer (the layers keep their id). */
    const relink = (mediaId) => g.TlbxIntake.pick({ to: 'effects', mode: 'relink', data: { mediaId }, multiple: false, accept: MEDIA_ACCEPT });
    const launch = () => g.TlbxIntake.launch({ to: 'effects' });

    function newProject() {
      S.replace(ns.core.newDoc({ name: 'Untitled', comp: DEFAULT_COMP }), 'New project');
      S.setFile({ name: '', driveId: '' });
    }

    /**
     * Builds a document from project rows, pairing its media with the bin. A matched item takes the bin's id and record;
     * a missing one gets a fresh id (so it cannot point at another file) and is returned in missing.
     */
    function build(data) {
      const doc = P().fromData(data);
      const { map, missing } = M().match(data.media);
      let next = Math.max(0, ...M().list().map((e) => parseInt(String(e.id).replace(/\D/g, ''), 10) || 0), ...data.media.map((m) => parseInt(String(m.id).replace(/\D/g, ''), 10) || 0)) + 1;
      for (const rec of missing) map.set(rec.id, 'm' + next++);
      const fresh = new Map(missing.map((rec) => [rec.id, map.get(rec.id)]));
      doc.media = data.media.map((rec) => {
        const binId = map.get(rec.id);
        if (binId && !fresh.has(rec.id)) return M().info(M().get(binId));
        return { ...rec, id: binId };
      });
      doc.layers.forEach((l) => { if (l.source.mediaId && map.has(l.source.mediaId)) l.source.mediaId = map.get(l.source.mediaId); });
      return { doc, missing: missing.map((rec) => ({ ...rec, id: fresh.get(rec.id) })) };
    }

    /** Lists the media a project needs that is not in this session (its layers keep the slot; relink from the layer panel). */
    function reportMissing(missing) {
      if (!missing.length) return;
      const items = missing.map((m) => { const li = document.createElement('li'); li.textContent = `${m.name} (${m.kind})`; return li; });
      const list = document.createElement('ul');
      list.append(...items);
      const body = document.createElement('div');
      const p = document.createElement('p');
      p.textContent = 'These files are not in this session. Their layers stay in the project. Select a layer and choose Relink media to point it at the file:';
      body.append(p, list);
      UI().dialog({ title: 'Missing media', body, buttons: [{ label: 'OK', primary: true }] });
    }

    /** Opens rows from a file or a config. Replaces the document (one undo step). */
    function openRows(data, label, file) {
      const problems = P().problems(data);
      if (problems.length) { toast(`Cannot open: ${problems[0]}`); return false; }
      const { doc, missing } = build(data);
      S.replace(doc, label);
      S.setFile(file || { name: '', driveId: '' });
      toast(`Opened ${doc.name}`);
      reportMissing(missing);
      return true;
    }

    async function saveDrive() {
      const doc = S.doc;
      const blob = new Blob([P().toFile(doc)], { type: 'application/json' });
      const name = fileName(doc);
      const meta = { kind: 'effects' };
      if (S.file.driveId && (await g.TlbxHub.get(S.file.driveId))) {
        await g.TlbxHub.put(blob, { id: S.file.driveId, name, from: 'effects', app: 'effects', meta });
        S.setFile({ name: doc.name });
        toast('Saved to Files');
        return;
      }
      const start = await g.TlbxHub.appFolderId('effects');
      const folderId = await g.TlbxHub.pickFolder({ title: `Save “${name}” to Files`, start });
      if (folderId === undefined) return;
      const id = await g.TlbxHub.put(blob, { name, from: 'effects', app: 'effects', meta, folderId });
      S.setFile({ name: doc.name, driveId: id });
      toast('Saved to Files');
    }

    /** A project file (from Files: driveId, so Save writes back to it). Throws the reason when it cannot be opened. */
    async function openProjectFile(f, driveId) {
      const parsed = P().fromFile(await f.text());
      const check = g.TlbxConfig ? P().checkConfig(g.TlbxConfig, parsed.data) : { ok: true, errors: [] };
      if (!check.ok) throw new Error(`cannot be opened: ${check.errors[0] ? check.errors[0].path + ' ' + check.errors[0].message : 'the file is not valid'}`);
      if (!openRows(parsed.data, 'Open ' + parsed.name, { name: parsed.name, driveId })) throw new Error('cannot be opened');
      return f.name;
    }
    const openDrive = () => g.TlbxIntake.fromDrive({ to: 'effects', accept: ['application/json'], title: 'Open a Motion Graphics project' });

    /** Registers the effects-project config kind (import and export through shared/config). */
    function registerConfig() {
      const C = g.TlbxConfig;
      if (!C || !C.registerKind || C.getKind(P().KIND, P().APP)) return;
      C.registerKind(P().KIND, P().APP, P().kindSchema(C.F), async (data) => {
        const problems = P().problems(data);
        if (problems.length) return { ok: false, message: problems[0] };
        const { doc, missing } = build(data);
        S.replace(doc, 'Import config');
        reportMissing(missing);
        return { ok: true };
      }, {
        label: 'Motion Graphics project',
        description: 'Layers, keyframes, effects and composition. Media is listed by name, not included.',
        read: async () => P().toData(S.doc),
      });
    }

    return { importFromComputer, importFromDrive, relink, launch, newProject, saveDrive, openDrive, openRows, registerConfig, build, toast };
  }

  ns.io = { create, DEFAULT_COMP, fileName };
})(typeof window !== 'undefined' ? window : globalThis);
