/* Gallery: exact duplicates. Groups photos with the same SHA-256 of their bytes. For each group one copy is kept
 * (the oldest by default, or the one you pick) and the rest are removed after a confirmation.
 * Exposes window.TlbxGallery.dupes.open(). */
(function () {
  'use strict';
  const G = (window.TlbxGallery = window.TlbxGallery || {});
  const toast = (m) => window.TlbxUI && TlbxUI.toast(m);
  const t = (k, v) => (window.TlbxI18n ? window.TlbxI18n.t(k, v) : k);

  function groupEl(group, keep, onPick) {
    const el = TlbxUI.el;
    const box = el('section', { class: 'dupe-group' });
    box.append(el('h3', { class: 'dupe-h' }, t('gallery.dupes.copies', { n: group.items.length, name: group.items[0].name })));
    for (const m of group.items) {
      const thumb = el('img', { alt: '', class: 'dupe-thumb' });
      G.urls.thumb(m.id).then((u) => { if (u) thumb.src = u; });
      const radio = el('input', { type: 'radio', name: 'keep-' + group.sha, value: m.id, checked: m.id === keep });
      radio.addEventListener('change', () => onPick(m.id));
      box.append(el('label', { class: 'dupe-row' }, radio, thumb,
        el('span', { class: 'dupe-meta' }, el('b', null, m.name), el('small', null, (window.TlbxI18n ? window.TlbxI18n.date(m.takenAt || 0, { dateStyle: 'medium', timeStyle: 'short' }) : new Date(m.takenAt || 0).toLocaleString())))));
    }
    return box;
  }

  /** Opens the dialog. Resolves when it closes with the number of photos removed. */
  function open() {
    const groups = G.query.dupeGroups(G.library.list());
    if (!groups.length) { TlbxUI.alert(t('gallery.dupes.none_title'), t('gallery.dupes.none_body')); return Promise.resolve(0); }
    const keep = new Map(groups.map((g) => [g.sha, g.items[0].id]));
    const extra = () => groups.reduce((n, g) => n + g.items.length - 1, 0);
    const body = TlbxUI.el('div', { class: 'dupes' });
    body.append(TlbxUI.el('p', { class: 'sui-p' }, t('gallery.dupes.intro', { n: groups.length })));
    for (const g of groups) body.append(groupEl(g, keep.get(g.sha), (id) => keep.set(g.sha, id)));
    let removed = 0;
    return new Promise((res) => {
      TlbxUI.dialog({ title: t('gallery.dupes.title'), cls: 'dupes-dlg', body, onClose: () => res(removed),
        buttons: [{ label: t('menu.close') }, { label: t('gallery.dupes.delete_extra'), danger: true, act: async () => {
          const drop = [];
          for (const g of groups) for (const m of g.items) if (m.id !== keep.get(g.sha)) drop.push(m.id);
          const ok = await TlbxUI.confirm(t('gallery.dupes.confirm_title'), t('gallery.dupes.confirm_body', { n: drop.length, total: extra() }), t('ui.delete'), { danger: true });
          if (!ok) return false;
          removed = await G.library.remove(drop);
          drop.forEach((id) => G.urls.forget(id));
          toast(t('gallery.dupes.removed', { n: removed }));
          return true;
        } }] });
    });
  }

  G.dupes = { open };
})();
