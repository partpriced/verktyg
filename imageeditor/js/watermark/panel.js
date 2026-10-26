/* Image Editor watermark panel: the site's one watermark panel (shared/watermark/panel.js) on the open document's watermark,
 * with Image Editor's on switch and its device default. Every change is live: the page preview repaints at once and the next
 * export uses the same watermark. */
'use strict';

function buildWatermarkPanel() {
  const host = h('div', { class: 'ps-wm' });
  const panel = TlbxWatermarkPanel.mount(host, {
    value: wmState().spec,
    intake: 'imageeditor.logo',   // the logo part: TlbxIntake.pick({ to: 'imageeditor.logo' })
    onChange: (spec) => wmSetSpec(spec),
    toggle: { get: wmOn, set: wmSetOn, label: 'imageeditor.wm.on', note: (on) => tr(on ? 'imageeditor.wm.on_note' : 'imageeditor.wm.off_note') },
    actions: [
      { label: 'imageeditor.wm.save_default', title: 'imageeditor.wm.save_default_tip', act: () => wmSaveDefaults() },
      { label: 'imageeditor.wm.reset_default', title: 'imageeditor.wm.reset_default_tip', act: () => wmResetStyle() },
    ],
  });
  // the document's watermark: after an undo, a tab switch or opening a file. Only when it is another spec: 'doc' comes
  // with every edit of the picture, and redrawing the panel each time made every stroke and drag slow.
  let shown = wmState().spec, shownOn = wmOn();
  listeners.add((w) => {
    if (w !== 'watermark' && w !== 'doc' && w !== 'docname') return;
    const spec = wmState().spec, on = wmOn();
    if (spec !== shown) panel.set(spec);
    else if (on !== shownOn) panel.sync();   // the switch (Layer › Watermark on, a tab with it on)
    shown = spec; shownOn = on;
  });
  return host;
}
