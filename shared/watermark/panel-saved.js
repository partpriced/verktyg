/* The watermark panel's "My watermarks" button (panel.js): a menu (TlbxMenuButton) of the watermarks saved in any app
 * (saved.js), Save this watermark… (a name, through TlbxUI.prompt) and Manage… (a TlbxUI.dialog to delete them).
 * Classic script: TlbxWatermarkPanel.savedButton({ get() → spec, use(spec, name) }) → { el, refresh(), relabel(), destroy() }.
 * Words: shared/i18n/ui/<code>/watermark.js (ui.wm.saved_*); relabel() after a language switch (the panel calls it). */
(function () {
  'use strict';
  const P = (window.TlbxWatermarkPanel = window.TlbxWatermarkPanel || {});
  const S = window.TlbxWatermarkSpec;
  const el = (...a) => window.TlbxUI.el(...a);
  const toast = (m) => window.TlbxUI.toast(m, 3200);
  const tr = (k, v) => (window.TlbxI18n ? window.TlbxI18n.t(k, v) : k);

  P.savedButton = function (o) {
    const Saved = window.TlbxWatermarkSaved;
    const btn = el('button', { type: 'button', class: 'sui-btn swp-saved' });
    const relabel = () => { btn.textContent = tr('ui.wm.saved_btn'); btn.title = tr('ui.wm.saved_tip'); };
    relabel();
    let rows = [];
    async function refresh() { rows = Saved ? await Saved.list().catch(() => []) : []; btn.dataset.count = String(rows.length); }
    const off = Saved ? Saved.onChange(refresh) : () => {};
    refresh();

    async function saveAs() {
      const sp = o.get(), first = sp.layers.find((L) => L.show) || sp.layers[0];
      const guess = sp.name || (first ? S.label(first).replace(/[“”"]/g, '') : tr('ui.wm.mark'));
      const name = await window.TlbxUI.prompt(tr('ui.wm.saved_save_title'), tr('ui.wm.saved_name'), guess, { ok: tr('ui.wm.saved_save'), placeholder: tr('ui.wm.saved_placeholder') });
      if (name == null) return;
      try {
        const same = rows.find((r) => r.name.toLowerCase() === String(name).trim().toLowerCase());
        await Saved.save(name, sp, same && same.id);
        toast(tr('ui.wm.saved_done'));
      } catch (e) { window.TlbxUI.alert(tr('ui.wm.saved_failed'), e.message); }
    }
    function manage() {
      const list = el('ul', { class: 'swp-manage' });
      const draw = () => {
        list.replaceChildren(...(rows.length ? rows.map((r) => {
          const del = el('button', { type: 'button', class: 'sui-btn sui-danger', 'aria-label': tr('ui.wm.saved_delete_aria', { name: r.name }) }, tr('ui.delete'));
          del.addEventListener('click', async () => { await Saved.remove(r.id); await refresh(); draw(); });
          return el('li', null, el('span', null, r.name, el('small', null, ' · ' + tr('ui.wm.saved_layers', { n: r.spec.layers.length }))), del);
        }) : [el('li', { class: 'swp-fine' }, tr('ui.wm.saved_none_dot'))]));
      };
      draw();
      window.TlbxUI.dialog({ title: tr('ui.wm.saved_title'), body: el('div', null, el('p', { class: 'sui-p' }, tr('ui.wm.saved_note')), list), buttons: [{ label: tr('ui.done'), primary: true }] });
    }

    const mb = window.TlbxMenuButton.attach(btn, {
      get label() { return tr('ui.wm.saved_title'); },
      items: () => [
        { heading: tr('ui.wm.saved_title') },
        ...(rows.length ? rows.map((r) => ({ value: 'use:' + r.id, label: r.name, keywords: [r.spec.layers.map((L) => L.text).join(' ')] })) : [{ value: 'none', label: tr('ui.wm.saved_none'), disabled: true }]),
        { heading: tr('ui.wm.saved_this') },
        { value: 'save', label: tr('ui.wm.saved_save_dots') },
        { value: 'manage', label: tr('ui.wm.saved_manage_dots'), disabled: !rows.length },
      ],
      onPick: (v) => {
        if (v === 'save') saveAs();
        else if (v === 'manage') manage();
        else if (v.startsWith('use:')) {
          const r = rows.find((x) => 'use:' + x.id === v);
          if (r) o.use(S.normalize(r.spec), r.name);
        }
      },
      search: 'auto',
    });
    return { el: btn, refresh, relabel, destroy: () => { off(); mb.destroy(); } };
  };
})();
