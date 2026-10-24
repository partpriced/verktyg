/* Image to 3D: exports and hand-off. OBJ goes through 3D Modeller's own writer (3d/js/core/obj.js), GLB through
 * core/glbwrite.js, and "Open in 3D Modeller" puts a .s3d scene in Files through TlbxHub and opens 3D Modeller on it.
 * Nothing leaves the device. Classic script, page only. Sets window.TlbxImg3D.exporter. */
(function (root) {
  'use strict';
  const ns = (root.TlbxImg3D = root.TlbxImg3D || {});
  const S3D = 'application/x-tlbx-3d';

  /** Saves a file: TlbxUI.download (shared/tlbxui.js), the one copy. */
  function download(blob, name) { window.TlbxUI.download(blob, name); }

  /** OBJ text of a height-field mesh, written by 3D Modeller's writer. */
  function objText(mesh, name) {
    const scene = ns.s3d.sceneOf(mesh, { name });
    return root.Tlbx3D.obj.write(scene);
  }
  function exportObj(mesh, name) {
    download(new Blob([objText(mesh, name)], { type: 'model/obj' }), name + '.obj');
  }

  /** GLB of a mesh (textured) or a point cloud (coloured). data: the viewer's object from hf.pointCloud / splats. */
  async function exportGlb(item, name, canvas) {
    const opt = { name };
    if (item.kind === 'mesh') {
      Object.assign(opt, { positions: item.positions, normals: item.normals, uv: item.uv, indices: item.indices });
      if (canvas) opt.texture = { bytes: await ns.image.jpegBytes(canvas), mime: 'image/jpeg' };
    } else {
      Object.assign(opt, { positions: item.positions, colors: item.colors, points: true });
    }
    download(new Blob([ns.glb.write(opt)], { type: 'model/gltf-binary' }), name + '.glb');
  }

  /** Puts the mesh in Files as a .s3d scene and opens 3D Modeller on it (TlbxHub.sendTo). */
  async function sendTo3d(mesh, name, canvas) {
    const H = root.TlbxHub;
    if (!H) throw new Error('Files is not available in this browser');
    const scene = ns.s3d.sceneOf(mesh, { name, texture: canvas ? ns.image.jpegUrl(canvas) : null });
    const blob = new Blob([JSON.stringify(scene)], { type: S3D });
    return H.sendTo('3d', blob, name + '.s3d');
  }

  ns.exporter = { exportObj, exportGlb, sendTo3d, objText, download };
})(typeof window !== 'undefined' ? window : globalThis);
