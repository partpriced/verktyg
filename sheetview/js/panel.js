/* Spreadsheet Viewer viewer: the panel on the right (the suite rule, shared/frame/HANDOFF.md: TlbxFrame, shared/frame/frame.js
 * and panel.js). The sheet is the view; the panel holds the table's look (Table style, Colours: the header's old pickers,
 * moved in with their ids and listeners), Open in Spreadsheet, and Export ▾, the main button, at its foot. Open, Commands
 * and Menu stay in the header. On a phone the panel is a bottom sheet whose closed state still shows Export.
 *   mountPanel({ has: () => bool }) → { paint() }   paint() after every render (Export and Spreadsheet need a sheet) */
const $ = (id) => document.getElementById(id);
const t = (k, v) => (window.TlbxI18n ? window.TlbxI18n.t(k, v) : k);

export function mountPanel({ has }) {
  if (!window.TlbxFrame) return { paint() {} };
  const side = $('sv-side');
  const frame = window.TlbxFrame.mount($('sv-body'), { view: $('sv-main'), panel: side, panelLabel: t('sheetview.app.sheet'), storageKey: 'sheetview',
    width: 260, min: 220, max: 420 });   // shown and hidden with Ctrl+Alt+B (the View command); no header button
  $('sv-export').classList.add('sv-primary');
  const p = window.TlbxFrame.panel(side, { title: t('sheetview.app.sheet') });
  const pick = (id) => { const l = $(id).closest('label'); l.classList.add('sf-field'); return l; };
  const look = [pick('sv-style'), pick('sv-palette')], hub = $('sv-hub');
  // built again on a language change: the section titles, the note and the phone's Sheet button read the language
  const draw = () => p.render([
    { key: 'look', title: t('sheetview.panel.look'), settings: look },
    { key: 'send', title: t('sheetview.panel.send'), note: t('sheetview.panel.send_note'), actions: [{ el: hub }] },
  ]);
  const paint = () => {
    const on = has();
    p.footer([{ el: $('sv-export'), primary: true, disabled: !on, title: t('sheetview.app.export_title') }], { more: t('sheetview.app.sheet') });
    $('sv-hub').disabled = !on;
  };
  draw();
  paint();
  if (window.TlbxI18n && window.TlbxI18n.on) window.TlbxI18n.on(() => { p.setTitle(t('sheetview.app.sheet')); draw(); paint(); });
  return { frame, paint };
}
