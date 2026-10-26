/* Assistant — ui/drive: Files for conversations. A chat saved to Files is written as JSON (the same
 * format Import reads). Save writes back to that Drive file; the first save asks for a folder. Opening a chat
 * from Files links it to that file, so later saves go back to it. */
'use strict';
(function (AI) {
  const H = () => window.TlbxHub || null;
  AI.saveChatToDrive = async function (c) {
    c = c || (AI.chat && AI.chat.conv);
    const hub = H();
    if (!hub || !c || !c.messages.length) return;
    const blob = new Blob([AI.toJSON(c)], { type: 'application/json' }), name = AI.slug(c.title) + '.json';
    try {
      if (!c.driveId) { const id = await hub.saveToDrive(blob, name, { from: 'ai' }); if (!id) return; c.driveId = id; }
      else if (!(await hub.update(c.driveId, { blob, name, type: blob.type }))) await hub.put(blob, { id: c.driveId, name, from: 'ai' });
      else window.TlbxUI.toast(AI.t('ai.drive.saved', { name }));
      await AI.db.put(c, { touch: false });
    } catch (e) { window.TlbxUI.alert(AI.t('ai.drive.save_failed'), e.message || String(e)); }
  };
  /** Open a chat from Files, linked to that file: the intake's part 'ai.conv' (ui/intake.js). */
  AI.openChatFromDrive = () => (H() ? AI.intake.openConvFromDrive() : null);
})(window.AI);
