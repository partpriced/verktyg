/* Video Editor: the Watermark tab of the bin (the project panel): the site's one watermark panel (shared/watermark/panel.js)
   on the open project's watermark, with Video Editor's on switch, the time range of each layer, and the device default.
   Each change is one undoable step on the project, and the monitor shows it at once (watermark/state.js draws it, the
   same pixels as the export). The panel is built once and then only synced, so a slider drag is not interrupted by the
   bin's re-renders. */
(function () {
  'use strict';
  const SE = window.SE, U = SE.util, WM = SE.watermark, h = U.h;
  const P = WM.panel = {};
  let root = null, panel = null;

  function build() {
    root = h('div', { class: 'wm-panel' }, h('div', { class: 'ins-title' }, SE.icon('sparkle'), h('b', null, U.t('videoedit.bin.watermark'))));
    panel = TlbxWatermarkPanel.mount(root, {
      value: WM.settings().spec,
      media: { pages: false, time: true },
      onChange: (spec, how) => WM.set({ spec }, how.label || U.t('videoedit.bin.watermark'), how.key || 'spec'),
      toggle: { get: () => WM.settings().on, set: (on) => WM.set({ on }, on ? U.t('videoedit.wm.watermark_on') : U.t('videoedit.wm.watermark_off'), 'on'), label: U.t('videoedit.bin.watermark'),
        note: (on) => (on ? U.t('videoedit.wm.on_shows_in_the_monitor') : U.t('videoedit.wm.off_no_watermark_in_the')) },
      actions: [
        { label: U.t('videoedit.wm.save_as_device_default'), title: U.t('videoedit.wm.new_projects_on_this_device'), act: () => { WM.saveDefaults(); TlbxUI.toast(U.t('videoedit.wm.saved_as_this_device_s')); } },
        { label: U.t('videoedit.wm.use_device_default'), title: U.t('videoedit.wm.copy_this_device_s_default'), act: () => WM.useDefaults() },
      ],
    });
    return root;
  }

  /** Renders into the bin's list element. Rebuilt only when another tab has replaced the list's content. */
  P.render = function (list) {
    if (!root || root.parentNode !== list) list.replaceChildren(build());
    panel.set(WM.settings().spec);
  };
  SE.act = SE.act || {};
  SE.act.openWatermark = function () { if (SE.bin) SE.bin.show('watermark'); };
})();
