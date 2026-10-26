/* Video Editor: track headers (name, eye/mute/solo/lock) and the timeline toolbar
   (tools, snapping, split, marker, title, zoom). */
(function () {
  'use strict';
  const SE = window.SE, U = SE.util, M = SE.model, TL = SE.timeline, C = SE.cmd;
  const h = U.h;
  let heads, inner, tcEl, bar;

  function tog(icon, on, title, fn, cls) {
    return h('button', { type: 'button', class: 'th-b' + (on ? ' on' : '') + (cls ? ' ' + cls : ''), title, 'aria-label': title, 'aria-pressed': on ? 'true' : 'false', onclick: fn }, typeof icon === 'string' && icon.length <= 2 ? icon : SE.icon(icon));
  }
  function setTrack(id, patch, label) { SE.change(label, (p) => { Object.assign(M.track(p, id), patch); }); }
  async function rename(t) {
    const v = await TlbxUI.prompt(U.t('videoedit.tl.rename_track'), U.t('videoedit.bin.name'), t.name);
    if (v && v.trim()) setTrack(t.id, { name: v.trim().slice(0, 24) }, U.t('videoedit.tl.rename_track'));
  }
  function trackMenu(t, x, y) {
    const p = SE.doc, used = p.clips.some((c) => c.track === t.id), last = p.tracks.filter((x2) => x2.kind === t.kind).length <= 1;
    TlbxUI.menu([
      { label: U.t('videoedit.bin.rename_2'), act: () => rename(t) },
      { label: U.t(t.kind === 'audio' ? 'videoedit.cmd.add_audio_track' : 'videoedit.cmd.add_video_track'), act: () => SE.act.addTrack(t.kind) },
      { label: U.t('videoedit.tl.delete_track'), disabled: last, act: async () => {
        if (used && !(await TlbxUI.confirm(U.t('videoedit.tl.delete_track'), U.t('videoedit.tl.delete_track_body', { name: t.name }), U.t('ui.delete'), { danger: true }))) return;
        SE.change(U.t('videoedit.tl.delete_track'), (d) => { d.clips = d.clips.filter((c) => c.track !== t.id); d.tracks = d.tracks.filter((x2) => x2.id !== t.id); });
      } }
    ], x, y);
  }
  TL.renderHeads = function () {
    if (!inner) return;
    inner.replaceChildren();
    for (const r of TL.rows()) {
      const t = r.track, v = t.kind === 'video';
      const row = h('div', { class: 'th ' + t.kind + (t.lock ? ' locked' : ''), style: { height: r.h + 'px' }, dataset: { id: t.id }, tabindex: '0' },
        h('span', { class: 'th-name', title: U.t('videoedit.tl.double_click_to_rename') }, t.name),
        h('div', { class: 'th-tools' },
          v ? tog(t.hide ? 'eyeoff' : 'eye', t.hide, t.hide ? U.t('videoedit.tl.show_track') : U.t('videoedit.tl.hide_track'), () => setTrack(t.id, { hide: !t.hide }, t.hide ? U.t('videoedit.tl.show_track') : U.t('videoedit.tl.hide_track')), 'eye') : null,
          !v ? tog('M', t.mute, U.t('videoedit.tl.mute_track'), () => setTrack(t.id, { mute: !t.mute }, U.t('videoedit.tl.mute')), 'mute') : null,
          !v ? tog('S', t.solo, U.t('videoedit.tl.solo_track'), () => setTrack(t.id, { solo: !t.solo }, U.t('videoedit.tl.solo')), 'solo') : null,
          tog(t.lock ? 'lock' : 'unlock', t.lock, t.lock ? U.t('videoedit.tl.unlock_track') : U.t('videoedit.tl.lock_track'), () => setTrack(t.id, { lock: !t.lock }, t.lock ? U.t('videoedit.tl.unlock_track') : U.t('videoedit.tl.lock_track')), 'lock')));
      row.querySelector('.th-name').addEventListener('dblclick', () => rename(t));
      row.addEventListener('contextmenu', (e) => { e.preventDefault(); trackMenu(t, e.clientX, e.clientY); });
      row.addEventListener('keydown', (e) => { if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); const b = row.getBoundingClientRect(); trackMenu(t, b.left + 16, b.top + 16); } }); // i18n-ignore: a key name
      inner.append(row);
    }
    inner.append(h('div', { class: 'th-add' },
      h('button', { type: 'button', class: 'btn sm', onclick: () => SE.act.addTrack('video'), title: U.t('videoedit.cmd.add_video_track') }, '+ Video'), // i18n-ignore: V and A tracks
      h('button', { type: 'button', class: 'btn sm', onclick: () => SE.act.addTrack('audio'), title: U.t('videoedit.cmd.add_audio_track') }, '+ Audio'))); // i18n-ignore
    TL.syncHeads();
  };
  TL.syncHeads = function () { if (inner) inner.style.transform = 'translateY(' + (-TL.scrollY) + 'px)'; };

  /* ------------------------------------------------------------ toolbar */
  function toolBtn(id, icon, label) {
    const b = h('button', { type: 'button', class: 'tb tl-tool', dataset: { cmd: id }, 'aria-label': label, onclick: () => C.run(id) }, SE.icon(icon));
    return b;
  }
  function syncBar() {
    U.$$('[data-cmd]', bar).forEach((b) => {
      const c = C.get(b.dataset.cmd); if (!c) return;
      const on = c.checked ? c.checked() : false;
      b.classList.toggle('on', !!on);
      if (c.checked) b.setAttribute('aria-pressed', on ? 'true' : 'false');
      const k = C.keyFor(c.id); b.title = c.title + (k ? ' (' + k + ')' : ''); b.setAttribute('aria-label', c.title);
    });
    const z = bar.querySelector('.tl-zoom'); if (z) z.value = String(Math.log(TL.pps));
  }
  function buildBar() {
    bar = SE.app.els.tlBar;
    const zoom = h('input', { type: 'range', class: 'tl-zoom', min: String(Math.log(2)), max: String(Math.log(2400)), step: '0.01', 'aria-label': U.t('videoedit.tl.timeline_zoom'), oninput: (e) => TL.setZoom(Math.exp(+e.target.value)) });
    bar.append(
      toolBtn('tool.select', 'select', U.t('videoedit.cmd.selection_tool')), toolBtn('tool.razor', 'cut', U.t('videoedit.cmd.razor_tool')), toolBtn('tool.ripple', 'ripple', U.t('videoedit.cmd.ripple_edit_tool')), toolBtn('tool.multi', 'multi', U.t('videoedit.cmd.select_several')),
      h('span', { class: 'tb-sep' }),
      toolBtn('tool.snap', 'magnet', U.t('videoedit.cmd.snapping')),
      toolBtn('edit.split', 'split', U.t('videoedit.cmd.split_at_playhead')),
      toolBtn('tl.marker', 'marker', U.t('videoedit.cmd.add_marker')),
      toolBtn('tl.title', 'text', U.t('videoedit.tl.add_title')),
      toolBtn('edit.delete', 'trash', U.t('ui.delete')),
      h('span', { class: 'tb-flex' }),
      toolBtn('tl.zoomOut', 'zoomout', U.t('videoedit.tl.zoom_out')), zoom, toolBtn('tl.zoomIn', 'zoomin', U.t('videoedit.tl.zoom_in')), toolBtn('tl.fit', 'fit', U.t('videoedit.cmd.zoom_to_fit')));
    SE.on('tool', syncBar); SE.on('zoom', syncBar); SE.on('keys', syncBar); SE.on('change', syncBar);
    syncBar();
  }
  TL.initHeads = function () {
    heads = SE.app.els.tlHeads;
    tcEl = h('button', { type: 'button', class: 'tl-tc', title: U.t('videoedit.tl.current_time_click_to_type'), onclick: () => SE.transport && SE.transport.gotoDialog() }, '00:00:00:00');
    const corner = h('div', { class: 'th-corner', style: { height: TL.top() + 'px' } }, tcEl);
    inner = h('div', { class: 'th-inner' });
    heads.append(corner, h('div', { class: 'th-clip' }, inner));
    SE.on('time', () => { tcEl.textContent = U.timecode(SE.player.time, SE.doc.fps); });
    buildBar();
    TL.renderHeads();
  };
})();
