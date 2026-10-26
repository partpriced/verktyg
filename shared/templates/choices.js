/* ITpris templates — choices: every value the generator can pick, and the lists it picks from. The tests check
 * that each generated style choice is one of these. Colours come from the ITpris Verktyg palette (lime, ink, navy,
 * cobalt, olive, pink) and from neutral sets (graphite, slate, sand). Fonts are the families in shared/fonts. */
export const GENERATOR = 'random-template/1';

/** Heading and body font pairs (names are the families in docs/js/fonts/registry.js). */
export const FONT_PAIRS = [
  { heading: 'Inter Tight', body: 'Archivo' },
  { heading: 'Archivo', body: 'Inter Tight' },
  { heading: 'Caladea', body: 'Carlito' },
  { heading: 'Tinos', body: 'Arimo' },
  { heading: 'Caladea', body: 'Tinos' },
  { heading: 'Inter Tight', body: 'Carlito' },
];

// A scheme's name in the chosen language (shared/i18n/ui/<code>/templates.js); the key where no table is loaded.
const say = (k) => { const I = globalThis.TlbxI18n; return I && I.t ? I.t(k) : k; };

/** Colour schemes (name: read in the chosen language). head: headings; accent: rules and fills; onAccent: text on accent; tint: pale fill; text and muted: body. */
export const SCHEMES = [
  { id: 'lime', get name() { return say('ui.tpl.scheme.lime'); }, head: '#0a0a0a', accent: '#ffeae8', onAccent: '#0a0a0a', tint: '#fff8f7', text: '#111111', muted: '#4a566e', rule: '#0a0a0a' },
  { id: 'navy', get name() { return say('ui.tpl.scheme.navy'); }, head: '#000080', accent: '#000080', onAccent: '#ffffff', tint: '#e4e7ed', text: '#12161c', muted: '#4b5770', rule: '#000080' },
  { id: 'cobalt', get name() { return say('ui.tpl.scheme.cobalt'); }, head: '#1d3fbf', accent: '#2f5bff', onAccent: '#ffffff', tint: '#e8eeff', text: '#12161c', muted: '#50596e', rule: '#2f5bff' },
  { id: 'olive', get name() { return say('ui.tpl.scheme.olive'); }, head: '#a50b00', accent: '#ff3b2d', onAccent: '#ffffff', tint: '#fbf1f0', text: '#1a1d12', muted: '#5a6148', rule: '#e60f00' },
  { id: 'pink', get name() { return say('ui.tpl.scheme.pink'); }, head: '#9c1f58', accent: '#ff5fa2', onAccent: '#0a0a0a', tint: '#ffe9f3', text: '#1a1216', muted: '#6a5860', rule: '#ff5fa2' },
  { id: 'graphite', get name() { return say('ui.tpl.scheme.graphite'); }, head: '#13171d', accent: '#13171d', onAccent: '#ffffff', tint: '#eaecf1', text: '#181c25', muted: '#52607b', rule: '#13171d' },
  { id: 'slate', get name() { return say('ui.tpl.scheme.slate'); }, head: '#171a22', accent: '#5c6370', onAccent: '#ffffff', tint: '#eef0f3', text: '#171a22', muted: '#5c6370', rule: '#5c6370' },
  { id: 'sand', get name() { return say('ui.tpl.scheme.sand'); }, head: '#2e3545', accent: '#b2bacc', onAccent: '#0a0a0a', tint: '#f6f1e4', text: '#191e26', muted: '#556380', rule: '#7f8da9' },
];

/** Body size and line spacing for each scale. */
export const SCALE = {
  compact: { body: 10, line: 1.1 },
  standard: { body: 10.5, line: 1.15 },
  large: { body: 11.5, line: 1.25 },
};

/** Margins in points (top, left, right and bottom) and the header and footer distance. */
export const MARGINS = {
  narrow: { m: 54, h: 30 },
  standard: { m: 72, h: 36 },
  wide: { m: 90, h: 40 },
};

export const CHOICES = {
  kind: ['letter', 'proposal', 'report', 'memo', 'invoice', 'brief'],
  layout: ['single', 'twoColHeader', 'letterhead', 'sideRail'],
  heading: ['plain', 'ruled', 'caps', 'numbered', 'bar'],
  table: ['grid', 'plain', 'banded', 'strong'],
  margins: Object.keys(MARGINS),
  scale: Object.keys(SCALE),
  paper: ['Letter', 'A4'],
  header: ['company', 'company-title', 'title'],
  footer: ['page-of', 'page', 'company-page'],
  scheme: SCHEMES.map((s) => s.id),
};

/** Words for the placeholder content. Every name is invented; none is a real company or person. */
export const WORDS = {
  first: ['Amara', 'Jonas', 'Priya', 'Tomas', 'Ines', 'Noor', 'Felix', 'Hana', 'Marta', 'Owen'],
  last: ['Okafor', 'Lind', 'Marsh', 'Ruiz', 'Kowalski', 'Tan', 'Brennan', 'Osei', 'Vance', 'Hale'],
  co1: ['Harbour', 'Pine', 'Northfield', 'Larch', 'Quay', 'Kestrel', 'Mill', 'Alder', 'Brightwater', 'Foundry', 'Ember', 'Linden'],
  co2: ['& Co', 'Studio', 'Partners', 'Works', 'Labs', 'Group', 'Trading', 'Advisory'],
  street: ['Quay Street', 'Mill Lane', 'Canal Walk', 'Kiln Road', 'Orchard Close'],
  city: ['Bristol', 'Leeds', 'Glasgow', 'Cardiff', 'Norwich', 'York'],
  role: ['Operations lead', 'Account director', 'Head of finance', 'Project manager'],
  subject: ['Q3 rollout', 'Supplier contract', 'Pilot results', 'Office lease', 'Annual audit'],
  subj: ['The team', 'We', 'Our group', 'The project lead'],
  verb: ['will deliver', 'has agreed to review', 'will confirm', 'can provide', 'will prepare', 'is ready to start'],
  obj: ['the revised scope', 'a costed plan', 'the first draft', 'the supporting figures', 'a summary for the board', 'the final schedule'],
  when: ['by the end of the month', 'within ten working days', 'before the next review', 'in the third quarter', 'once approval is in place'],
  phase: ['Discovery', 'Design', 'Build', 'Pilot', 'Handover'],
  output: ['Agreed requirements', 'Draft design', 'Working prototype', 'Tested release', 'Trained staff'],
  item: ['Discovery workshop', 'Design hours', 'Build sprint', 'Pilot support'],
  metric: ['Units sold', 'Active accounts', 'Average order', 'Returns'],
  action: ['Confirm the budget', 'Sign the revised scope', 'Book the pilot site', 'Share the findings'],
  objective: ['Explain the change', 'Secure sign-off', 'Compare two options', 'Agree the next step'],
  message: ['The pilot is on track', 'Costs are within budget', 'The supplier has confirmed', 'The launch date is fixed'],
  month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** The template title per kind (also the document title in the header). */
export const KIND_TITLE = { letter: 'Letter', proposal: 'Proposal', report: 'Quarterly report', memo: 'Memo', invoice: 'Invoice', brief: 'Project brief' };
