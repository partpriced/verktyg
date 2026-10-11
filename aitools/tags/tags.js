/* Auto tags page: a photo in, suggested tags out (MobileNetV3, ImageNet labels, in the inference worker). The person
 * accepts or edits them. Saving writes meta.tags on the photo's Files record through shared/tags (TlbxTags). */
(function () {
  'use strict';
  const T = window.TlbxAITools, $ = (id) => document.getElementById(id), TAGS = window.TlbxTags;
  let pic = null, driveId = null, driveMeta = {}, suggestions = [];

  /** Suggestions as toggle buttons: a click adds the tag to the text box (or removes it). */
  function renderSuggestions() {
    const box = $('sugg'); box.replaceChildren();
    for (const s of suggestions) {
      const b = document.createElement('button'), tag = TAGS.norm(s.label), on = TAGS.parse($('tagText').value).includes(tag);
      b.type = 'button'; b.textContent = `${tag} ${Math.round(s.p * 100)}%`; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.addEventListener('click', () => {
        const cur = TAGS.parse($('tagText').value);
        const next = cur.includes(tag) ? TAGS.withoutTag(cur, tag) : TAGS.withAdded(cur, [tag]);
        $('tagText').value = next.join(', ');
        renderSuggestions();
      });
      box.append(b);
    }
  }
  async function showPic(bitmapFile, meta) {
    pic = await T.image(bitmapFile);
    const url = URL.createObjectURL(bitmapFile), img = $('pic');
    img.src = url; img.hidden = false;
    $('run').disabled = false; suggestions = []; renderSuggestions();
    $('msg').textContent = meta || 'Press Suggest tags.';
  }
  async function suggest() {
    $('run').disabled = true; $('msg').textContent = 'Reading the picture…';
    try {
      await T.ensure('mobilenetv3-l100', (s) => ($('msg').textContent = s));
      const r = await T.call('classify', { bitmap: pic.bitmap, w: pic.w, h: pic.h }, { transfer: [pic.bitmap] });
      pic.bitmap = null;
      suggestions = r.tags.filter((t) => t.p >= 0.02);
      $('tagText').value = TAGS.parse($('tagText').value).join(', ');
      renderSuggestions();
      $('save').disabled = !driveId && !window.TlbxHub;
      $('msg').textContent = suggestions.length ? 'Tap a suggestion to accept it, or edit the text. Then save.' : 'Nothing confident enough. Type your own tags.';
    } catch (e) { $('msg').textContent = 'Could not suggest tags: ' + e.message; }
    finally { $('run').disabled = false; }
  }
  /** Writes the accepted tags to the Drive record (a new record for an uploaded photo). */
  async function save() {
    const tags = TAGS.parse($('tagText').value);
    if (!window.TlbxHub) { $('msg').textContent = 'Files is not available here.'; return; }
    try {
      if (driveId) {
        const rec = await window.TlbxHub.get(driveId);
        const meta = Object.assign({}, rec.meta || {}, { tags: [...tags] });
        await window.TlbxHub.update(driveId, { meta }, { touch: false });
      } else {
        $('msg').textContent = 'Pick a photo from Files first, or upload it so it can be saved.';
        return;
      }
      $('msg').textContent = `Saved ${tags.length} tag${tags.length === 1 ? '' : 's'} to ${driveMeta.name || 'the photo'} in Files.`;
    } catch (e) { $('msg').textContent = 'Could not save the tags: ' + e.message; }
  }
  /** Uploaded files are first put in Files, so the tags have a record to live on. */
  async function pick(f) {
    if (!f || !/^image\//.test(f.type)) { $('msg').textContent = 'Choose an image file.'; return; }
    driveId = window.TlbxHub ? await T.toDrive(f.name, f, 'ai-tags', { tags: [] }) : null;
    driveMeta = { name: f.name };
    await showPic(f, driveId ? `${f.name} is in Files. Press Suggest tags.` : 'Press Suggest tags. Files is not available, so tags cannot be saved.');
  }
  async function listDrive() {
    const box = $('driveList'); box.replaceChildren(); box.hidden = false;
    const rows = (await window.TlbxHub.list()).filter((r) => !r.isFolder && /^image\//.test(r.type || '')).slice(0, 40);
    if (!rows.length) { box.textContent = 'No photos in Files yet.'; return; }
    for (const r of rows) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = r.name;
      b.addEventListener('click', async () => {
        const rec = await window.TlbxHub.get(r.id);
        driveId = r.id; driveMeta = { name: r.name };
        $('tagText').value = TAGS.of(rec).join(', ');
        box.hidden = true;
        await showPic(rec.blob, `${r.name} from Files. Press Suggest tags.`);
      });
      box.append(b);
    }
  }
  $('file').addEventListener('change', (e) => pick(e.target.files[0]));
  $('drop').addEventListener('dragover', (e) => e.preventDefault());
  $('drop').addEventListener('drop', (e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); });
  $('pickDrive').addEventListener('click', listDrive);
  $('run').addEventListener('click', suggest);
  $('save').addEventListener('click', save);
  T.gate('tags', () => { $('ui').hidden = false; });
})();
