/* The shared components the contrast sweep opens on an app page (tests/a11y/sweep.js), each where an app opens it:
 * a TlbxUI dialog (text, fields, a select, a check box, buttons), a TlbxUI menu (with a disabled row and key hints), a
 * toast with its action, a TlbxMenuButton list (search, a heading, the chosen row), the Drive picker, the command palette,
 * the AI panel (a sheet on a phone) and the Convert dialog with its conversion menu. Each one is audited with
 * TlbxContrast, and the focused row of each menu must show its focus (outline or background) at 3:1 or more, the chosen
 * row's check mark too.
 *   TlbxContrastKit.components(win, { heavy }) -> [{ name, fails: [...] }]   heavy: also the Convert dialog and the AI panel */
(function (g) {
  'use strict';
  const C = () => g.TlbxContrast;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(fn, ms = 6000) { const t = Date.now(); for (;;) { const v = fn(); if (v) return v; if (Date.now() - t > ms) return null; await sleep(40); } }
  function script(W, src) {
    return new Promise((res) => {
      const s = W.document.createElement('script');
      s.src = src; s.onload = () => res(true); s.onerror = () => res(false);
      W.document.head.append(s);
    });
  }
  const key = (W, el, k) => el.dispatchEvent(new W.KeyboardEvent('keydown', { key: k, bubbles: true }));
  /** Focus contrast of a menu's rows: the focused one keeps 3:1 against the menu. */
  function focusCheck(W, row, name) {
    if (!row) return [];
    row.focus();
    const f = C().indicator(W, row);
    return !f || f.ratio < 3 ? [{ sel: name + ' focused row', text: row.textContent.trim().slice(0, 30), fg: '', bg: '', ratio: f ? Math.round(f.ratio * 100) / 100 : 0, need: 3, kind: f ? f.kind : 'none' }] : [];
  }
  function markCheck(W, mark, name) {
    if (!mark) return [];
    const r = C().audit(W, { root: mark.parentElement }).fails.filter((x) => x.text === mark.textContent.trim());
    return r.filter((x) => x.ratio < 3).map((x) => Object.assign(x, { sel: name + ' check mark' }));
  }

  async function dialog(W) {
    const U = W.TlbxUI, el = U.el;
    const inp = el('input', { class: 'sui-input', value: 'Typed value' }), ph = el('input', { class: 'sui-input', placeholder: 'Placeholder text' });
    const ck = U.check('A check box', true);
    const body = el('div', null, el('p', { class: 'sui-p' }, 'A paragraph in a dialog.'), U.field('Name', inp), U.field('Empty', ph, 'px'),
      U.field('Choose', U.select([['a', 'First choice'], ['b', 'Second']], 'a')), ck.el);
    const d = U.dialog({ title: 'Contrast check', body, buttons: [{ label: 'Cancel' }, { label: 'Save', primary: true }] });
    await sleep(220);
    const fails = C().audit(W, { root: d.box }).fails.concat(focusCheck(W, d.box.querySelector('.sui-btn'), 'dialog button'));
    d.close(false); await sleep(160);
    return fails;
  }
  async function menu(W) {
    const m = W.TlbxUI.menu([{ label: 'Copy', key: 'Ctrl+C', act() {} }, { label: 'Paste', disabled: true, act() {} }, '-', { label: 'Checked', check: true, act() {} }], 20, 60);
    await sleep(60);
    const fails = C().audit(W, { root: m }).fails.concat(focusCheck(W, m.querySelector('.sui-row:not([disabled])'), 'TlbxUI menu'));
    W.TlbxUI.closeMenu();
    return fails;
  }
  async function toast(W) {
    W.TlbxUI.toast('Saved to Files', 4000, { label: 'Undo', run() {} });
    const t = await until(() => W.document.querySelector('.sui-toast.sui-show'));
    await sleep(260);
    const fails = t ? C().audit(W, { root: t }).fails : [];
    if (t) t.classList.remove('sui-show');
    return fails;
  }
  async function menuButton(W) {
    if (!W.TlbxMenuButton) await script(W, '/shared/ui/menubutton.js');
    const D = W.document, b = D.createElement('button');
    b.textContent = 'Convert to'; b.style.cssText = 'position:fixed;left:8px;top:8px;z-index:3000';
    D.body.append(b);
    const items = [{ heading: 'PDF' }, { value: 'a', label: 'PDF to images', checked: true }, { value: 'b', label: 'PDF to HTML' },
      { value: 'c', label: 'PDF to Word (DOCX)' }, { heading: 'Other' }, { value: 'd', label: 'Merge PDFs' }, { value: 'e', label: 'Disabled one', disabled: true }];
    const mb = W.TlbxMenuButton.attach(b, { label: 'Convert', items, search: true });
    mb.open();
    await sleep(60);
    const m = mb.menu;
    const fails = C().audit(W, { root: m }).fails.concat(markCheck(W, m.querySelector('.smb-row[aria-checked="true"] .smb-chk'), 'menu button'),
      focusCheck(W, m.querySelector('.smb-row:not([aria-checked="true"]):not([disabled])'), 'menu button'),
      focusCheck(W, m.querySelector('.smb-search'), 'menu button search'));
    mb.destroy(); b.remove();
    return fails;
  }
  async function drivePicker(W) {
    if (!W.TlbxHub || !W.TlbxHub.pickFromDrive) return [];
    W.TlbxHub.pickFromDrive({});
    const box = await until(() => [...W.document.querySelectorAll('.sui-dlg')].pop());
    if (!box) return [];
    await sleep(500);
    const fails = C().audit(W, { root: box }).fails;
    key(W, box, 'Escape'); await sleep(160);
    return fails;
  }
  async function palette(W) {
    if (!W.TlbxCmd || !W.TlbxCmd.open) return [];
    await W.TlbxCmd.open('');
    const box = await until(() => W.TlbxCmd.isOpen && W.document.querySelector('.scmd-back'), 4000);
    await sleep(200);
    const fails = box ? C().audit(W, { root: box }).fails : [];
    W.TlbxCmd.close(); await sleep(120);
    return fails;
  }
  async function aiPanel(W) {
    if (!W.TlbxAIPanel) { const s = W.document.createElement('script'); s.dataset.button = 'false'; s.src = '/shared/ai/panel.js'; W.document.head.append(s); }
    const P = await until(() => W.TlbxAIPanel, 6000);
    if (!P) return [{ sel: 'AI panel', text: 'did not load', fg: '', bg: '', ratio: 0, need: 0 }];
    P.open();
    const box = await until(() => W.document.querySelector('aside.sap:not([hidden])'), 6000);
    await sleep(600);
    const fails = box ? C().audit(W, { root: box }).fails : [];
    P.close(); await sleep(200);
    return fails;
  }
  async function convert(W) {
    const pdf = await (await W.fetch('/tests/drive/fixtures/versions-sample.pdf')).blob();
    const file = new W.File([pdf], 'document.pdf', { type: 'application/pdf' });
    const m = await W.eval('import("/shared/convert/dialog.js")');
    const ctl = m.open({ file });
    await ctl.ready; await sleep(300);
    let fails = C().audit(W, { root: ctl.element }).fails;
    const to = ctl.element.querySelector('.cv-to');
    if (to) {
      to.click(); await sleep(150);
      const menuEl = W.document.querySelector('.smb-menu');
      if (menuEl) fails = fails.concat(C().audit(W, { root: menuEl }).fails, markCheck(W, menuEl.querySelector('.smb-row[aria-checked="true"] .smb-chk'), 'Convert menu'));
      key(W, menuEl || to, 'Escape');
    }
    ctl.close(); await sleep(200);
    return fails;
  }

  async function components(W, opts = {}) {
    const out = [];
    const run = async (name, fn) => {
      try { out.push({ name, fails: await fn(W) }); } catch (e) { out.push({ name, fails: [{ sel: name, text: 'threw: ' + e.message, fg: '', bg: '', ratio: 0, need: 0 }] }); }
    };
    if (!W.TlbxUI) await script(W, '/shared/tlbxui.js');
    if (!W.document.querySelector('link[href*="tlbxui.css"]')) {
      const l = W.document.createElement('link'); l.rel = 'stylesheet'; l.href = '/shared/tlbxui.css'; W.document.head.append(l);
      await new Promise((r) => { l.onload = r; l.onerror = r; });
    }
    await run('dialog', dialog);
    await run('menu', menu);
    await run('toast', toast);
    await run('menu button', menuButton);
    await run('Drive picker', drivePicker);
    await run('command palette', palette);
    if (opts.heavy) { await run('AI panel', aiPanel); await run('Convert dialog', convert); }
    return out;
  }
  g.TlbxContrastKit = { components };
})(typeof window !== 'undefined' ? window : globalThis);
