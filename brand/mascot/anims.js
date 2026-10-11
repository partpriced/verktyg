// Copyright (c) 2026 PartPriced. All rights reserved. Not covered by the MIT License.
// Chippy's 17 animations. Each has a length in seconds, the face to show at time t, and the motion at time t (offsets:
// px py, rotations rx ry rz, squash sx sy sz, look = eyes sideways, glassY = sunglasses height, zs = sleep Zs).
// side (point and look): -1 turns the motion to the left, 1 to the right.
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const E = { out: (x) => 1 - Math.pow(1 - x, 3), inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), back: (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2) };
export const hopAt = (t, start, dur, h) => { const u = (t - start) / dur; return u > 0 && u < 1 ? Math.sin(u * Math.PI) * h : 0; };
export const ANIMS = {
  hello: { label: 'Hello', dur: 2.4, face: (t) => (t < 1.3 ? 'idle' : 'wink'), tf: (t) => { const k = t < 0.01 ? 0 : E.back(clamp01(t / 0.7)); return { sx: k, sy: k, sz: k, rz: Math.sin(t * 7) * 0.1 * clamp01(1 - t / 1.3) }; } },
  bounce: { label: 'Bounce', dur: 2.1, face: () => 'idle', tf: (t) => { const u = (t % 0.7) / 0.7, air = u < 0.8, sy = air ? 1 + 0.06 * Math.sin((u / 0.8) * Math.PI) : 1 - 0.16 * Math.sin(((u - 0.8) / 0.2) * Math.PI);
    return { py: air ? Math.sin((u / 0.8) * Math.PI) * 18 : 0, sy, sx: 2 - sy, sz: 2 - sy }; } },
  celebrate: { label: 'Celebrate', dur: 2.6, face: (t) => (t < 0.25 ? 'idle' : 'done'), tf: (t) => ({ py: hopAt(t, 0.2, 1.2, 28), ry: E.inOut(clamp01((t - 0.25) / 1.0)) * Math.PI * 2 }) },
  nod: { label: 'Nod yes', dur: 1.6, face: () => 'idle', tf: (t) => ({ rx: Math.sin(t * 11) * 0.28 * clamp01(1 - t / 1.6) }) },
  no: { label: 'Shake no', dur: 1.7, face: (t) => (t < 1.2 ? 'surprised' : 'idle'), tf: (t) => ({ ry: Math.sin(t * 15) * 0.45 * clamp01(1 - t / 1.4) }) },
  look: { label: 'Look around', dur: 3.4, face: () => 'idle', tf: (t) => { const lk = t < 0.4 ? 0 : t < 1.3 ? -3.2 : t < 1.6 ? 0 : t < 2.6 ? 3.2 : 0; return { look: lk, ry: lk * 0.05 }; } },
  point: { label: 'Point at', dur: 2.8, face: () => 'idle', tf: (t) => { const k = t < 0.5 ? E.out(t / 0.5) : t < 2.2 ? 1 : 1 - E.inOut(clamp01((t - 2.2) / 0.6)); return { look: 3.4 * k, ry: -0.55 * k, rz: -0.07 * k, px: 8 * k }; } },
  think: { label: 'Think', dur: 3.6, face: () => 'think', tf: (t) => ({ rz: Math.sin(t * 2.4) * 0.09, py: Math.sin(t * 1.2) * 2 }) },
  working: { label: 'Working', dur: 3.6, face: () => 'think', tf: (t) => ({ px: Math.sin(t * 55) * 0.7, rz: Math.sin(t * 31) * 0.01 }) },
  cool: { label: 'Cool', dur: 2.8, face: () => 'cool', tf: (t) => ({ glassY: (1 - E.out(clamp01((t - 0.1) / 0.6))) * 42, rz: t > 0.7 && t < 1.4 ? Math.sin((t - 0.7) * 9) * 0.05 : 0 }) },
  sleep: { label: 'Sleep', dur: 4.6, face: () => 'sleep', tf: (t) => ({ py: Math.sin(t * 1.3) * 3 - 5, rz: 0.12 * clamp01(t / 0.6), zs: t }) },
  wake: { label: 'Wake up', dur: 2.4, face: (t) => (t < 0.9 ? 'sleep' : t < 1.7 ? 'surprised' : 'idle'), tf: (t) => ({ py: (t < 0.9 ? -5 : 0) + hopAt(t, 0.9, 0.55, 26), rz: t < 0.9 ? 0.12 : 0 }) },
  dizzy: { label: 'Dizzy', dur: 3.2, face: (t) => (t < 1.2 ? 'idle' : 'dizzy'), tf: (t) => ({ ry: E.out(clamp01(t / 1.2)) * Math.PI * 4, rz: t > 1.2 ? Math.sin(t * 9) * 0.22 * clamp01((3.2 - t) / 2) : 0 }) },
  oops: { label: 'Oops', dur: 1.9, face: (t) => (t < 1.3 ? 'surprised' : 'idle'), tf: (t) => ({ px: Math.sin(t * 42) * 3.5 * clamp01(1 - t / 0.9), py: hopAt(t, 0, 0.3, 8) }) },
  flip: { label: 'Backflip', dur: 1.8, face: (t) => (t < 1.15 ? 'surprised' : 'done'), tf: (t) => ({ py: hopAt(t, 0, 1.2, 30), rx: -E.inOut(clamp01(t / 1.1)) * Math.PI * 2 }) },
  peek: { label: 'Peek in', dur: 3, face: (t) => (t < 1.9 ? 'idle' : 'wink'), tf: (t) => ({ py: t < 0.6 ? -115 + E.out(t / 0.6) * 70 : t < 1.8 ? -45 : t < 2.3 ? -45 + E.back(clamp01((t - 1.8) / 0.5)) * 45 : 0, look: t > 0.7 && t < 1.7 ? (t < 1.2 ? -2.5 : 2.5) : 0 }) },
  bye: { label: 'Bye', dur: 2.6, face: () => 'wink', tf: (t) => { const k = t < 1.1 ? 1 : 1 - E.inOut(clamp01((t - 1.1) / 0.7)); const back = t > 2.1 ? E.back(clamp01((t - 2.1) / 0.5)) : 0;
    const sc = t > 1.8 ? back : k; return { rz: t < 1.1 ? Math.sin(t * 8) * 0.12 : 0, ry: t > 1.1 && t < 1.8 ? (t - 1.1) * 9 : 0, sx: sc, sy: sc, sz: sc, py: t > 1.1 && t < 1.8 ? (t - 1.1) * 40 : 0 }; } },
};
