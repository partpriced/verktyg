/* TlbxOuttake: the one way files go OUT of an app, the counterpart of TlbxIntake. One builder makes the "Open in…" items
   for the toolbar button, the More menu, File ▸ Send to and every context menu, so they cannot drift apart:
     1. the handovers apps registered for this output (richer than a plain file: Image Editor as a layer with its mask...),
     2. every app in the registry that takes the output's type (TlbxHub.appsAccepting), the file going through Files
        (TlbxHub.sendTo: the target opens on ?drive=<id> and takes it with TlbxIntake.launch),
     3. the items shared features add (TlbxOuttake.extend, e.g. Workflows' "Add to a workflow…"), and the listeners of the
        'tlbx:outtake' event (phase 'items': detail.add(item)),
     4. "Save to Files…".
   TlbxHub.openIn(o) and TlbxHub.sendMenuItems (shared/hub.js) are this builder. Classic script, after shared/hub.js (it
   needs TlbxHub; without it the list is only the extensions). See
   shared/intake/HANDOFF.md.
     TlbxOuttake.items(o) → menu items ({ label, act } and '-', for TlbxUI.menu or an app menu)
       o: { get() → Blob | Promise<Blob>, name: string | () => string, type, from? (the app id, default the page's),
            verb? ('Open in'; 'Send to' for the older menus), folder? (Save to Files…, default true), exclude? [ids] }
     TlbxOuttake.menu(at, o)       opens the items in a TlbxUI menu at an element or { x, y }
     TlbxOuttake.button(o, opts)   a toolbar button "Open in…" that opens the menu under itself
     TlbxOuttake.handover({ from, to, types?, label, run(ctx), replaces? }) → off()   a richer handover to one app
     TlbxOuttake.extend(fn(ctx) → items | null) → off()                               items from a shared feature
     TlbxOuttake.send(to, o)       the plain handover to one app (what an app item does)
   Event 'tlbx:outtake' on document: { phase: 'items', from, type, ctx, add(item) } while a menu is made (the menus are
   often made before the output exists: ctx.name() and ctx.blob() are read only when an item acts), and
   { phase: 'sent', from, to, type, name, id } after a file went out. */
(function () {
  'use strict';
  if (window.TlbxOuttake) return;
  const O = (window.TlbxOuttake = {});
  const H = () => (document.documentElement.dataset.offline ? null : window.TlbxHub || null);
  const toast = (m) => { if (window.TlbxUI && window.TlbxUI.toast) window.TlbxUI.toast(m); };
  const handovers = [], extensions = [];
  const EVENT = 'tlbx:outtake';
  O.EVENT = EVENT;

  const typeMatches = (type, list) => !list || !list.length || list.some((p) => (H() ? H().matches(type, p) : p === type || (p.endsWith('/*') && type.startsWith(p.slice(0, -1)))));
  /** The context every handover and extension gets: the output, read once on first use. */
  function context(o) {
    let blob = null;
    const from = o.from || (H() && H().self && H().self.app) || '';
    const ctx = {
      from, type: o.type || '', data: o.data || null,
      name: () => (typeof o.name === 'function' ? o.name() : o.name) || 'Untitled',
      blob: () => (blob = blob || Promise.resolve().then(() => o.get())),
    };
    return ctx;
  }
  function emit(detail) { document.dispatchEvent(new CustomEvent(EVENT, { detail })); }

  /** The plain handover: the file to Files and the app opened on it (a new tab). Resolves the Drive id. */
  O.send = async function (to, o) {
    const ctx = o && o.blob ? o : context(o);
    const hub = H();
    if (!hub) throw new Error('Files is not available here');
    const app = hub.appById(to);
    const id = await hub.sendTo(to, await ctx.blob(), ctx.name(), { from: ctx.from || undefined });
    emit({ phase: 'sent', from: ctx.from, to, type: ctx.type, name: ctx.name(), id });
    toast('Opened in ' + (app ? app.name : to));
    return id;
  };
  const guard = (fn) => async () => { try { await fn(); } catch (e) { toast('Could not send: ' + ((e && e.message) || e)); } };

  /** The items for one output (see the header). */
  O.items = function (o) {
    o = o || {};
    const ctx = context(o), verb = o.verb || 'Open in', out = [];
    const exclude = new Set(o.exclude || []);
    const hub = H();
    const mine = handovers.filter((h) => (!h.from || h.from === ctx.from) && typeMatches(ctx.type, h.types));
    for (const h of mine) {
      if (h.when && !h.when(ctx)) continue;
      out.push({ label: h.label, act: guard(async () => { const r = await h.run(ctx); emit({ phase: 'sent', from: ctx.from, to: h.to, type: ctx.type, name: ctx.name(), id: r }); }) });
    }
    const replaced = new Set(mine.filter((h) => h.replaces && h.to).map((h) => h.to));
    if (hub) {
      for (const a of hub.appsAccepting(ctx.type)) {
        if (exclude.has(a.id) || replaced.has(a.id) || a.id === ctx.from) continue;
        out.push({ label: verb + ' ' + a.name, act: guard(() => O.send(a.id, ctx)) });
      }
    }
    const extra = [];
    for (const fn of extensions) { try { extra.push(...[].concat(fn(ctx) || [])); } catch (e) { console.warn('TlbxOuttake extension', e); } }
    emit({ phase: 'items', from: ctx.from, type: ctx.type, ctx, add: (item) => { if (item) extra.push(item); } });
    if (extra.length) out.push(...(out.length ? ['-'] : []), ...extra);
    if (hub && o.folder !== false) {
      out.push(...(out.length ? ['-'] : []), { label: 'Save to Files…', act: async () => {
        try {
          const id = await hub.saveToDrive(await ctx.blob(), ctx.name(), { from: ctx.from || undefined });
          if (id) emit({ phase: 'sent', from: ctx.from, to: 'drive', type: ctx.type, name: ctx.name(), id });
        } catch (e) { toast('Could not save: ' + ((e && e.message) || e)); }
      } });
    }
    return out;
  };

  /** Opens the items in a TlbxUI menu at an element (under it) or a point. */
  O.menu = function (at, o) {
    const items = O.items(o);
    const list = items.length ? items : [{ label: 'No app opens this yet', disabled: true }];
    let x = 0, y = 0;
    if (at && at.getBoundingClientRect) { const r = at.getBoundingClientRect(); x = r.left; y = r.bottom + 4; } else if (at) { x = at.x; y = at.y; }
    if (window.TlbxUI && window.TlbxUI.menu) window.TlbxUI.menu(list, x, y);
    return list;
  };
  /** A toolbar button that opens the menu. opts: { label ('Open in…'), cls, title }. o may be a function (read on click). */
  O.button = function (o, opts) {
    opts = opts || {};
    const b = document.createElement('button');
    b.type = 'button';
    b.className = opts.cls || 'sui-btn';
    b.textContent = opts.label || 'Open in…';
    if (opts.title) b.title = opts.title;
    b.setAttribute('aria-haspopup', 'menu');
    b.addEventListener('click', () => O.menu(b, typeof o === 'function' ? o() : o));
    return b;
  };

  /** A richer handover from one app (from) to another (to) for some types: it is listed first, and with replaces: true
   *  it stands in for that app's plain item. run(ctx) does the work (ctx.blob(), ctx.name(), ctx.type). */
  O.handover = function (h) {
    if (!h || !h.label || typeof h.run !== 'function') throw new Error('TlbxOuttake.handover: label and run are needed');
    handovers.push(h);
    return () => { const i = handovers.indexOf(h); if (i >= 0) handovers.splice(i, 1); };
  };
  /** Items from a shared feature for every output (fn(ctx) → items or null). */
  O.extend = function (fn) {
    extensions.push(fn);
    return () => { const i = extensions.indexOf(fn); if (i >= 0) extensions.splice(i, 1); };
  };
})();
