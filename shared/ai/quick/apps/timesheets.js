/* Assistant quick prompts for Timesheets (the format: shared/ai/quick/engine.js). Words: prompts.timesheets.* in shared/ai/i18n/<code>/biz*.js. */
(function () {
  'use strict';
  const K = (window.TlbxAIKit = window.TlbxAIKit || {}), L = (K.quickLists = K.quickLists || {});
  L['timesheets'] = { skip: ['quiz', 'titles', 'expand'], prompts: [
    { id: 'summary', when: ['tools'], vars: [{ name: 'period', kind: 'choice', options: 'period' }] },
    { id: 'log', when: ['tools'], vars: [{ name: 'details', kind: 'text', hint: true }] },
    { id: 'unbilled', when: ['tools'] },
    { id: 'invoice', when: ['tools'], vars: [{ name: 'name', kind: 'text', hint: true }] },
    { id: 'report', when: ['tools'] },
    { id: 'check', when: ['tools'] },
  ] };
})();
