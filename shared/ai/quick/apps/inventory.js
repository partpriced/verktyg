/* Assistant quick prompts for Inventory (the format: shared/ai/quick/engine.js). Words: prompts.inventory.* in shared/ai/i18n/<code>/biz*.js. */
(function () {
  'use strict';
  const K = (window.TlbxAIKit = window.TlbxAIKit || {}), L = (K.quickLists = K.quickLists || {});
  L['inventory'] = { skip: ['quiz', 'titles', 'expand'], prompts: [
    { id: 'low_stock', when: ['tools'] },
    { id: 'value', when: ['tools'] },
    { id: 'add_product', when: ['tools'], vars: [{ name: 'details', kind: 'text', hint: true }] },
    { id: 'slow', when: ['tools'] },
    { id: 'descriptions', when: ['tools'], vars: [{ name: 'tone', kind: 'choice', options: 'tone' }] },
    { id: 'count_list', when: ['tools'] },
    { id: 'check', when: ['tools'] },
  ] };
})();
