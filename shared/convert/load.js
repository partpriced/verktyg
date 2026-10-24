/* What the Convert dialog (dialog.js) needs on a page that did not load it: the dialog kit (TlbxUI), the drop zone
 * (TlbxDrop), the dialog's own styles, and Hub (Save to Files, Open in…) once there are results. Each file loads
 * once, in order; a file the page already has (same URL, or its global) is skipped. Through TlbxLoad where the page has it.
 *   deps() -> Promise   hub() -> Promise<TlbxHub>   url(rel) -> absolute URL of a site-root path */
const ROOT = new URL('../../', import.meta.url);
const done = new Map();

export const url = (rel) => new URL(rel, ROOT).href;

function script(rel) {
  const src = url(rel);
  if (window.TlbxLoad && window.TlbxLoad.script) return window.TlbxLoad.script(src);
  if ([...document.scripts].some((s) => s.src === src && !s.dataset.cvtLoading)) return Promise.resolve();
  if (!done.has(src)) done.set(src, new Promise((res, rej) => {
    const s = Object.assign(document.createElement('script'), { src, async: false });
    s.dataset.cvtLoading = '1';
    s.onload = () => { delete s.dataset.cvtLoading; res(); };
    s.onerror = () => { done.delete(src); s.remove(); rej(new Error('Could not load ' + rel)); };
    document.head.append(s);
  }));
  return done.get(src);
}

function css(rel) {
  const href = url(rel);
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href === href)) return;
  document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
}

let ready = null;
/** TlbxUI, the intake pipeline (shared/intake), TlbxDrop (panel, drop) and dialog.css. */
export function deps() {
  if (!ready) ready = (async () => {
    css('shared/convert/dialog.css');
    if (!window.TlbxUI) { css('shared/tlbxui.css'); await script('shared/tlbxui.js'); }
    const SI = () => window.TlbxIntake || {};
    if (!SI().rules) await script('shared/intake/rules.js');
    if (!SI().normalize) await script('shared/intake/normalize.js');
    if (!SI().createPipeline) await script('shared/intake/pipeline.js');
    if (!SI().take) await script('shared/intake/intake.js');
    if (!SI().pick) await script('shared/intake/sources.js');
    if (!(window.TlbxDrop || {}).panel) await script('shared/drop/panel.js');
    if (!(window.TlbxDrop || {}).attach) await script('shared/drop/drop.js');
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

/** Hub (and the app registry it reads), for saving results to Files and opening them in another app. */
export async function hub() {
  if (!window.TLBX_APPS) await script('shared/apps.js');
  if (!window.TlbxHub) await script('shared/hub.js');
  if (!window.TlbxOuttake) await script('shared/intake/outtake.js');   // the one "Open in…" builder (TlbxHub.openIn)
  if (!window.TlbxWorkflowEntry) await script('shared/ops/entry.js');  // its Run a workflow… and Add to a workflow… items
  return window.TlbxHub;
}
