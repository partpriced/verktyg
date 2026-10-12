/* Paint, part 11: Brush: layered slime stroke and animated drips.
 * Split from the old paint.js (one IIFE). Loaded in order by index.html; state and helpers are shared through window.TlbxPaint (P). */
(() => {
'use strict';
const P = window.TlbxPaint;
const { S, clearOverlay, discSpans, markDirty, mctx, octx, stamp } = P;

/* =====================================================================
 * ITpris brush (layered slime + animated drips)
 * ===================================================================== */
const TLBX_PAL = { shadow: '#00554d', body: '#00d3be', shine: '#c5fff9' };
const TLBX_DARK = { shadow: '#002c28', body: '#006a5f', shine: '#00d3be' };
function tlbxStamp(x, y) {
  const st = P.st.tlbxStroke, pal = st.pal, d = S.tlbx, r = d / 2;
  const [sh, bo, sn] = st.X;
  sh.fillStyle = pal.shadow; stamp(sh, x + 1, y + 2, discSpans(d));
  bo.fillStyle = pal.body; stamp(bo, x, y, discSpans(d));
  sn.fillStyle = pal.shine; stamp(sn, x - Math.round(r * 0.38), y - Math.round(r * 0.42), discSpans(Math.max(2, Math.round(d * 0.26))));
  st.dist++;
  if (st.dist > st.nextDrip) {
    st.dist = 0; st.nextDrip = 6 + Math.random() * (14 + d);
    const w = Math.max(2, Math.round(2 + Math.random() * r * 0.55));
    P.st.drips.push({ x: x + Math.round((Math.random() * 1.1 - 0.55) * r) - (w >> 1), y: y + Math.round(r * 0.45), w, len: 8 + Math.random() * (14 + d * 3), done: 0, pal, X: st.X });
    if (!P.st.dripRAF) P.st.dripRAF = requestAnimationFrame(dripStep);
  }
}
function tlbxComposite() { clearOverlay(); if (P.st.tlbxStroke) for (const c of P.st.tlbxStroke.L) octx.drawImage(c, 0, 0); }
function dripStep() {
  P.st.dripRAF = 0;
  let alive = false, touchedLayers = false;
  for (const d of P.st.drips) {
    if (d.done >= d.len) continue;
    const speed = 0.35 + (1 - d.done / d.len) * 1.4;
    const y0 = Math.floor(d.y + d.done); d.done = Math.min(d.len, d.done + speed);
    const y1 = Math.floor(d.y + d.done);
    const [sh, bo, sn] = d.X || [mctx, mctx, mctx];
    if (d.X) touchedLayers = true; else markDirty();
    if (y1 > y0) {
      sh.fillStyle = d.pal.shadow; sh.fillRect(d.x + 1, y0 + 1, d.w, y1 - y0 + 1);
      bo.fillStyle = d.pal.body; bo.fillRect(d.x, y0, d.w, y1 - y0 + 1);
      if (d.w >= 3) { sn.fillStyle = d.pal.shine; sn.fillRect(d.x + 1, y0, 1, y1 - y0 + 1); }
    }
    if (d.done >= d.len) {
      const bd = d.w + 2, cx = d.x + (d.w >> 1), cy = y1;
      sh.fillStyle = d.pal.shadow; stamp(sh, cx + 1, cy + 1, discSpans(bd));
      bo.fillStyle = d.pal.body; stamp(bo, cx, cy, discSpans(bd));
      sn.fillStyle = d.pal.shine; sn.fillRect(cx - Math.floor(bd / 4), cy - Math.floor(bd / 4), 1, 1);
    } else alive = true;
  }
  P.st.drips = P.st.drips.filter(d => d.done < d.len);
  if (touchedLayers) tlbxComposite();
  if (alive) P.st.dripRAF = requestAnimationFrame(dripStep);
}
function stopDrips() { P.st.drips = []; if (P.st.dripRAF) cancelAnimationFrame(P.st.dripRAF); P.st.dripRAF = 0; }
function tlbxCommit() {
  if (!P.st.tlbxStroke) return;
  for (const c of P.st.tlbxStroke.L) mctx.drawImage(c, 0, 0);
  for (const d of P.st.drips) if (d.X === P.st.tlbxStroke.X) d.X = null;
  P.st.tlbxStroke = null;
  clearOverlay();
}

Object.assign(P, { TLBX_DARK, TLBX_PAL, tlbxCommit, tlbxComposite, tlbxStamp, stopDrips });
})();
