/* window.TlbxAI: a tiny API any ITpris Verktyg page can use to talk to the local model (the Helper buddy uses it).
 * Include with ONE tag: <script src="(../)shared/ai/tlbxai.js"></script>. It loads engines/tools/bridge/powerup next to it.
 *   TlbxAI.ready            true when a model is loaded in this page or in another open tab (Assistant)
 *   TlbxAI.model            { id, name, kind } or null
 *   TlbxAI.ask(prompt, { persona: 'helpbot' | 'plain', system, history, temperature, max_tokens, signal })
 *       → stream: for await (const piece of stream) …;  await stream.text;  stream.abort();  stream.offline
 *   TlbxAI.comment(whatHappened) → stream (Helper reacts in one short line)
 *   TlbxAI.on('change' | 'ready' | 'unready', fn) → off()
 *   TlbxAI.look             { hat: 'brain', aura: 'ai', sparkle: true } while ready, else null
 *   TlbxAI.powerUp          drawing helpers (TlbxAIKit.powerUp) once loaded
 *   TlbxAI.use(engine)      for pages that load a model themselves (Assistant, the panel): makes it local and shares it
 * Full contract: shared/ai/HANDOFF.md. */
(function () {
  'use strict';
  if (window.TlbxAI) return;
  const K = (window.TlbxAIKit = window.TlbxAIKit || {});
  const me = document.currentScript && document.currentScript.src;
  K.base = K.base || (me ? new URL('./', me).href : new URL('../shared/ai/', location.href).href);
  const pending = {};
  const FLAG = { engines: 'Engine', powerup: 'powerUp', apptools: 'appTools', webllm: 'WebLLMEngine' }; // what each file defines on TlbxAIKit
  /** Loads kit files (names relative to shared/ai/, no .js), each once. All are requested at once and run in the order
   *  given (async = false keeps the order of inserted scripts), so a phone waits one round trip, not one per file.
   *  Rejects with the name of a file that failed. A file another loader inserted is waited for (data-loaded once in). */
  K.load = function (names) {
    return Promise.all(names.map((n) => (pending[n] = pending[n] || new Promise((res, rej) => {
      const fail = () => { delete pending[n]; rej(new Error('Could not load shared/ai/' + n + '.js')); };
      if (K[FLAG[n] || n]) return res();
      const old = document.querySelector(`script[data-tlbxai="${n}"]`);
      if (old) { if (old.dataset.loaded) return res(); old.addEventListener('load', () => res()); old.addEventListener('error', fail); return; }
      const s = document.createElement('script'); s.src = K.base + n + '.js'; s.dataset.tlbxai = n; s.async = false;
      s.onload = () => { s.dataset.loaded = '1'; res(); }; s.onerror = () => { s.remove(); fail(); };
      document.head.append(s);
    })))).then(() => undefined);
  };

  const HELPBOT = [
    'You are the assistant of verktyg.itpris.se, a friendly assistant.',
    'Greet people with: "Hello. Ask me anything."',
    'Answer in one or two short, clear sentences.',
    'You are polite and practical. You are proud you run on their own GPU and never send their chats anywhere.',
    'Be helpful and keep answers short and polite.'].join('\n');
  const OFFLINE = ['No model is loaded yet. Load a model in Assistant first.', 'No model is loaded. Open Assistant, pick a model, then ask again.'];
  const listeners = { change: new Set(), ready: new Set(), unready: new Set() };
  let local = null, wasReady = false;

  const hosts = () => (K.bridge ? K.bridge.hosts() : []);
  const isReady = () => !!(local && local.loaded) || hosts().length > 0;
  function fire() {
    const r = isReady();
    listeners.change.forEach((f) => f(api));
    if (r !== wasReady) { wasReady = r; (r ? listeners.ready : listeners.unready).forEach((f) => f(api)); }
  }
  function engine() {
    if (local && local.loaded) return local;
    const h = hosts()[0];
    return h && K.RemoteEngine ? new K.RemoteEngine(h.id) : null;
  }

  /** A pull stream over an async producer: for-await gives the text pieces, .text the whole reply. */
  function makeStream(producer) {
    const q = []; let done = false, wake = null, err = null;
    const ctl = new AbortController();
    const push = (t) => { q.push(t); if (wake) { wake(); wake = null; } };
    const text = (async () => {
      let all = '';
      try { await producer((t) => { all += t; push(t); }, ctl.signal); } catch (e) { err = e; }
      done = true; if (wake) { wake(); wake = null; }
      if (err) throw err;
      return all;
    })();
    text.catch(() => {});
    return {
      text, abort: () => ctl.abort(), offline: false,
      async *[Symbol.asyncIterator]() {
        while (true) {
          if (q.length) { yield q.shift(); continue; }
          if (done) { if (err) throw err; return; }
          await new Promise((r) => { wake = r; });
        }
      },
    };
  }

  function ask(prompt, opts = {}) {
    const persona = opts.persona || 'helpbot';
    const sys = opts.system || (persona === 'helpbot' ? HELPBOT : 'You are a helpful assistant inside verktyg.itpris.se, a studio of creative apps that run in the browser. Be concise.');
    const messages = [{ role: 'system', content: sys }, ...(opts.history || []), { role: 'user', content: String(prompt) }];
    let offline = false;
    const s = makeStream(async (push, signal) => {
      await ready;
      const e = engine();
      if (!e) { offline = true; push(OFFLINE[Math.floor(Math.random() * OFFLINE.length)]); return; }
      if (opts.signal) opts.signal.addEventListener('abort', () => s.abort(), { once: true });
      const it = e.chat(messages, { stream: true, temperature: opts.temperature != null ? opts.temperature : persona === 'helpbot' ? 0.9 : 0.6, max_tokens: opts.max_tokens || (persona === 'helpbot' ? 120 : 1024), signal });
      for await (const c of it) if (c.type === 'delta') push(c.text);
    });
    Object.defineProperty(s, 'offline', { get: () => offline });
    return s;
  }
  const comment = (what, opts = {}) => ask(`React to this in one short funny line, as Helper: ${what}`, Object.assign({ max_tokens: 60 }, opts));

  const ready = K.load(['engines', 'tools', 'bridge', 'powerup']).then(() => {
    K.bridge.onHosts(fire);
    return K.bridge.discover(300).then(fire);
  }).catch((e) => console.warn('TlbxAI:', e.message));

  const api = {
    get ready() { return isReady(); },
    get model() { const e = local && local.loaded ? local : null; if (e) return e.info(); const h = hosts()[0]; return h ? Object.assign({}, h.model, { kind: 'remote' }) : null; },
    get look() { return isReady() ? { hat: 'brain', aura: 'ai', sparkle: true } : null; },
    get powerUp() { return K.powerUp || null; },
    loaded: ready,
    ask, comment, engine,
    on(evt, fn) { (listeners[evt] || listeners.change).add(fn); return () => (listeners[evt] || listeners.change).delete(fn); },
    use(e) { local = e; ready.then(() => { if (K.bridge) K.bridge.host(e && e.loaded ? e : null); fire(); }); },
    HELPBOT, GREETING: 'Hello. Ask me anything.',
  };
  window.TlbxAI = api;
})();
