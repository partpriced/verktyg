/* Built-in effect presets (TlbxPresets.BUILTIN_EFFECTS): plain data, shipped with the app. Values are inside the limits
 * of TlbxPresets.EFFECT_TYPES, so every one validates (tests/node/presets.test.mjs checks it). Look-up by id: 'soft-shadow'.
 * Colour looks (kind effect, type colour-look) apply in Video Editor; the rest apply to Image Editor layers. The name and the
 * description people read are ui.presets.b.<id> and ui.presets.bd.<id> (shared/i18n/ui/<code>/presets.js), added by builtins(). */
(function (g) {
  'use strict';
  const SP = (g.TlbxPresets = g.TlbxPresets || {});
  const fx = (type, p, on) => ({ type, ...(on === false ? { on: false } : {}), p });
  const preset = (id, apps, effects) => ({ id, kind: 'effect', apps, params: { effects } });
  const PS = ['imageeditor'], CUT = ['videoedit'];

  SP.BUILTIN_EFFECTS = [
    preset('soft-shadow', PS,
      [fx('drop-shadow', { color: '#000000', op: 45, a: 120, dist: 8, size: 18 })]),
    preset('hard-shadow', PS,
      [fx('drop-shadow', { color: '#000000', op: 80, a: 135, dist: 10, size: 0 })]),
    preset('neon-glow', PS,
      [fx('glow', { color: '#ffeae8', op: 85, spread: 4, size: 24 })]),
    preset('inner-glow-soft', PS,
      [fx('inner-glow', { color: '#fff5b0', op: 75, size: 12 })]),
    preset('outline', PS,
      [fx('stroke', { size: 4, color: '#0a0a0a', pos: 'outside' })]),
    preset('emboss', PS,
      [fx('bevel', { size: 8, depth: 120, a: 120 })]),
    preset('colour-wash', PS,
      [fx('overlay', { color: '#ff6b4a', op: 35, blend: 'multiply' })]),
    preset('sunset-gradient', PS,
      [fx('gradient', { c1: '#ff6b4a', c2: '#1f6feb', op: 60, a: 90, scale: 100, blend: 'normal' })]),
    preset('soft-blur', PS,
      [fx('blur', { radius: 3 })]),
    preset('sharpen', PS,
      [fx('sharpen', {})]),
    preset('film-grain', PS,
      [fx('grain', { amount: 12, mono: true, seed: 7 })]),
    preset('vignette', PS,
      [fx('vignette', { amount: 55, size: 75, color: '#000000' })]),
    preset('hue-shift', PS,
      [fx('colour-shift', { hue: 30, sat: 10, light: 0 })]),
    preset('glitch', PS,
      [fx('glitch', { amount: 45, shift: 8, seed: 42 })]),
    preset('warm-look', CUT,
      [fx('colour-look', { temp: 35, sat: 10, contrast: 0, bright: 0 })]),
    preset('cool-look', CUT,
      [fx('colour-look', { temp: -35, sat: 0, contrast: 0, bright: 0 })]),
    preset('punchy-look', CUT,
      [fx('colour-look', { temp: 0, sat: 30, contrast: 25, bright: 0 })]),
    preset('bw-look', CUT,
      [fx('colour-look', { temp: 0, sat: -100, contrast: 15, bright: 0 })]),
  ];
})(typeof window !== 'undefined' ? window : globalThis);
