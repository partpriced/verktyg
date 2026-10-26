/* Assistant — ui/helpbot: Helper in the top bar. With a model loaded he is "AI powered" (aura, sparkles, brain hat).
 * Click him to "Ask Helper": a speech bubble streamed through window.TlbxAI.ask (the same API the buddy uses). */
'use strict';
(function (AI) {
  const K = AI.K, el = AI.el;
  let draw = null, raf = 0, bubble = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint(canvas, t, big) {
    const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    g.clearRect(0, 0, W, H);
    if (!draw) return;
    const look = { body: 'lime', eyes: AI.E.ready() ? 'star' : 'normal', mouth: 'smile', noGlow: true, baseY: big ? 0.86 : 0.9, scale: big ? 2.1 : 2.3 };
    if (AI.E.ready()) K.powerUp.draw(g, W, H, look, t, draw);
    else draw(g, W, H, look, t);
  }
  function loop(now) {
    raf = 0;
    const t = now / 1000;
    paint(AI.$('helpbot').querySelector('canvas'), t, false);
    const hello = document.querySelector('.hello-helpbot'); if (hello) paint(hello, t, true);
    AI.$('helpbot').classList.toggle('powered', AI.E.ready());
    if (!reduce && !document.hidden) raf = requestAnimationFrame(loop);
  }
  AI.paintHelpbot = () => { if (!raf) raf = requestAnimationFrame(loop); };

  AI.askHelpbot = function (question) {
    if (bubble) { bubble.remove(); bubble = null; }
    const out = el('div', { class: 'say' }, AI.E.ready() ? '…' : '');
    const inp = el('input', { class: 'inp', placeholder: AI.t('ai.helpbot.placeholder'), 'aria-label': AI.t('ai.helpbot.ask') });
    const go = async (q) => {
      out.textContent = '';
      const s = window.TlbxAI.ask(q || 'Say hi to me in your style.', { persona: 'helpbot' });
      AI.lastHelpbot = s;
      try { for await (const piece of s) out.textContent += piece; } catch (e) { out.textContent = 'blorp. ' + e.message; }
    };
    bubble = el('div', { class: 'helpbot-bubble', role: 'dialog', 'aria-label': AI.t('ai.helpbot.ask') }, out,
      el('form', { onsubmit: (e) => { e.preventDefault(); const q = inp.value.trim(); if (q) { inp.value = ''; go(q); } } }, inp),
      el('button', { type: 'button', class: 'x', 'aria-label': AI.t('menu.close'), onclick: () => { bubble.remove(); bubble = null; } }, '×'));
    document.body.append(bubble);
    if (!AI.E.ready()) out.textContent = AI.t('ai.helpbot.no_model');
    else go(question);
    setTimeout(() => inp.focus(), 0);
    return bubble;
  };

  const MASCOT = /*profile:mascot*/false;   // the brand profile's mascot switch (set at build time)
  AI.initHelpbot = function () {
    if (!MASCOT) {
      AI.$('helpbot').hidden = true; AI.paintHelpbot = () => {};
      document.head.append(el('style', null, '.hello-helpbot{display:none}'));
      return;
    }
    AI.$('helpbot').onclick = () => AI.askHelpbot();
    const base = new URL('../shared/helpbot/index.js', document.baseURI).href;
    import(base).then((m) => { draw = m.drawHelpbot; K.powerUp.install(m.HATS); AI.paintHelpbot(); }).catch((e) => console.warn('Helper painter unavailable', e));
    AI.on('engine', AI.paintHelpbot);
    AI.on('tab', AI.paintHelpbot);
    document.addEventListener('visibilitychange', AI.paintHelpbot);
  };
})(window.AI);
