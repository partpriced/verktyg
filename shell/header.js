/* TlbxHeader: adds the shell's buttons to the page header: AI (the Assistant panel, loaded on click), the theme menu (every page, from TlbxTheme), "Apps" (opens
 * the switcher), the notifications bell, and Tutorial (the app's YouTube tutorial, when the registry has one). Goes at the end of header.topbar, header.menubar or header.nav, or floats at the
 * top right when the page has no header. Loaded and mounted by shell/shell.js, which applies the language after.
 * The Apps text and the button's aria-label are marked for TlbxI18n; the title is set here (it carries the shortcut). */
(function () {
  'use strict';
  if (window.TlbxHeader) return;
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
  const ICON_THEME = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>';
  const ICON_CONVERT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/></svg>';
  const ICON_AI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>';
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  let sw = null;

  /** The button's title in the chosen language: "Switch app (Ctrl+Space)". English when TlbxI18n is not on the page. */
  function title() {
    const shortcut = (isMac ? '⌘' : 'Ctrl') + '+Space';
    const I = window.TlbxI18n;
    const s = I ? I.t('shell.switch_title', { shortcut }) : '';
    return s && s !== 'shell.switch_title' ? s : 'Switch app (' + shortcut + ')';
  }

  /** The theme button: a menu of System and every theme in TlbxTheme, the current choice checked. None without TlbxTheme. */
  function themeButton() {
    const T = window.TlbxTheme;
    if (!T || !T.THEMES) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sh-hbtn tlbx-hbtn sh-theme';
    b.title = 'Theme';
    b.setAttribute('aria-label', 'Theme');
    b.setAttribute('aria-haspopup', 'menu');
    b.setAttribute('aria-expanded', 'false');
    b.innerHTML = ICON_THEME + '<span class="tlbx-hbtn-txt">Theme</span>';
    b.addEventListener('click', () => {
      if (!window.TlbxUI) return;
      const now = T.get();
      const pick = (id) => () => { const r = T.set(id); if (!r.ok && window.TlbxUI.toast) window.TlbxUI.toast(r.error); };
      const conv = document.querySelector('.sh-convert');   // no room for Convert… in the header: it is the first row here
      const ai = document.querySelector('.sh-ai');
      const items = (ai && ai.hidden ? [{ label: 'Ask Assistant…', act: openAI }] : []).concat(conv && conv.hidden ? [{ label: 'Convert files…', act: openConvert }] : [])
        .concat((ai && ai.hidden) || (conv && conv.hidden) ? ['-'] : [])
        .concat([{ label: 'System', check: now === T.SYSTEM, act: pick(T.SYSTEM) }, '-'])
        .concat(T.THEMES.map((t) => ({ label: t.name, check: now === t.id, act: pick(t.id) })));
      const r = b.getBoundingClientRect();
      const m = window.TlbxUI.menu(items, r.left, r.bottom + 4);
      b.setAttribute('aria-expanded', 'true');
      const done = new MutationObserver(() => { if (!m.isConnected) { b.setAttribute('aria-expanded', 'false'); done.disconnect(); } });
      done.observe(document.body, { childList: true });
    });
    return b;
  }

  /** The app's video tutorial (shared/apps.js `video`): a click plays it in a dialog on the page (shared/ui/video.js,
   *  nothing loads from YouTube before that); a Ctrl/middle click opens YouTube. Null on a page whose app has none. */
  function tutorialLink() {
    const app = window.TlbxShell && window.TlbxShell.currentApp, v = app && app.video;
    if (!v || !/^[\w-]{6,20}$/.test(v.id)) return null;
    const a = document.createElement('a');
    a.className = 'sh-hbtn tlbx-hbtn sh-tutorial';
    a.href = 'https://www.youtube.com/watch?v=' + v.id;
    a.target = '_blank'; a.rel = 'noopener';
    a.title = 'Watch the video tutorial';
    a.dataset.tlbxVideo = v.id; a.dataset.tlbxVideoTitle = app.name + ' tutorial';
    a.setAttribute('aria-label', 'Watch the ' + app.name + ' video tutorial');
    a.innerHTML = ICON_PLAY;   // an icon only: the app's own controls keep the header's room (title and label say what it is)
    return a;
  }

  /** Convert…: File Converter's tool in a dialog (shared/convert/dialog.js), preloaded with what the app has open
   *  (shared/convert/provided.js). The dialog's code loads on the first click, never before. Also "Convert files…" in
   *  the command palette. None on File Converter itself, which is the tool. */
  function openConvert() {
    const url = new URL('shared/convert/dialog.js', window.TlbxShell.ROOT).href;
    return import(url).then((m) => m.open({})).catch((e) => {
      console.warn(e);
      if (window.TlbxUI && window.TlbxUI.toast) window.TlbxUI.toast('Convert is not available offline. Open the page online once.');
    });
  }
  function convertButton() {
    const app = window.TlbxShell && window.TlbxShell.currentApp;
    if (!app || app.id === 'convert') return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sh-hbtn tlbx-hbtn sh-convert';
    b.title = 'Convert files to another format, on this device';
    b.setAttribute('aria-label', 'Convert files');
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = ICON_CONVERT + '<span class="tlbx-hbtn-txt" data-i18n="shell.convert">Convert…</span>';
    b.addEventListener('click', openConvert);
    const C = window.TlbxCmd;
    if (C && C.register && !C.get('shell.convert')) {
      C.register([{ id: 'shell.convert', title: 'Convert files…', group: 'File', keywords: ['convert', 'export', 'format', 'pdf', 'png', 'docx', 'xlsx'], run: openConvert }]);
    }
    return b;
  }

  /** AI: the Assistant side panel (shared/ai/panel.js), loaded on the first click and never before, then opened beside the
   *  app (a bottom sheet on phones). Also "Ask Assistant…" in the command palette. None on Assistant itself. */
  let aiP = null;
  function openAI() {
    aiP = aiP || new Promise((res, rej) => {
      if (window.TlbxAIPanel) return res();
      const s = document.createElement('script'), app = window.TlbxShell.currentApp;
      s.src = new URL('shared/ai/panel.js', window.TlbxShell.ROOT).href;
      s.dataset.button = 'false'; if (app) s.dataset.app = app.id;
      s.onload = res; s.onerror = () => { aiP = null; rej(new Error('Assistant is not available offline. Open the page online once.')); };
      document.head.append(s);
    });
    return aiP.then(() => window.TlbxAIPanel.toggle()).catch((e) => { if (window.TlbxUI && window.TlbxUI.toast) window.TlbxUI.toast(e.message); });
  }
  function aiButton() {
    const app = window.TlbxShell && window.TlbxShell.currentApp;
    if (!app || app.id === 'ai') return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sh-hbtn tlbx-hbtn sh-ai';
    b.title = 'Assistant: ask, or let it work in ' + app.name + ' (runs on this device)';
    b.setAttribute('aria-label', 'Assistant');
    b.innerHTML = ICON_AI + '<span class="tlbx-hbtn-txt" data-i18n="shell.ai">AI</span>';
    b.addEventListener('click', openAI);
    const C = window.TlbxCmd;
    if (C && C.register && !C.get('shell.ai')) C.register([{ id: 'shell.ai', title: 'Ask Assistant…', group: 'Help', keywords: ['ai', 'assistant', 'chat', 'llm', 'help'], run: openAI }]);
    return b;
  }

  /** Convert… never costs the header a row or the other buttons their labels: it shows with its label when that fits,
   *  else as an icon, else (a phone, a full header) not at all, and then the Theme menu offers it first. */
  function placeConvert(host, ...btns) {
    btns = btns.filter(Boolean);
    const H = window.TlbxHbtn, fit = () => { if (H) H.check(host); };
    const tight = () => host.classList.contains('tlbx-htight');
    const set = (b, st) => { b.hidden = st === 'hidden'; b.classList.toggle('sh-icon-only', st === 'icon'); };
    btns.forEach((b) => set(b, 'hidden')); fit();
    const h0 = host.getBoundingClientRect().height, t0 = tight();
    const ok = () => host.getBoundingClientRect().height <= h0 + 1 && host.scrollWidth <= host.clientWidth + 1 && tight() === t0;
    // give way in order: Convert's label, then AI's, then Convert itself, then AI (both are then offered in the Theme menu)
    const [c, a] = btns, plans = [[], [[c, 'icon']], [[c, 'icon'], [a, 'icon']], [[c, 'hidden'], [a, 'icon']], [[c, 'hidden'], [a, 'hidden']]];
    for (const plan of plans) {
      btns.forEach((b) => set(b, 'full'));
      for (const [b, st] of plan) if (b) set(b, st);
      fit();
      if (ok() || plan === plans[plans.length - 1]) return;
    }
  }
  function watchConvert(host, conv, ai) {
    let queued = false, w = -1;
    const later = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; const nw = Math.round(host.getBoundingClientRect().width); if (nw !== w) { w = nw; placeConvert(host, conv, ai); } });
    };
    placeConvert(host, conv, ai);
    w = Math.round(host.getBoundingClientRect().width);
    if (window.ResizeObserver) new ResizeObserver(later).observe(host);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeConvert(host, conv, ai));
  }

  function mount() {
    if (window.TlbxBrand && window.TlbxBrand.appMark) window.TlbxBrand.appMark(); // the app's icon in the header brand (brand/brand.js)
    const box = document.createElement('div');
    box.className = 'sh-hdr';
    sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'sh-hbtn tlbx-hbtn sh-switch';
    sw.setAttribute('aria-label', 'Switch app');
    sw.setAttribute('data-i18n-attr', 'aria-label:shell.switch_app');
    sw.setAttribute('aria-haspopup', 'dialog');
    sw.title = title();
    sw.innerHTML = ICON_SEARCH + '<span class="sh-hbtn-txt tlbx-hbtn-txt" data-i18n="nav.apps">Apps</span>';
    sw.addEventListener('click', () => window.TlbxSwitcher.toggle());
    const tut = tutorialLink(), theme = themeButton(), conv = convertButton(), ai = aiButton();
    if (ai) box.append(ai);
    if (conv) box.append(conv);
    if (tut) box.append(tut);
    if (theme) box.append(theme);
    box.append(sw);
    const host = document.querySelector('header.topbar, header.menubar, header.nav, header');
    const slot = host && host.querySelector('.sh-hdr-slot');   // room kept for the buttons in the page's own HTML
    if (slot) slot.replaceWith(box); else if (host) host.append(box);
    if (host) { if (window.TlbxHbtn) window.TlbxHbtn.fit(host); }   // labels give way to icons when the header is full
    else { box.classList.add('sh-fab'); document.body.append(box); }
    window.TlbxNotify.mountBell(box);
    if (host && (conv || ai)) watchConvert(host, conv, ai);   // after the bell, the last button in
    window.addEventListener('tlbx-lang', () => { sw.title = title(); });
  }

  window.TlbxHeader = { mount, openConvert, openAI };
})();
