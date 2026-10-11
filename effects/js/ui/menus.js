// Motion Graphics menus and the top bar: undo and redo, the project name, File (Files, config, render), Composition
// (size with social presets, frame rate, duration, background) and Layer (add by type, import media). Built on TlbxUI's
// menu and dialog. Classic script: window.TlbxEffects.menus.
(function (g) {
  'use strict';
  const ns = (g.TlbxEffects = g.TlbxEffects || {});
  const { h, numberOf } = ns.dom;
  const D = () => ns.defs;
  const UI = () => g.TlbxUI;

  /** Opens the render dialog for the document. */
  const openRender = (S, act) => ns.renderDialog.open(S, act.toast);

  /** Opens a TlbxUI menu under an element. items as TlbxUI.menu takes them. */
  function openMenu(anchor, items) {
    const r = anchor.getBoundingClientRect();
    UI().menu(items, r.left, r.bottom + 4);
  }

  /** The Composition dialog: size preset, width and height, frame rate, duration and background. */
  function compDialog(S, act) {
    const c = S.doc.comp;
    const preset = D().SIZES.find((s) => s.w === c.width && s.h === c.height) || D().SIZES.find((s) => s.id === 'custom');
    const size = h('select', { class: 'sui-input', 'aria-label': 'Size preset' }, D().SIZES.map((s) => h('option', { value: s.id, selected: s.id === preset.id ? true : null }, s.name)));
    const w = h('input', { class: 'sui-input', type: 'number', min: 16, max: 7680, step: 2, value: c.width, 'aria-label': 'Width' });
    const hh = h('input', { class: 'sui-input', type: 'number', min: 16, max: 4320, step: 2, value: c.height, 'aria-label': 'Height' });
    const fps = h('select', { class: 'sui-input', 'aria-label': 'Frame rate' }, D().FPS.map((f) => h('option', { value: f, selected: f === c.fps ? true : null }, `${f} fps`)));
    const dur = h('input', { class: 'sui-input', type: 'number', min: D().LIMIT.minDur, max: D().LIMIT.maxDur, step: 0.1, value: c.duration, 'aria-label': 'Duration in seconds' });
    const bgHex = /^#[0-9a-f]{6}$/i.test(c.background) ? c.background : '#000000';
    const bg = h('input', { class: 'sui-input', type: 'color', value: bgHex, 'aria-label': 'Background colour', style: 'height:32px;padding:2px' });
    const clear = h('input', { type: 'checkbox', checked: c.background === 'transparent' ? true : null, 'aria-label': 'Transparent background' });
    size.addEventListener('change', () => {
      const p = D().SIZES.find((s) => s.id === size.value);
      if (p && p.id !== 'custom') { w.value = p.w; hh.value = p.h; }
    });
    const form = h('div', { class: 'fx-group' },
      h('div', { class: 'fx-row' }, h('label', null, 'Format'), size, h('span')),
      h('div', { class: 'fx-row' }, h('label', null, 'Size'), h('div', { class: 'fx-pair' }, w, hh), h('span', null, 'px')),
      h('div', { class: 'fx-row' }, h('label', null, 'Frame rate'), fps, h('span')),
      h('div', { class: 'fx-row' }, h('label', null, 'Duration'), dur, h('span', null, 's')),
      h('div', { class: 'fx-row' }, h('label', null, 'Background'), h('div', { class: 'fx-pair' }, bg, h('label', { class: 'sui-check' }, clear, h('span', null, 'Transparent'))), h('span')),
      h('p', { class: 'fx-empty', style: 'padding:0;text-align:left' }, 'Sizes are kept even. Changing the duration keeps the keys; keys past the end are not drawn.'));
    UI().dialog({
      title: 'Composition', body: form,
      buttons: [{ label: 'Cancel' }, {
        label: 'Apply', primary: true,
        act: () => {
          const W = numberOf(w), H = numberOf(hh), F = Number(fps.value), Dn = numberOf(dur);
          if (W === null || H === null || Dn === null) { act.toast('Enter numbers for the size and duration'); return false; }
          act.setComp({ width: W, height: H, fps: F, duration: Dn, background: clear.checked ? 'transparent' : bg.value });
        },
      }],
    });
  }

  /** Shows a dialog with a text field, and calls done(value) with the trimmed value when it is applied. */
  const askText = (title, label, value, done) => UI().prompt(title, label, value).then((v) => { if (v !== null && v.trim()) done(v.trim()); });

  /** The File menu items. io: the file actions. */
  function fileItems(S, act, io) {
    const cfg = g.TlbxConfigDialog && g.TlbxConfigDialog.menuItems ? g.TlbxConfigDialog.menuItems({ app: 'effects' }) : [];
    return [
      { label: 'New project', act: () => io.newProject() },
      '-',
      { label: 'Open from Files…', act: () => io.openDrive() },
      { label: 'Save to Files…', act: () => io.saveDrive() },
      '-',
      ...cfg,
      '-',
      { label: 'Render…', key: 'Mod+E', act: () => openRender(S, act) },
    ];
  }

  /** The Layer menu items: add by type, import media. */
  function layerItems(S, act, io) {
    return [
      { label: 'Solid', act: () => act.addLayer('solid') },
      { label: 'Shape', sub: D().SHAPES.map(([v, l]) => ({ label: l, act: () => act.addLayer('shape', { shape: v }) })) },
      { label: 'Text', act: () => act.addLayer('text', { size: 120 }) },
      { label: 'Null (a parent with no picture)', act: () => act.addLayer('null') },
      '-',
      { label: 'Image or video from this computer…', act: () => io.importFromComputer() },
      { label: 'Image or video from Files…', act: () => io.importFromDrive() },
    ];
  }

  /** Mounts the top bar. Returns { refresh }. */
  function mount(S, act, io) {
    const undo = document.getElementById('fx-undo'), redo = document.getElementById('fx-redo');
    const name = document.getElementById('fx-name');
    undo.addEventListener('click', () => S.undo());
    redo.addEventListener('click', () => S.redo());
    name.addEventListener('change', () => act.renameProject(name.value));
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') name.blur(); });
    document.getElementById('fx-file').addEventListener('click', (e) => openMenu(e.currentTarget, fileItems(S, act, io)));
    document.getElementById('fx-layer').addEventListener('click', (e) => openMenu(e.currentTarget, layerItems(S, act, io)));
    document.getElementById('fx-comp').addEventListener('click', () => compDialog(S, act));
    document.getElementById('fx-render').addEventListener('click', () => openRender(S, act));
    document.getElementById('fx-search').addEventListener('click', () => g.TlbxCmd && g.TlbxCmd.open && g.TlbxCmd.open(''));

    /** Keeps the buttons and the name in step with the document. */
    function refresh() {
      undo.disabled = !S.canUndo();
      redo.disabled = !S.canRedo();
      undo.title = S.canUndo() ? `Undo ${S.lastLabel || ''}`.trim() : 'Nothing to undo';
      if (document.activeElement !== name) name.value = S.doc.name;
      document.title = `${S.doc.name} — Motion Graphics`;
    }
    S.on((what) => { if (what === 'doc' || what === 'view') refresh(); });
    refresh();
    return { refresh };
  }

  ns.menus = { mount, compDialog, askText, fileItems, layerItems };
})(typeof window !== 'undefined' ? window : globalThis);
