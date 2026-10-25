/* Paste: boot. Loads the pastes from Files, opens the paste named by ?paste=<id> (a share link) or the one
 * open last (TlbxSession), and wires the screen, the paste handler, the menus, the commands and the save indicator. */
import * as store from './store.js';
import { S } from './state.js';
import * as A from './actions.js';
import { renderAll, wireView } from './view.js';
import { registerCommands, resolveMenu } from './commands.js';
import { $ } from './dom.js';

function wire() {
  $('pb-new').addEventListener('click', () => A.newPaste({ kind: 'text' }));
  $('pb-add-img').addEventListener('click', () => A.addImage());
  $('pb-side-btn').addEventListener('click', () => A.setPane('list'));
  $('pb-cmd').addEventListener('click', () => { if (window.TlbxCmd && TlbxCmd.open) TlbxCmd.open(); });
  $('pb-link-copy').addEventListener('click', () => {
    const v = $('pb-link').value;
    navigator.clipboard.writeText(v).then(() => TlbxUI.toast('Link copied'), () => { $('pb-link').select(); TlbxUI.toast('Select the link and copy it'); });
  });
  wireView(A);
  A.registerIntake();
  document.addEventListener('paste', (e) => A.onPaste(e)); // intake-ok: pasted text (a pasted picture is the intake's)
  if (window.TlbxCtx) TlbxCtx.bind($('pb-app'), resolveMenu);
}

/** The save indicator, and the guard that asks before leaving while a paste is not yet in Files. */
function wireSaves() {
  store.onSaveState((state, err) => {
    const t = $('pb-save');
    t.dataset.state = state;
    t.textContent = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved to Files' : 'Not saved: ' + ((err && err.message) || 'Files is unavailable');
    if (window.TlbxGuard) TlbxGuard.setUnsaved('paste', store.hasPending());
  });
  addEventListener('pagehide', () => { store.flush(); });
}

async function openStart() {
  const link = new URL(location.href).searchParams.get('paste');
  if (link) { A.openLink(link); return; }
  let last = null;
  try { last = await TlbxSession.load('paste', 'last', null); } catch (e) { last = null; }
  if (last && last.id && S.pastes.some((p) => p.id === last.id)) A.open(last.id);
}

async function boot() {
  TlbxHub.register('paste');
  wire();
  wireSaves();
  registerCommands();
  try {
    S.pastes = await store.load();
    await openStart();
    // First visit (nothing saved yet): open a new paste straight away, so the editor is ready to type in.
    if (!S.pastes.length && !S.id) await A.newPaste({ kind: 'text' });
  } catch (e) {
    TlbxUI.toast('Could not read Files: ' + e.message);
  }
  renderAll();
  document.body.classList.add('ready');
}

boot();
