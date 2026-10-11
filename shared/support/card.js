/* The support card's contents: Helper, the ask, Donate, the ads slider (or the ad slot with "Turn off"), "No thanks" and ×.
 * Classic script, exposes window.TlbxSupportCard.build({ onClose, onNoThanks }), .setBrand(json), .config().
 * Writes no storage itself. Ads go through TlbxConsent.setChoices only (the one place ads load). Needs
 * shared/consent (config, state, consent-mode) on the page for the ads row; without it the row is hidden.
 * The ads slider starts at Off. Nothing about the card goes into an exported file. */
(function () {
  'use strict';
  // The brand data, set by support.js from brand/brand.json (raw or normalized). Missing: defaults, no donate link.
  var brand = null;
  var PATREON = /^https:\/\/[^\s"'<>]+$/;
  function setBrand(json) {
    var s = (json && json.support) || {};
    var l = (json && json.links) || {};
    brand = {
      support: { exportCard: s.exportCard !== false, donate: s.donate !== false, ads: s.ads !== false },
      patreon: typeof l.patreon === 'string' && PATREON.test(l.patreon.trim()) ? l.patreon.trim() : ''
    };
    return brand;
  }
  function support() { return brand ? brand.support : { exportCard: true, donate: true, ads: true }; }
  function patreonUrl() { return brand ? brand.patreon : ''; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  /** Helper, small and happy: the shared painter, a soft smile, no glow. Falls back to nothing if the module fails. */
  function helpbot() {
    var wrap = el('div', 'tlbxsup-helpbot');
    wrap.setAttribute('aria-hidden', 'true');
    var cv = el('canvas', null);
    cv.width = 128; cv.height = 128; cv.style.width = '64px'; cv.style.height = '64px';
    wrap.append(cv);
    try {
      var base = window.TlbxSupportState.base;
      import(base + 'shared/helpbot/index.js').then(function (m) {
        var g = cv.getContext('2d');
        g.clearRect(0, 0, 128, 128);
        m.drawHelpbot(g, 128, 128, { body: 'pink', eyes: 'normal', mouth: 'cat', scale: 1.1, baseY: 0.62, noGlow: true }, 0);
      }).catch(function () { wrap.hidden = true; });
    } catch (e) { wrap.hidden = true; }
    return wrap;
  }
  function adSlot() {
    var s = el('section', 'tlbxsup-ad');
    s.setAttribute('aria-label', 'Advertisement');
    s.append(el('p', 'tlbxsup-ad-label', 'Ad'));
    var id = window.TLBX_CONSENT_CONFIG && window.TLBX_CONSENT_CONFIG.adsensePublisherId;
    if (id) {
      var ins = el('ins', 'adsbygoogle');
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', id);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      s.append(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* script not ready: the unit stays empty */ }
    } else {
      s.append(el('p', 'tlbxsup-ad-empty', 'Ad space (no ad unit configured)'));
    }
    return s;
  }
  /** The ads row: the slider (Off by default) or, once ads are accepted, the ad slot plus "Turn off". */
  function adsRow(rerender) {
    var box = el('div', 'tlbxsup-adsrow');
    var C = window.TlbxConsent, S = window.TlbxConsentState;
    if (!C || !S) return box; // no consent scripts on this page: no ads control at all
    if (S.current().ads) {
      box.append(adSlot());
      var off = el('button', 'tlbxsup-link', 'Turn off ads');
      off.type = 'button';
      off.addEventListener('click', function () { C.setChoices({ ads: false }); rerender(); });
      box.append(off);
      return box;
    }
    var label = el('label', 'tlbxsup-slider');
    var name = el('span', 'tlbxsup-slider-name', 'Ads');
    var range = el('input', null);
    range.type = 'range'; range.min = '0'; range.max = '1'; range.step = '1'; range.value = '0';
    range.setAttribute('aria-label', 'Ads: Off or On');
    var ends = el('span', 'tlbxsup-slider-ends');
    ends.append(el('span', null, 'Off'), el('span', null, 'On'));
    range.addEventListener('input', function () {
      if (range.value === '1') { C.setChoices({ ads: true }); rerender(); }
    });
    label.append(name, range, ends);
    box.append(label);
    return box;
  }
  /** The whole card. onClose: the × (closes for now). onNoThanks: the stored, permanent "No thanks". */
  function build(opts) {
    opts = opts || {};
    var flags = support();
    var root = el('section', 'tlbxsup-card');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Support ITpris Verktyg');
    var close = el('button', 'tlbxsup-x', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close for now');
    close.addEventListener('click', function () { if (opts.onClose) opts.onClose(); root.remove(); });
    var head = el('div', 'tlbxsup-head');
    head.append(helpbot(), el('h2', 'tlbxsup-title', 'Support ITpris Verktyg'), close);
    var body = el('div', 'tlbxsup-body');
    body.append(el('p', 'tlbxsup-text', 'Helper made this free. If it helped, a donation keeps it going.'),
      el('p', 'tlbxsup-fine', 'Analytics and ads are off by default.'));
    var actions = el('div', 'tlbxsup-actions');
    var url = patreonUrl();
    if (flags.donate && url) {
      var a = el('a', 'tlbxsup-btn', 'Donate');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      actions.append(a);
    }
    var no = el('button', 'tlbxsup-btn', 'No thanks');
    no.type = 'button';
    no.addEventListener('click', function () { if (opts.onNoThanks) opts.onNoThanks(); root.remove(); });
    actions.append(no);
    body.append(actions);
    if (flags.ads) {
      var rerender = function () { var fresh = adsRow(rerender); box.replaceWith(fresh); box = fresh; };
      var box = adsRow(rerender);
      body.append(box);
    }
    root.append(head, body);
    return root;
  }
  window.TlbxSupportCard = Object.freeze({ build: build, setBrand: setBrand, config: support, patreonUrl: patreonUrl });
})();
