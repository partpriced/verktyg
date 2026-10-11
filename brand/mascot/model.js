// Copyright (c) 2026 PartPriced. All rights reserved. Not covered by the MIT License.
// Chippy, the "Sheet" model: a chip on a thick board, six small gold contacts a side and the gold corner triangle, a
// stepped two-level silver lid with an engraved dot, glossy black eyes, and its expressions. three.js from vendor/.
// Units are about 100 across, y up, the face towards +z. Chippy floats: no arms, legs or hands.
import * as T from '../../vendor/three/three.module.min.js';

/** The colours (light look). face: the eyes and mouth, always glossy black. */
export const C = {
  face: '#131820', paper: '#fbfaf6', gold: '#e8a33d', pcb: '#2e6b45', silver: '#b8c0ca', etch: '#9199a4', tongue: '#e8707e',
};

const VERT = 'varying vec3 vN; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }';
// a three-tone gradient, a soft rim, a glow (the contacts while thinking) and a glint that sweeps across (the lid)
const FRAG = 'uniform vec3 lo; uniform vec3 mid; uniform vec3 hi; uniform float sweep; uniform float strength; uniform float glow; varying vec3 vN; varying vec3 vP; void main(){ vec3 n=normalize(vN); vec3 l=normalize(vec3(-0.45,0.6,0.65)); float g=dot(n,l)*0.5+0.5; vec3 c=mix(lo,mid,smoothstep(0.15,0.62,g)); c=mix(c,hi,smoothstep(0.80,1.0,g)); float rim=pow(1.0-max(dot(n,vec3(0.0,0.0,1.0)),0.0),3.0); c+=rim*0.16*hi; c=mix(c,hi*1.12,glow*0.8); float d=(vP.x+vP.y)*0.7071-sweep; c+=vec3(exp(-d*d/50.0)*strength*0.55); gl_FragColor=vec4(c,1.0); }';

const cache = {};
/** A material of the shader look for one colour; fresh: an uncached one for parts that animate on their own. */
export function mat(hex, fresh) {
  if (!fresh && cache[hex]) return cache[hex];
  const m = new T.Color(hex), lo = m.clone().multiplyScalar(0.55), hi = m.clone().lerp(new T.Color(1, 1, 1), 0.55);
  const out = new T.ShaderMaterial({ uniforms: { lo: { value: lo }, mid: { value: m }, hi: { value: hi }, sweep: { value: -999 }, strength: { value: 0 }, glow: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG });
  if (!fresh) cache[hex] = out;
  return out;
}
function addM(g, geo, material, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, material); m.position.set(x, y, z); g.add(m); return m; }
function add(g, geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null) {
  const m = new T.Mesh(geo, mat(color)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); if (s) m.scale.set(s[0], s[1], s[2]); g.add(m); return m;
}
const sph = (r, seg = 32) => new T.SphereGeometry(r, seg, Math.round(seg * 0.75));
const cyl = (rt, rb, h, seg = 40) => new T.CylinderGeometry(rt, rb, h, seg);
/** A rounded box: an extruded rounded rectangle with a bevel. */
export function rbox(w, h, d, r) {
  const s = new T.Shape(), x = -w / 2 + r, y = -h / 2 + r, iw = w - 2 * r, ih = h - 2 * r;
  s.moveTo(x, y - r); s.lineTo(x + iw, y - r); s.quadraticCurveTo(x + iw + r, y - r, x + iw + r, y); s.lineTo(x + iw + r, y + ih);
  s.quadraticCurveTo(x + iw + r, y + ih + r, x + iw, y + ih + r); s.lineTo(x, y + ih + r); s.quadraticCurveTo(x - r, y + ih + r, x - r, y + ih);
  s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
  const bev = Math.min(r * 0.6, d * 0.35);
  const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.01, d - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 10 });
  g.translate(0, 0, -(d - 2 * bev) / 2); return g;
}
const quarter = (q, x, y) => { for (let i = 0; i < q; i++) [x, y] = [-y, x]; return [x, y]; };

/** The face and its expressions: idle, think, done (excited), wink, cool, surprised, sleep, dizzy. Returns the eyes (for
 * blinking) with .group (moved sideways to look) and .glasses (the sunglasses, moved down when cool starts). */
export function sheetFace(g, pose, z) {
  const ink = C.face, eyes = [], ex = 11, ey = 4, eg = new T.Group(), gl = new T.Group(); g.add(eg); g.add(gl); eyes.group = eg; eyes.glasses = gl;
  const glossy = (x, y, r = 5.2) => { const e = add(eg, sph(r, 24), ink, x, y, z, 0, 0, 0, [1, 1.08, 0.5]); e.userData.sy = 1.08; eyes.push(e); add(eg, sph(r * 0.3, 12), C.paper, x + r * 0.35, y + r * 0.42, z + r * 0.45); };
  const bar = (x0, y0, x1, y1, r = 1.3) => add(g, cyl(r, r, Math.hypot(x1 - x0, y1 - y0), 10), ink, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2);
  const arc = (x, y, r, rot, len = Math.PI, t = 1.4) => add(g, new T.TorusGeometry(r, t, 10, 24, len), ink, x, y, z, 0, 0, rot);
  const smile = (x = 0, w = 6.5) => arc(x, -6, w, Math.PI);
  const brow = (x, tilt = 0) => arc(x, ey + 5, 5, Math.PI * 0.25 + tilt, Math.PI * 0.5, 0.85);
  const open = () => { const sh = new T.Shape(); sh.moveTo(-6.5, 0); sh.lineTo(6.5, 0); sh.absarc(0, 0, 6.5, 0, Math.PI, true);
    add(g, new T.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2, curveSegments: 16 }), ink, 0, -5, z - 0.6);
    add(g, sph(3.4, 18), C.tongue, 0, -9, z + 1, 0, 0, 0, [1, 0.6, 0.35]); };
  if (pose === 'wink') { glossy(-ex, ey); bar(ex + 3.5, ey + 3.5, ex - 3, ey); bar(ex - 3, ey, ex + 3.5, ey - 3.5); smile(); }
  else if (pose === 'done') { arc(-ex, ey - 1.5, 4.4, 0); arc(ex, ey - 1.5, 4.4, 0); open(); }
  else if (pose === 'cool') { for (const sd of [-1, 1]) add(gl, rbox(15, 9.5, 2.4, 3.6), ink, sd * 9.5, ey, z); add(gl, cyl(1.1, 1.1, 6, 10), ink, 0, ey + 2.5, z, 0, 0, Math.PI / 2); brow(-ex); brow(ex); smile(0, 5); }
  else if (pose === 'surprised') { brow(-ex); brow(ex); glossy(-ex, ey); glossy(ex, ey); add(g, sph(3.2, 18), ink, 0, -8, z, 0, 0, 0, [0.9, 1.15, 0.4]); add(g, sph(1.7, 14), C.tongue, 0, -9.3, z + 1.1, 0, 0, 0, [1, 0.7, 0.4]); }
  else if (pose === 'think') { brow(-ex, 0.3); brow(ex, -0.05);
    glossy(-ex + 1.6, ey + 1.6); glossy(ex + 1.6, ey + 1.6);   // the same glossy black eyes as idle, glancing up to the side
    arc(3, -6.5, 4.6, Math.PI + 0.3, Math.PI * 0.75); }
  else if (pose === 'sleep') { for (const sd of [-1, 1]) arc(sd * ex, ey + 1, 4.2, Math.PI, Math.PI, 1.2); add(g, sph(1.9, 14), ink, 0, -7, z, 0, 0, 0, [1, 1.2, 0.4]); }
  else if (pose === 'dizzy') { for (const sd of [-1, 1]) { add(g, new T.TorusGeometry(4.4, 0.9, 8, 28), ink, sd * ex, ey, z); add(g, sph(1.5, 12), ink, sd * ex, ey, z); }
    bar(-5, -7, -2, -5.5, 1.1); bar(-2, -5.5, 1, -7, 1.1); bar(1, -7, 4, -5.5, 1.1); }
  else { glossy(-ex, ey); glossy(ex, ey); smile(); }
  return eyes;
}

/** Builds Chippy with one expression into group g. g.userData.anim: { pads: [[material, angle]], lid, eyes, eyeGroup, glasses }. */
export function build(g, pose) {
  const A = { pads: [], eyes: [] };
  add(g, rbox(76, 76, 8, 5), C.pcb, 0, 0, -1);                              // the board
  for (let i = 0; i < 6; i++) {                                              // six small gold contacts a side
    const k = -20 + i * 8;
    for (let q = 0; q < 4; q++) { const [x, y] = quarter(q, -34.5, k), m = mat(C.gold, true);
      addM(g, q % 2 ? rbox(5, 3, 1, 0.6) : rbox(3, 5, 1, 0.6), m, x, y, 3.2); A.pads.push([m, Math.atan2(y, x)]); }
  }
  add(g, cyl(4.2, 4.2, 1.4, 3), C.gold, -35.5, 35.5, 3.4, Math.PI / 2, 0, Math.PI / 4);   // the gold corner triangle
  for (const [x, y] of [[-31, -35], [-29, 35.5], [35, -29]]) add(g, rbox(2.4, 3.6, 1.6, 0.6), C.silver, x, y, 3.6);
  const pg = rbox(2.6, 2.6, 1, 0.6);                                         // the contact grid on the back, in silver (no extra gold)
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = -26.25 + i * 7.5, y = -26.25 + j * 7.5; if (Math.abs(x) > 8 || Math.abs(y) > 8) add(g, pg, C.silver, x, y, -5.3); }
  A.lid = mat(C.silver, true); addM(g, rbox(58, 58, 4, 7), A.lid, 0, 0, 4.6); addM(g, rbox(50, 50, 4, 7), A.lid, 0, 0, 7.4);
  add(g, new T.TorusGeometry(2.4, 0.45, 8, 24), C.etch, -18, 18, 9.5);      // the engraved dot
  A.eyes = sheetFace(g, pose, 9.7); A.eyeGroup = A.eyes.group; A.glasses = A.eyes.glasses;
  g.userData.anim = A;
  return g;
}

/** One sleep "Z" (three silver bars). */
export function makeZ() {
  const z = new T.Group(), bar = (x0, y0, x1, y1) => add(z, cyl(1.2, 1.2, Math.hypot(x1 - x0, y1 - y0), 8), C.silver, (x0 + x1) / 2, (y0 + y1) / 2, 0, 0, 0, Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2);
  bar(-4, 4, 4, 4); bar(4, 4, -4, -4); bar(-4, -4, 4, -4);
  return z;
}

/** Frees the geometry of a group (the cached materials stay; the fresh ones go with their meshes). */
export function dispose(o) {
  o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material && !Object.values(cache).includes(m.material)) m.material.dispose(); });
}
export { T };
