/* The workflow dialog: Workflows' whole tool (workflows/js/ui/mount.js mountWorkflow, the one workflow UI) in a
 * TlbxUI dialog over any page, compact (templates and saved workflows under "Open ▾"). Large on wide screens, the whole
 * screen on phones. Files dropped anywhere on it are added. Loaded on first use only: the "Run a workflow…" command of
 * every page with shared/commands, and TlbxWorkflowEntry (shared/ops/entry.js) for menus such as the shared Open in….
 *   const ctl = open({ files, workflow, ask, title })
 *     files      File[] (or { name, blob }) to start with
 *     workflow   a template id, a workflow document or .tlbxflow text to open
 *     ask        with no files given (the default then), the page's app is asked for what it has open, through the same
 *                event File Converter's dialog uses (tlbx:convert-files, shared/convert/provided.js); the dialog says from where
 *   ctl.ready (resolves with the tool once it is up), ctl.done (when it closes), ctl.tool, ctl.close()
 * Nothing is uploaded. */
import { mountWorkflow } from '../../workflows/js/ui/mount.js';
import { ask as askApp } from '../convert/provided.js';
import { scripts } from './load.js';
import { t } from './i18n.js';

const g = globalThis;
const NEEDS = [
  ['shared/tlbxui.js', () => g.TlbxUI], ['shared/intake/rules.js', () => g.TlbxIntake && g.TlbxIntake.rules], ['shared/intake/normalize.js', () => g.TlbxIntake && g.TlbxIntake.normalize], ['shared/intake/pipeline.js', () => g.TlbxIntake && g.TlbxIntake.createPipeline],
  ['shared/intake/intake.js', () => g.TlbxIntake && g.TlbxIntake.take], ['shared/intake/sources.js', () => g.TlbxIntake && g.TlbxIntake.pick], ['shared/drop/panel.js', () => g.TlbxDrop && g.TlbxDrop.panel],
  ['shared/drop/drop.js', () => g.TlbxDrop && g.TlbxDrop.attach], ['shared/ui/flow.js', () => g.TlbxFlow], ['shared/ui/menubutton.js', () => g.TlbxMenuButton],
  ['shared/ui/undo.js', () => g.TlbxUndo], ['shared/frame/panel.js', () => g.TlbxFramePanel], ['shared/db/query.js', () => g.TlbxDbQuery],
  ['shared/db/db.js', () => g.TlbxDb], ['shared/firstrun/notice.js', () => g.TlbxFirstRun], ['shared/apps.js', () => g.TLBX_APPS], ['shared/hub.js', () => g.TlbxHub], ['shared/intake/outtake.js', () => g.TlbxOuttake],
];
const CSS = ['shared/tlbxui.css', 'shared/ops/dialog.css'];
const ROOT = new URL('../../', import.meta.url).href;

async function deps() {
  for (const rel of CSS) {
    const href = new URL(rel, ROOT).href;
    if (![...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.href === href)) document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
  }
  for (const [rel, have] of NEEDS) await scripts([rel], have);
}

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const asFile = (f) => (f instanceof File ? f : new File([f.blob || f], f.name || 'file', { type: (f.blob || f).type || '' }));

export function open(o = {}) {
  let dlg = null, resolveDone;
  const ctl = { tool: null, done: new Promise((r) => { resolveDone = r; }), close: () => { if (dlg) dlg.close(); } };
  ctl.ready = (async () => {
    await deps();
    let files = (o.files || []).map(asFile), from = null;
    if (!files.length && o.ask !== false) { from = await askApp(); files = from.files; }
    const wrap = el('div', 'sl-wf'), note = el('p', 'sl-wf-from'), host = el('div', 'sl-wf-host');
    note.hidden = !(from && files.length);
    if (from && files.length) note.textContent = t('ui.ops.dialog.from', { app: from.app, files: files.map((f) => f.name).join(', ') });
    wrap.append(note, host, el('p', 'sl-wf-foot', t('ui.ops.dialog.foot')));
    dlg = g.TlbxUI.dialog({ title: o.title || t('ui.ops.dialog.title'), body: wrap, cls: 'sl-wf-dlg', onClose: () => { if (ctl.tool) ctl.tool.destroy(); resolveDone(); } });
    const back = dlg.box.parentElement;
    for (const type of ['dragenter', 'dragover', 'dragleave', 'drop']) back.addEventListener(type, (e) => e.stopPropagation());
    ctl.tool = mountWorkflow(host, { compact: true, files, workflow: o.workflow, drop: { window: false, targets: [back], paste: false } });
    await ctl.tool.ready;
    return ctl.tool;
  })().catch((e) => { console.warn(e); if (g.TlbxUI) g.TlbxUI.toast(t('ui.ops.dialog.failed', { message: String((e && e.message) || e) })); resolveDone(); throw e; });
  return ctl;
}
