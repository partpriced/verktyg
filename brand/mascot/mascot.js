// Copyright (c) 2026 PartPriced. All rights reserved. Not covered by the MIT License.
// Chippy in the mascot slot (shared/mascot/slot.js has the contract): a small three.js stage that floats Chippy, blinks,
// lights the gold contacts in a circle while it thinks, sweeps a glint over the lid when a job is done, and plays the 17
// animations (anims.js) by name. The slot maps the page's moments to them: greeting -> hello, a task -> working,
// done -> celebrate, error -> oops, a quiet minute -> sleep, the next input -> wake, pointing at a control -> point.
// create() throws without WebGL; the slot then shows the flat icon (icon.js).
// The slot's optional hooks: look(dx, dy) turns the eyes towards the pointer (-1..1 each way, eased per frame), and
// react(kind, detail) answers a touch: hover (happy while on), poke (surprised, then a wink), drag (a slight tilt the way
// it moves, dizzy when shaken), drop (a small bounce). A reaction lays its face and motion over the running animation,
// which carries on underneath. travel ({ on, dx }: a roaming slot floats Chippy to another spot) turns Chippy a little
// the way it goes until it arrives (the slot leans the whole stage and turns the eyes). With reduced motion the faces
// change but nothing tilts or bounces.
import { T, build, makeZ, dispose } from './model.js';
import { ANIMS } from './anims.js';

export { name } from './icon.js';
export const animations = Object.keys(ANIMS);

const MIRROR = ['px', 'ry', 'rz', 'look'];   // what a side of -1 turns round

export function create(el, { reduce = false } = {}) {
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  el.append(canvas);
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { canvas.remove(); throw e; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 1, 2000);
  cam.position.set(0, 6, 330);
  const BASE_Y = -18, root = new T.Group();
  root.position.y = BASE_Y; scene.add(root);
  const shadow = new T.Mesh(new T.CircleGeometry(40, 48), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = BASE_Y - 62; shadow.scale.set(1, 0.35, 1); scene.add(shadow);

  const t0 = performance.now(), secs = () => (performance.now() - t0) / 1000;
  let shown = null, A = null, anim = null, zs = null, poseT = 0, raf = 0, w = 0, h = 0;
  // the hooks' state: eye target and eased position, hover, the poke and drop timers, the drag tilt and its shake
  const eye = { tx: 0, ty: 0, x: 0, y: 0 }, re = { hover: false, poke: -9, drop: -9, drag: false, shake: 0, tilt: 0, tiltT: 0, yaw: 0, yawT: 0 };
  const EYE_X = 3.4, EYE_Y = 2.4;
  function reactFace(t) {                  // the face a reaction asks for now, or null
    if (re.drag) return re.shake > 0.5 ? 'dizzy' : 'surprised';
    const p = t - re.poke;
    if (p < 0.55) return 'surprised';
    if (p < 1.3) return 'wink';
    if (t - re.drop < 0.5) return 'idle';
    return re.hover ? 'done' : null;
  }
  function show(pose) {                    // rebuilds Chippy with this face; animations call it whenever their face changes
    while (root.children.length) { const o = root.children[0]; dispose(o); root.remove(o); }
    const g = build(new T.Group(), pose); root.add(g);
    A = g.userData.anim; shown = pose; poseT = secs();
  }
  function fit() {
    const cw = el.clientWidth || 112, ch = el.clientHeight || 136;
    if (cw === w && ch === h) return;
    w = cw; h = ch; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  function clearZs() { if (zs) { dispose(zs); scene.remove(zs); zs = null; } }
  function finish() {                      // the animation ended (or was cut off): back to idle
    const done = anim && anim.resolve;
    anim = null; clearZs();
    root.position.x = 0; root.rotation.set(0, 0, 0); root.scale.set(1, 1, 1);
    if (A) { A.eyeGroup.position.x = 0; A.glasses.position.y = 0; }
    const f = reactFace(secs()) || 'idle'; if (f !== shown) show(f);
    if (done) done();
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!el.isConnected || document.hidden || el.closest('[hidden]')) return;
    fit();
    const t = secs(), g = root.children[0];
    root.position.y = BASE_Y + (reduce ? 0 : Math.sin(t * 1.6) * 2.5);            // Chippy floats
    if (g) g.rotation.y = reduce ? 0 : Math.sin(t * 0.25) * 0.35;
    let look = 0;
    if (anim) {
      let at = t - anim.t0;
      const d = ANIMS[anim.k];
      if (at >= d.dur && anim.loop) { anim.t0 = t; at = 0; }
      if (at >= d.dur) finish();
      else {
        const f = reactFace(t) || d.face(at); if (f !== shown) show(f);
        const x = reduce ? {} : Object.assign({}, d.tf(at));
        if (anim.side < 0) for (const k of MIRROR) if (x[k]) x[k] = -x[k];
        root.position.x = x.px || 0; root.position.y += x.py || 0; root.rotation.x = x.rx || 0; root.rotation.z = x.rz || 0;
        root.scale.set(x.sx ?? 1, x.sy ?? 1, x.sz ?? 1);
        const c = root.children[0]; if (c) c.rotation.y += x.ry || 0;
        look = x.look || 0; A.glasses.position.y = x.glassY || 0;
        if (x.zs != null) {
          if (!zs) { zs = new T.Group(); for (let i = 0; i < 3; i++) zs.add(makeZ()); scene.add(zs); }
          zs.children.forEach((z, i) => { const u = ((x.zs + i * 0.9) % 2.7) / 2.7; z.position.set(34 + u * 22 + root.position.x, BASE_Y + 34 + u * 46, 10); z.scale.setScalar(0.5 + u * 0.9); z.visible = x.zs > i * 0.9; });
        }
      }
    }
    if (!anim) { const f = reactFace(t) || 'idle'; if (f !== shown) show(f); root.rotation.z = 0; }
    // the hooks: the eyes ease towards the pointer, a drag tilts, a drop bounces (motion only without reduced motion)
    const k = reduce ? 1 : 0.18;
    eye.x += (eye.tx - eye.x) * k; eye.y += (eye.ty - eye.y) * k;
    if (A) { A.eyeGroup.position.x = Math.max(-EYE_X, Math.min(EYE_X, look + eye.x * EYE_X)); A.eyeGroup.position.y = eye.y * EYE_Y; }
    if (!re.drag) { re.tiltT = 0; re.shake *= 0.9; }
    re.tilt += (re.tiltT - re.tilt) * 0.2;
    re.yaw += (re.yawT - re.yaw) * 0.06;    // travelling: turned towards where it goes
    if (!reduce) {
      if (g) g.rotation.y += re.yaw;
      root.rotation.z += re.tilt;
      const b = (t - re.drop) / 0.45; if (b > 0 && b < 1) root.position.y += Math.sin(b * Math.PI) * 9 * (1 - b);
    }
    if (A && !reduce) {                    // blink, the contacts chasing round while thinking, a glint on done
      if (!anim || shown === 'idle') A.eyes.forEach((e) => { e.scale.y = (t % 3.7) < 0.12 ? 0.12 : e.userData.sy; });
      const tp = t - poseT;
      A.pads.forEach(([m, a]) => { m.uniforms.glow.value = shown === 'think' ? Math.pow(Math.max(0, Math.cos(a + tp * 4)), 8) : 0; });
      const per = shown === 'done' ? 2.6 : 7, ph = (tp % per) / 0.9;
      A.lid.uniforms.sweep.value = -70 + ph * 140; A.lid.uniforms.strength.value = ph < 1 ? (shown === 'done' ? 1 : 0.45) : 0;
    }
    renderer.render(scene, cam);
  }
  show('idle');
  raf = requestAnimationFrame(frame);

  return {
    /** Plays an animation by name in place of the running one; settles when it ends or is cut off. */
    play(k, { loop = false, side = 0 } = {}) {
      if (!ANIMS[k]) return Promise.resolve();
      if (anim && anim.resolve) anim.resolve();
      clearZs();
      return new Promise((resolve) => { anim = { k, t0: secs(), loop, side: side < 0 ? -1 : 1, resolve }; });
    },
    /** Eyes towards the pointer: dx, dy in -1..1 (0, 0 looks ahead). */
    look(dx, dy) { eye.tx = Math.max(-1, Math.min(1, +dx || 0)); eye.ty = Math.max(-1, Math.min(1, +dy || 0)); },
    /** A touch: 'hover' ({ on }), 'poke', 'drag' ({ dx, dy, shake }), 'drop'; 'travel' ({ on, dx, dy }) from a roaming slot.
     * Unknown kinds do nothing. */
    react(kind, detail = {}) {
      const t = secs();
      if (kind === 'hover') re.hover = !!detail.on;
      else if (kind === 'poke') re.poke = t;
      else if (kind === 'drag') { re.drag = true; re.shake = Math.max(0, Math.min(1, +detail.shake || 0)); re.tiltT = Math.max(-0.25, Math.min(0.25, -(+detail.dx || 0) * 0.02)); }
      else if (kind === 'drop') { re.drag = false; re.drop = t; re.poke = -9; }
      else if (kind === 'travel') re.yawT = detail.on ? Math.max(-1, Math.min(1, +detail.dx || 0)) * 0.45 : 0;
    },
    get pose() { return shown; },
    get playing() { return anim ? anim.k : null; },
    dispose() { cancelAnimationFrame(raf); if (anim && anim.resolve) anim.resolve(); anim = null; clearZs(); dispose(root); dispose(shadow); renderer.dispose(); canvas.remove(); },
  };
}
