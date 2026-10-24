// Motion Graphics boot: builds the state, the actions and the views, and wires them together. Load last (after every other
// Motion Graphics file). Exposes window.TlbxEffects.app for the tests and for debugging.
(function (g) {
  'use strict';
  const ns = (g.TlbxEffects = g.TlbxEffects || {});
  const $ = (id) => document.getElementById(id);

  function boot() {
    const doc = ns.core.newDoc({ name: 'Untitled', comp: ns.io.DEFAULT_COMP });
    const S = ns.state.create(doc);
    const toast = (m) => { if (g.TlbxUI) g.TlbxUI.toast(m); };
    const act = ns.actions.create(S, { toast });
    const ka = ns.actionsKeys.create(S, act);
    const io = ns.io.create(S, act, { toast });
    io.registerConfig();

    const tr = ns.transport.mount($('fx-transport'), S, act);
    const preview = ns.preview.mount($('fx-view'), $('fx-canvas'), S, ns.media);
    S.on((what) => { if (what === 'doc' || what === 'time' || what === 'view') preview.repaint(); });
    ns.timeline.mount($('fx-timeline'), S, act);
    ns.graph.mount($('fx-graph'), S, act, ka);

    // Side panel tabs: Layer, Effects, Motion (each its own container; the others are hidden).
    const panel = $('fx-panel');
    const boxes = {
      layer: document.createElement('div'), fx: document.createElement('div'), motion: document.createElement('div'),
    };
    for (const k of Object.keys(boxes)) { boxes[k].dataset.panel = k; panel.append(boxes[k]); }
    ns.props.mount(boxes.layer, S, act, io);
    ns.propsFx.mountFx(boxes.fx, S, act);
    ns.propsFx.mountMotion(boxes.motion, S, act, ka);
    // TlbxTabs (shared/ui/tabs.js) marks the tab, shows its box and gives the strips the arrow keys
    const sideTabs = g.TlbxTabs.mount($('fx-tabs'), { panel: (k) => boxes[k] });
    const showTab = (name) => sideTabs.show(name);
    showTab('layer');

    // Timeline tabs: the timeline and the graph editor share the lower area.
    g.TlbxTabs.mount($('fx-tl-tabs'), { panel: (k) => $(k === 'graph' ? 'fx-graph' : 'fx-timeline') }).show('timeline');

    const menus = ns.menus.mount(S, Object.assign(act, { toast }), io);
    const renderDialog = () => ns.renderDialog.open(S, toast);
    const compDialog = () => ns.menus.compDialog(S, act);
    const focusMotion = () => showTab('motion');
    if (g.TlbxCmd && g.TlbxCmd.init) g.TlbxCmd.init({ app: 'effects' });
    ns.cmd.init({ S, act, ka, io, tr, preview, toast, renderDialog, compDialog, focusMotion });

    // Status toasts from the store (undo labels etc.) are not needed; the toolbar shows undo state.
    S.on((what) => { if (what === 'doc') document.title = `${S.doc.name} — Motion Graphics`; });
    g.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.isDragging()) S.cancelLive(); });
    S.emit('doc');
    S.emit('sel');
    g.TlbxEffects.app = { S, act, ka, io, tr, preview, menus, showTab };
    menus.refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
