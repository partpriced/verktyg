/* TlbxHeader: adds the shell's buttons to the page header: the theme menu (every page, from TlbxTheme), "Apps" (opens
 * the switcher), the notifications bell, and Tutorial (the app's YouTube tutorial, when the registry has one). Goes at the end of header.topbar, header.menubar or header.nav, or floats at the
 * top right when the page has no header. Loaded and mounted by shell/shell.js, which applies the language after.
 * The Apps text and the button's aria-label are marked for TlbxI18n; the title is set here (it carries the shortcut). */
(function () {
  'use strict';
  if (window.TlbxHeader) return;
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
  const ICON_THEME = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>';
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
      const items = [{ label: 'System', check: now === T.SYSTEM, act: pick(T.SYSTEM) }, '-']
        .concat(T.THEMES.map((t) => ({ label: t.name, check: now === t.id, act: pick(t.id) })));
      const r = b.getBoundingClientRect();
      const m = window.TlbxUI.menu(items, r.left, r.bottom + 4);
      b.setAttribute('aria-expanded', 'true');
      const done = new MutationObserver(() => { if (!m.isConnected) { b.setAttribute('aria-expanded', 'false'); done.disconnect(); } });
      done.observe(document.body, { childList: true });
    });
    return b;
  }

  /** The app's video tutorial (shared/apps.js `video`), opened on YouTube in a new tab: the page itself loads nothing
   *  from YouTube. Null on a page whose app has no tutorial. */
  function tutorialLink() {
    const app = window.TlbxShell && window.TlbxShell.currentApp, v = app && app.video;
    if (!v || !/^[\w-]{6,20}$/.test(v.id)) return null;
    const a = document.createElement('a');
    a.className = 'sh-hbtn tlbx-hbtn sh-tutorial';
    a.href = 'https://www.youtube.com/watch?v=' + v.id;
    a.target = '_blank'; a.rel = 'noopener';
    a.title = 'Watch the video tutorial (YouTube)';
    a.setAttribute('aria-label', 'Watch the ' + app.name + ' video tutorial on YouTube');
    a.innerHTML = ICON_PLAY;   // an icon only: the app's own controls keep the header's room (title and label say what it is)
    return a;
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
    const tut = tutorialLink(), theme = themeButton();
    if (tut) box.append(tut);
    if (theme) box.append(theme);
    box.append(sw);
    const host = document.querySelector('header.topbar, header.menubar, header.nav, header');
    const slot = host && host.querySelector('.sh-hdr-slot');   // room kept for the buttons in the page's own HTML
    if (slot) slot.replaceWith(box); else if (host) host.append(box);
    if (host) { if (window.TlbxHbtn) window.TlbxHbtn.fit(host); }   // labels give way to icons when the header is full
    else { box.classList.add('sh-fab'); document.body.append(box); }
    window.TlbxNotify.mountBell(box);
    window.addEventListener('tlbx-lang', () => { sw.title = title(); });
  }

  window.TlbxHeader = { mount };
})();
