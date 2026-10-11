// Copyright (c) 2026 PartPriced. All rights reserved. Not covered by the MIT License.
// Flat Chippy (the "Sheet" look): the favicon, the header mark, the app icons and the toggle button. small: the 16 and
// 24 px drawing (no contacts, bigger eyes); 32 px and up: the full one with the six gold contacts a side and the corner
// triangle. No DOM: the white-label build also runs it in Node to draw the icon files.
export const name = 'Chippy';

const V = { pcb: '#2e6b45', silver: '#b8c0ca', face: '#131820', gold: '#e8a33d', etch: '#9199a4' };

export function svg(size, small) {
  const v = V, open = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"`;
  if (small) {
    return `${open} viewBox="0 0 16 16" role="img" aria-label="${name}"><rect x=".5" y=".5" width="15" height="15" rx="3" fill="${v.pcb}"/>`
      + `<rect x="2.6" y="2.6" width="10.8" height="10.8" rx="2.2" fill="${v.silver}"/><circle cx="6.1" cy="7.1" r="1.35" fill="${v.face}"/>`
      + `<circle cx="9.9" cy="7.1" r="1.35" fill="${v.face}"/><path d="M6.1 9.7 q1.9 1.5 3.8 0" stroke="${v.face}" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>`;
  }
  const pads = [16, 22.5, 29, 35.5, 42, 48.5].map((k) => `<rect x="${k - 1.2}" y="6" width="2.4" height="4" rx=".6"/><rect x="${k - 1.2}" y="54" width="2.4" height="4" rx=".6"/>`
    + `<rect y="${k - 1.2}" x="6" height="2.4" width="4" rx=".6"/><rect y="${k - 1.2}" x="54" height="2.4" width="4" rx=".6"/>`).join('');
  const eye = (x) => `<circle cx="${x}" cy="29" r="4.2" fill="${v.face}"/><circle cx="${x + 1.5}" cy="27.3" r="1.3" fill="#fff"/>`;
  return `${open} viewBox="0 0 64 64" role="img" aria-label="${name}"><rect x="2" y="2" width="60" height="60" rx="9" fill="${v.pcb}"/>`
    + `<g fill="${v.gold}">${pads}<path d="M5 5 h5 l-5 5 Z"/></g><rect x="11.5" y="11.5" width="41" height="41" rx="6.5" fill="${v.silver}"/>`
    + `<rect x="14.5" y="14.5" width="35" height="35" rx="5.5" fill="${v.silver}" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`
    + `<circle cx="19.5" cy="19.5" r="1.8" fill="none" stroke="${v.etch}" stroke-width=".9"/>${eye(25)}${eye(39)}`
    + `<path d="M26.5 37 q5.5 4.6 11 0" stroke="${v.face}" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`;
}
