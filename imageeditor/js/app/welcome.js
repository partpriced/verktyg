/* Image Editor: the welcome card on the blank canvas of a first visit (no saved work, nothing opened from the hub). It shows
 * what Image Editor makes and how (TlbxDrop.panel.preview, the same preview the drop zones use) and a sample photo to try it
 * on, which goes through the drop strip's batch like a dropped file. The card does not take clicks on the canvas: the
 * first stroke, a new tab, a file or Close removes it. */
'use strict';

/** The card's picture and steps, in the current language. */
const WELCOME = () => ({
  picture: { src: '../assets/shots/imageeditor.jpg', alt: tr('imageeditor.welcome.alt') },
  steps: [tr('imageeditor.welcome.step_open'), tr('imageeditor.welcome.step_edit'), tr('imageeditor.welcome.step_export')],
});

function showWelcome() {
  const vp = $('#viewport');
  const pv = window.TlbxDrop && TlbxDrop.panel.preview(WELCOME());
  if (!vp || !pv || $('#psWelcome')) return;
  const doc = D; // the blank tab the card belongs to
  let card = null;
  const close = () => {
    if (!card) return;
    card.remove(); card = null;
    listeners.delete(onModel);
    vp.removeEventListener('pointerdown', onDown, true);
  };
  const onModel = (w) => { if (D !== doc || (w === 'history' && Hist.idx > 0)) close(); };
  const onDown = (e) => { if (card && !card.contains(e.target)) close(); };
  const sample = h('button', { type: 'button', class: 'sd-sample', id: 'psWelcomeSample', onclick: () => {
    close();
    if (window.TlbxSamples) TlbxIntake.sample(() => TlbxSamples.photos(1, { width: 1600, height: 1000 }), { to: 'imageeditor', mode: 'new' });
  } }, tr('imageeditor.welcome.sample'));
  const shut = h('button', { type: 'button', class: 'sd-sample', onclick: close }, tr('imageeditor.welcome.blank'));
  const inner = h('div', { class: 'ps-welcome-card' }, pv, h('div', { class: 'sd-acts' }, sample, shut));
  inner.addEventListener('pointerdown', (e) => e.stopPropagation()); // a press on the card is not a stroke on the canvas
  card = h('div', { class: 'ps-welcome', id: 'psWelcome', role: 'region', 'aria-label': tr('imageeditor.welcome.region') }, inner);
  vp.append(card);
  listeners.add(onModel);
  vp.addEventListener('pointerdown', onDown, true); // a stroke on the canvas starts work: the card goes, the stroke goes on
}
