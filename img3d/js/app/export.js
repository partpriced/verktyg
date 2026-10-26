/* Image to 3D: exports and hand-off. OBJ and GLB are written by the shared 3D I/O module (shared/3d-io/write.js,
 * the three.js exporters), the same writer 3D Modeller and File Converter use. "Open in 3D Modeller" puts a .s3d scene in Tlbx
 * Drive through TlbxHub and opens 3D Modeller on it. Nothing leaves the device. Classic script, page only.
 * Sets window.TlbxImg3D.exporter. */
(function (root) {
  'use strict';
  const ns = (root.TlbxImg3D = root.TlbxImg3D || {});
  const S3D = 'application/x-tlbx-3d';
  const tr = (k, v, en) => { const I = root.TlbxI18n; return I && I.has(k) ? I.t(k, v) : en; };   // English when the tables are missing (tests load this alone)
  // the site root, from this script's own address (so tests that load it from another page find the same files)
  const ROOT = new URL('../../../', (document.currentScript && document.currentScript.src) || location.href);
  let io = null;
  const load = () => (io ??= Promise.all([import(new URL('shared/3d-io/write.js', ROOT).href), import(new URL('vendor/three/three.module.min.js', ROOT).href)])
    .then(([write, T]) => ({ writeModel: write.writeModel, T })));

  /** Saves a file: TlbxUI.download (shared/tlbxui.js), the one copy. */
  function download(blob, name) { window.TlbxUI.download(blob, name); }
  const fail = (e) => { if (window.TlbxUI) window.TlbxUI.toast(tr('img3d.export.failed', { error: (e && e.message) || String(e) }, 'Could not export: ' + ((e && e.message) || e))); };

  /** A three.js object for a height-field mesh ({ positions, normals, uv, indices }) or a point cloud ({ positions, colors }).
   *  canvas: the picture, used as the mesh's colour texture (saved as JPEG inside a GLB). */
  function objectOf(T, item, name, canvas) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(item.positions), 3));
    const group = new T.Group();
    group.name = name;
    if (item.kind === 'mesh' || item.indices) {
      if (item.normals) g.setAttribute('normal', new T.BufferAttribute(new Float32Array(item.normals), 3));
      if (item.uv) g.setAttribute('uv', new T.BufferAttribute(new Float32Array(item.uv), 2));
      g.setIndex(new T.BufferAttribute(new Uint32Array(item.indices), 1));
      const mat = new T.MeshStandardMaterial({ name: 'Image', color: 0xffffff, roughness: 0.9, metalness: 0, side: T.DoubleSide });
      if (canvas && item.uv) {
        mat.map = new T.CanvasTexture(canvas);
        mat.map.colorSpace = T.SRGBColorSpace;
        mat.map.userData.mimeType = 'image/jpeg';
      }
      const m = new T.Mesh(g, mat);
      m.name = name;
      group.add(m);
    } else {
      g.setAttribute('color', new T.BufferAttribute(new Float32Array(item.colors), 3));
      const p = new T.Points(g, new T.PointsMaterial({ name: 'Points', vertexColors: true, size: 0.01 }));
      p.name = name;
      group.add(p);
    }
    return group;
  }

  /** OBJ of a height-field mesh: the geometry only (no MTL file), as before. Resolves with the OBJ text. */
  async function objText(mesh, name) {
    const { writeModel, T } = await load();
    const { files } = await writeModel(objectOf(T, Object.assign({ kind: 'mesh' }, mesh), name, null), 'obj', { name, materials: false });
    return files[0].blob.text();
  }
  async function exportObj(mesh, name) {
    try { download(new Blob([await objText(mesh, name)], { type: 'model/obj' }), name + '.obj'); } catch (e) { fail(e); }
  }

  /** The GLB bytes of a mesh (textured) or a point cloud (coloured), as an ArrayBuffer. */
  async function glbBytes(item, name, canvas) {
    const { writeModel, T } = await load();
    const { files } = await writeModel(objectOf(T, item, name, canvas), 'glb', { name });
    return files[0].blob.arrayBuffer();
  }
  /** GLB of a mesh or a point cloud. item: the viewer's object from hf.heightField / pointCloud / splats. */
  async function exportGlb(item, name, canvas) {
    try { download(new Blob([await glbBytes(item, name, canvas)], { type: 'model/gltf-binary' }), name + '.glb'); } catch (e) { fail(e); }
  }

  /** Puts the mesh in Files as a .s3d scene and opens 3D Modeller on it (the one way out, TlbxOuttake.send). */
  async function sendTo3d(mesh, name, canvas) {
    if (!root.TlbxOuttake) throw new Error('Files is not available in this browser');
    const scene = ns.s3d.sceneOf(mesh, { name, texture: canvas ? ns.image.jpegUrl(canvas) : null });
    const blob = new Blob([JSON.stringify(scene)], { type: S3D });
    return root.TlbxOuttake.send('3d', { from: 'img3d', get: () => blob, name: name + '.s3d', type: S3D });
  }

  ns.exporter = { exportObj, exportGlb, sendTo3d, objText, glbBytes, download };
})(typeof window !== 'undefined' ? window : globalThis);
