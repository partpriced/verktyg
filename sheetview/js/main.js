/* Spreadsheet Viewer viewer: boot. Opens files through the one intake (shared/intake, spec 'sheetview': the Open buttons, a
 * drop, the sample, a paste, ?drive=<id> from Files, a PWA launch; several at once as tabs),
 * wires the header, the Export and Menu buttons, the commands, the table style choices and Open in Spreadsheet.
 * Module script; the classic scripts (apps, tlbxui, hub, drop, commands) load first.
 * Test hook: window.TlbxSheetView.open(files) takes File objects through the intake, as the Open button does. */
import { read } from '../../shared/sheets/read.js';
import { csvBlob } from '../../shared/sheets/csv.js';
import { createStore } from './state.js';
import { createView } from './view.js';
import { exportItems, exportFile } from './export.js';
import { STYLES, PALETTES, loadAppearance, saveAppearance } from './appearance.js';
import { mountPanel } from './panel.js';

const $ = (id) => document.getElementById(id);
const toast = (msg) => { if (window.TlbxUI) window.TlbxUI.toast(msg); };
const ACCEPT = '.xlsx,.xlsm,.csv,.tsv,.xls,.ods';
const MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet', 'text/csv', 'text/tab-separated-values', 'text/plain',
];

const appearance = loadAppearance();
let view = null, side = null;
const store = createStore(() => { if (view) view.render(); if (side) side.paint(); });

/** Reads one file into a new tab. Throws the reason when it cannot be read (the drop panel shows it). */
async function openFile(file) {
  const parsed = await read(file, { name: file.name });
  store.addDoc(parsed, { name: file.name });
  return file.name;
}

/* The one way in: every source reaches openFile, a file at a time (one that fails is refused with its reason in the strip
   and the toast, and the rest still open). */
function registerIntake() {
  window.TlbxIntake.register({
    id: 'sheetview', limit: 20, process: (file) => openFile(file),
    accept: { types: MIME, exts: ['.xlsx', '.xlsm', '.csv', '.tsv', '.xls', '.ods'], noun: 'a spreadsheet' },
  });
}
const pickFiles = () => window.TlbxIntake.pick({ to: 'sheetview', accept: ACCEPT });

/** The current sheet, all rows, as CSV, opened in Spreadsheet through Files. */
async function openInTables() {
  const d = store.doc();
  if (!d) return;
  const sheet = store.sheet();
  const name = `${d.name}${d.sheets.length > 1 ? ' - ' + sheet.name : ''}.csv`;
  try {
    // No byte-order mark: Spreadsheets reads the text as it is, and a BOM would sit in cell A1. The one way out.
    await window.TlbxOuttake.send('tables', { from: 'sheetview', get: () => csvBlob(sheet, null, ',', { bom: false }), name, type: 'text/csv' });
  } catch (e) {
    toast('Could not send to Spreadsheet: ' + e.message);
  }
}

async function runExport(kind, scope, ctx) {
  try {
    const name = await exportFile(kind, scope, ctx);
    toast(`Exported ${name}`);
  } catch (e) {
    toast('Could not export: ' + e.message);
  }
}

function exportContext() {
  const d = store.doc();
  return d ? { doc: d, sheet: store.sheet(), order: store.order() } : null;
}

function exportMenu(anchor) {
  const ctx = exportContext();
  if (!ctx) { toast('Open a spreadsheet first'); return; }
  const r = anchor.getBoundingClientRect();
  window.TlbxUI.menu(exportItems(ctx, runExport), r.left, r.bottom + 4);
}

/** Convert… (shared/convert/dialog.js, loaded on first use): File Converter's tool in a dialog, with the open document
 *  as XLSX (its provider is in export.js). This page has no shell header, so the Menu and the palette offer it. */
const openConvert = () => import('../../shared/convert/dialog.js').then((m) => m.open({})).catch(() => toast('Convert is not available offline'));

function menuItems() {
  const has = !!store.doc();
  const v = store.view();
  const nothingToClear = !v || (!v.sort && ![...v.filters.values()].length);
  return [
    { label: 'Open spreadsheet…', key: cmdKey('open'), act: pickFiles },
    '-',
    ...exportItems(exportContext() || { doc: null, sheet: null, order: [] }, runExport).map((it) => (it === '-' ? it : { ...it, disabled: !has })),
    '-',
    { label: 'Open current sheet in Spreadsheet', disabled: !has, act: openInTables },
    { label: 'Convert files…', act: openConvert },
    { label: 'Clear sort and filters', disabled: !has || nothingToClear, act: () => store.clearView() },
  ];
}

const cmdKey = (id) => (window.TlbxCtx ? TlbxCtx.keyFor('sheetview.' + id) : '');

function registerCommands() {
  if (!window.TlbxCmd) return;
  TlbxCmd.init({ app: 'sheetview' });
  const C = (id, title, keys, run, extra = {}) => ({ id: 'sheetview.' + id, title, group: 'File', keys, run, ...extra });
  TlbxCmd.register([
    C('open', 'Open spreadsheet…', ['Mod+O'], pickFiles, { keywords: ['load', 'csv', 'xlsx', 'computer'] }),
    C('hub', 'Open current sheet in Spreadsheet', [], openInTables, { keywords: ['tables', 'edit', 'drive'], when: () => !!store.doc() }),
    C('export-visible-csv', 'Export visible rows as CSV', [], () => runExport('csv', 'visible', exportContext()), { keywords: ['save', 'filter'], when: () => !!store.doc() }),
    C('export-all-xlsx', 'Export all rows as XLSX', [], () => runExport('xlsx', 'all', exportContext()), { keywords: ['excel', 'save'], when: () => !!store.doc() }),
    C('convert', 'Convert files…', [], openConvert, { keywords: ['convert', 'format', 'pdf', 'json', 'csv'] }),
    C('clear', 'Clear sort and filters', [], () => store.clearView(), { keywords: ['reset', 'sort', 'filter'], when: () => !!store.doc() }),
  ]);
  // the assistant's commands with arguments (ai-commands.js), loaded when the AI panel first asks
  if (TlbxCmd.provide) TlbxCmd.provide({ prepare: () => import('./ai-commands.js').then((m) => m.install(store, openFile)) });
}

function wireHeader() {
  $('sv-open').addEventListener('click', pickFiles);
  $('sv-open2').addEventListener('click', pickFiles);
  $('sv-export').addEventListener('click', (e) => exportMenu(e.currentTarget));
  $('sv-hub').addEventListener('click', openInTables);
  $('sv-clear').addEventListener('click', () => store.clearView());
  $('sv-cmd').addEventListener('click', () => { if (window.TlbxCmd && TlbxCmd.open) TlbxCmd.open(); });
  $('sv-menu').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    window.TlbxUI.menu(menuItems(), r.left, r.bottom + 4);
  });

  const fill = (sel, list, value) => {
    sel.replaceChildren(...list.map(([id, label]) => { const o = document.createElement('option'); o.value = id; o.textContent = label; return o; }));
    sel.value = value;
  };
  const style = $('sv-style'), palette = $('sv-palette');
  fill(style, STYLES, appearance.style);
  fill(palette, PALETTES, appearance.palette);
  const change = () => {
    appearance.style = style.value;
    appearance.palette = palette.value;
    saveAppearance(appearance);
    view.restyle(appearance);
  };
  style.addEventListener('change', change);
  palette.addEventListener('change', change);
}

function wireDrop() {
  window.TlbxDrop.attach($('sv-drop'), {
    intake: 'sheetview',
    compact: true,
    targets: [document.querySelector('.sv-app')],
  });
  // The empty page shows what a sheet looks like here and how (TlbxDrop's preview); the sample goes through the strip.
  const empty = $('sv-empty'), sample = document.createElement('button');
  empty.insertBefore(window.TlbxDrop.panel.preview({
    picture: { src: '../assets/shots/sheetview.jpg', alt: 'A price list open in Spreadsheet Viewer, sorted by price' },
    steps: ['Drop an .xlsx, .csv or .tsv file', 'Sort and filter any column', 'Export the rows you need'],
  }), empty.querySelector('.sv-empty-b'));
  sample.type = 'button'; sample.className = 'sd-sample'; sample.id = 'sv-sample'; sample.textContent = 'Try it with a sample price list';
  sample.addEventListener('click', () => window.TlbxIntake.sample(() => window.TlbxSamples.docs.xlsx().then((f) => [f]), { to: 'sheetview' }));
  empty.querySelector('.sv-empty-b').append(sample);
}

async function boot() {
  TlbxHub.register('sheetview');
  registerIntake();
  view = createView(store, {
    empty: $('sv-empty'), view: $('sv-view'), grid: $('sv-grid'), docs: $('sv-docs'), sheets: $('sv-sheets'),
    name: $('sv-name'), status: $('sv-status'), clear: $('sv-clear'),
  }, appearance);
  wireHeader();
  side = mountPanel({ has: () => !!store.doc() });   // the panel on the right, Export at its foot (panel.js)
  wireDrop();
  registerCommands();
  window.TlbxSheetView = { open: (files) => window.TlbxIntake.take(Array.from(files), { to: 'sheetview' }), store };
  view.render();
  try { await window.TlbxIntake.launch({ to: 'sheetview' }); } catch (e) { toast('Could not open that file: ' + e.message); }
  view.render();
  document.body.classList.add('ready');
}

// Module scripts run once the page is parsed, so the elements exist here.
boot().catch((e) => { console.error(e); document.body.classList.add('ready'); toast('Spreadsheet Viewer could not start: ' + e.message); });
