/* Upscaler: the model registry. Classic script (page or worker); sets TlbxUpscaleModels, module.exports in Node.
 * Paths are relative to the site root. Files and their sources, licences and SHA-256 are in
 * vendor/models/upscale/index.json (conversion scripts: vendor/models/tools/upscale-*.py).
 *   bytes            the file's real size: the one source for every size the app shows (TlbxFirstRun.size(bytes))
 *   bundled: true   ships with the site, loaded on demand (sha256 checked on every load)
 *   bundled: false  opt-in: installed through Get more (shared/library), stored in the library database
 *   channels: 'luma'  the network works on Y only; colour comes from Lanczos (see worker.js)
 *   channels: 'rgb'   the network works on RGB */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TlbxUpscaleModels = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const MODELS = {
    'fsrcnn-x2': {
      id: 'fsrcnn-x2', name: 'Fast', arch: 'FSRCNN', scale: 2, channels: 'luma', bundled: true,
      path: 'vendor/models/upscale/fsrcnn/fsrcnn-x2.onnx', bytes: 35823,
      sha256: '624a29863cf7947dd7d4f843015a02590835154ea9c5a0ed764ce86996e07e36',
      licence: 'Apache-2.0', licenceFile: 'vendor/models/upscale/fsrcnn/LICENSE',
      blurb: 'Small and quick. Sharpens edges; best on drawings, logos and simple photos.',
    },
    'fsrcnn-x4': {
      id: 'fsrcnn-x4', name: 'Fast', arch: 'FSRCNN', scale: 4, channels: 'luma', bundled: true,
      path: 'vendor/models/upscale/fsrcnn/fsrcnn-x4.onnx', bytes: 38559,
      sha256: '4e6a6ead181643186c7e69ac69870381ad30d3661328424cd5182e5a3157c8a5',
      licence: 'Apache-2.0', licenceFile: 'vendor/models/upscale/fsrcnn/LICENSE',
      blurb: 'Small and quick. Sharpens edges; best on drawings, logos and simple photos.',
    },
    'realesrgan-x4plus': {
      id: 'realesrgan-x4plus', name: 'Quality', arch: 'Real-ESRGAN x4plus', scale: 4, channels: 'rgb', bundled: false,
      path: 'vendor/models/upscale/realesrgan-x4plus/model.onnx', bytes: 67051618,
      sha256: '8213c3a2f08808d375d2b1aeeb52847fb53a38aea9df15835eabb203dbcbc52c',
      packId: 'realesrgan-x4plus', packFile: 'model.onnx',
      licence: 'BSD-3-Clause', licenceFile: 'vendor/models/upscale/realesrgan-x4plus/LICENSE',
      blurb: 'Photos, with real detail. An opt-in download (Get more). Much slower than Fast, runs on the CPU.',
    },
  };

  /** The model with this id, or null. */
  function get(id) { return Object.prototype.hasOwnProperty.call(MODELS, id) ? MODELS[id] : null; }
  /** Model ids that give this scale (4 for x4 is Real-ESRGAN or FSRCNN x4). */
  function forScale(scale) { return Object.keys(MODELS).filter((id) => MODELS[id].scale === scale); }

  return { MODELS, get, forScale };
});
