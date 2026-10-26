/* Screen Recorder: TlbxCmd commands (Ctrl+K, the shortcut editor, macros) for the page's own actions, and the assistant's
 * commands with arguments (ai-commands.js), loaded by TlbxCmd.prepare() when the AI panel first asks. Classic script, after
 * main.js. Alt+R records or stops, Alt+P pauses or resumes (Ctrl and ⌘ keys are the browser's: Ctrl+Shift+R reloads). */
(function () {
  'use strict';
  const script = (src) => new Promise((res, rej) => {
    const s = Object.assign(document.createElement('script'), { src: new URL(src, location.href).href });
    s.onload = () => res(); s.onerror = () => rej(new Error('Could not load ' + src)); document.head.append(s);
  });
  /** The assistant's commands, with the shared file sources they read Files through. */
  const loadAI = () => (window.TlbxCmdSources ? Promise.resolve() : script('../shared/commands/sources.js')).then(() => script('js/ai-commands.js'));
  const t = (k) => (window.TlbxI18n ? window.TlbxI18n.t(k) : k);
  function init() {
    const C = window.TlbxCmd, A = window.TlbxRec && window.TlbxRec.app;
    if (!C || !A) return;
    C.init({ app: 'recorder' });
    const on = () => ['recording', 'paused'].includes(A.state());
    const quiet = (p) => Promise.resolve(p).catch(() => {});
    // the titles and groups in the page's language; registered again on a language change
    const register = () => C.register([
      { id: 'recorder.record', title: t('recorder.cmd.record'), group: t('recorder.cmd.g_record'), keys: ['Alt+R'], keywords: ['start', 'capture', 'screen', 'webcam', 'microphone'],
        run: () => quiet(A.state() === 'countdown' ? A.cancel() : on() ? A.stop() : A.record()) },
      { id: 'recorder.pause', title: t('recorder.cmd.pause'), group: t('recorder.cmd.g_record'), keys: ['Alt+P'], keywords: ['hold', 'continue'], when: on, run: () => A.togglePause() },
      { id: 'recorder.open', title: t('recorder.app.open'), group: t('menu.file'), keys: [], keywords: ['trim', 'convert', 'webm'], when: () => !on(), run: () => window.TlbxIntake.pick({ to: 'recorder', multiple: false }) },
      { id: 'recorder.download', title: t('recorder.cmd.download'), group: t('menu.file'), keys: [], when: () => !!A.recording() && !on(), run: () => quiet(window.TlbxRec.save.download()) },
      { id: 'recorder.drive', title: t('recorder.cmd.drive'), group: t('menu.file'), keys: [], when: () => !!A.recording() && !on(), run: () => quiet(window.TlbxRec.save.toDrive()) },
      { id: 'recorder.discard', title: t('recorder.cmd.discard'), group: t('menu.edit'), keys: [], when: () => !!A.recording() && !on(), run: () => A.discard() },
    ]);
    register();
    if (window.TlbxI18n && window.TlbxI18n.on) window.TlbxI18n.on(register);
    if (C.provide) C.provide({ prepare: loadAI });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
