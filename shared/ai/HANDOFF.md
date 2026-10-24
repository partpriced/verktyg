# shared/ai: the local-AI kit (and the API for the Helper buddy)

Everything here is a classic script that adds to `window.TlbxAIKit` (`K`), except `tlbxai.js` (`window.TlbxAI`) and
`panel.js` (`window.TlbxAIPanel`). No build step; WebLLM is vendored in `vendor/web-llm/` and imported only when a
real model loads. The app that uses all of it is `ai/` (Assistant, see `ai/HANDOFF.md`).

## For the Helper buddy (shared/buddy/): `window.TlbxAI`

Include one tag. It loads `engines.js`, `tools.js`, `bridge.js` and `powerup.js` from its own folder:

```html
<script src="../shared/ai/tlbxai.js"></script>   <!-- path relative to the page -->
```

| Member | What |
|---|---|
| `TlbxAI.ready` | `true` when a model is loaded in this page **or in any other open tab of the site** (normally the Assistant tab). |
| `TlbxAI.model` | `{ id, name, kind }` (`kind: 'remote'` when borrowed from another tab), or `null`. |
| `TlbxAI.loaded` | Promise: resolves once the kit is loaded and other tabs have been asked (≈300 ms). Read `ready` after it. |
| `TlbxAI.ask(prompt, opts)` | Returns a **stream**. `opts`: `persona: 'helpbot'` (default) or `'plain'`, `system` (overrides the persona), `history` (`[{role, content}]`), `temperature` (Helper 0.9), `max_tokens` (Helper 120), `signal`. |
| stream | `for await (const piece of stream) bubble.textContent += piece;` · `await stream.text` (the whole reply) · `stream.abort()` · `stream.offline` (true when no model: it then yields one canned "Hello… load a model in Assistant" line instead of failing). |
| `TlbxAI.comment(what, opts)` | Helper reacts to something in one short line: `TlbxAI.comment('the user just exported a PDF')`. Same stream; `max_tokens` 60. |
| `TlbxAI.on(evt, fn)` | `'ready'` (became ready), `'unready'`, `'change'` (any change, incl. another model). Returns `off()`. |
| `TlbxAI.look` | `{ hat: 'brain', aura: 'ai', sparkle: true }` while ready, else `null`. Merge it into his look. |
| `TlbxAI.powerUp` | The drawing helpers below (`TlbxAIKit.powerUp`), once loaded. |
| `TlbxAI.HELPBOT`, `TlbxAI.GREETING` | The persona text and his catchphrase "Hello. Ask me anything." |

### The "AI powered" look
`TlbxAIKit.powerUp` (`powerup.js`) draws on a 2D canvas and matches the shared painter (`shared/helpbot/`):

```js
import { drawHelpbot, HATS } from '../shared/helpbot/index.js';
await TlbxAI.loaded;
TlbxAI.powerUp.install(HATS);          // adds HATS.brain, so look.hat = 'brain' works in drawHelpbot
function frame(g, W, H, look, t) {
  if (TlbxAI.ready) TlbxAI.powerUp.draw(g, W, H, look, t, drawHelpbot);   // aura + Helper + brain hat + sparkles
  else drawHelpbot(g, W, H, look, t);
}
// or piece by piece: powerUp.aura(g, cx, cy, r, t) before him, powerUp.sparkles(g, cx, cy, r, t) after,
// powerUp.brain(g, H, t) with the painter's head box H = { x, top, w, h, s, eyeY, base }.
```
A CSS glow also works for a DOM-positioned buddy: `filter: drop-shadow(0 0 8px rgba(212,255,58,.6))`.

### Suggested buddy behaviour
- Speech bubble: stream `TlbxAI.ask(question)` into it; show `stream.offline` lines as-is (they are in character).
- "Ask Helper": an input in the bubble → `TlbxAI.ask(text)`.
- Commenting: call `TlbxAI.comment(...)` rarely (e.g. at most once a minute, on real events), and never while the
  person is typing; small models are slow on weak GPUs. Abort the previous stream before starting a new one.
- Listen to `TlbxAI.on('ready'|'unready', …)` to switch the power-up look on and off.

## Files

| File | Adds | What |
|---|---|---|
| `catalog.js` | `K.catalog` | The models: WebLLM ids (checked against the vendored `prebuiltAppConfig` by a test), download size, `vramMB`/`vram32`, `lowResource`, licence (name, URL, commercial use), strengths, blurb, `f32Id` for GPUs without shader-f16. `byId`, `idFor(m, sys)`, `custom(id)`. |
| `sysinfo.js` | `K.sysinfo` | `collect({ bench })` snapshot (adapter info, limits, f16, deviceMemory, cores, UA-CH browser/OS, storage estimate/persisted); pure `verdict(sys, model)` → `{ level: good/slow/no, tps, id, vram, reason }`, `recommend(sys, list, 'chat'/'code')`, `help(sys)` (WebGPU how-to per browser), `budgetMB`, `bandwidth`. |
| `bench.js` | `K.bench` | WebGPU micro-benchmark: tiled f32 matmul (GFLOPS) and a storage-buffer copy (GB/s). Starts at 128² / 8 MB and scales up only on fast GPUs (~1 s; ~3 s on SwiftShader). |
| `engines.js` | `K.Engine`, `K.FakeEngine` | The engine interface `{ load(model, onProgress, {signal}), chat(messages, {tools, stream, temperature, max_tokens, signal}), unload(), info() }`. `chat` streams `{type:'delta', text}` then `{type:'done', text, raw, toolCalls, usage:{tokens, tps, ttft, ms}}`. The fake engine streams canned replies, emits tool calls for "open <app>", "run <cmd.id>", "save", writes an HTML app for "build/make … app", and takes scripted `replies`. |
| `tools.js` | `K.tools` | Prompt-based tool calling for any model: `<tool_call>{"name":…,"arguments":…}</tool_call>` (also fenced or bare JSON, lenient quotes); `prepare` (one system message, merged roles, tool results as `TOOL RESULT (name): …`), `parse`, `dispatch` (asks before destructive tools), `run` (the agent loop, max 4 steps). |
| `apptools.js` | `K.appTools` | "Control apps": `list_apps`, `open_app`, `save_to_drive`, `list_files`, plus `list_commands`/`run_command` when the page has `window.TlbxCmd`. Commands whose id/title says delete/clear/close/reset/new/… are destructive and confirmed. |
| `webllm.js` | `K.WebLLMEngine`, `K.models` | The real engine (MLCEngine; Pause/Cancel abort `reload`, finished shards stay cached). Cache helpers that never load the library: `status(id)` → none/partial/ready + bytes, `remove(id)`, `importFolder(files)` for "Load from disk" (an MLC folder goes into the same caches under a private URL; needs the `.wasm` in the folder unless the folder name is a known prebuilt id). |
| `bridge.js` | `K.bridge`, `K.RemoteEngine` | BroadcastChannel `tlbx-ai-bridge`: a page with a loaded model hosts it; other tabs stream through it. Tools run in the asking page. |
| `tlbxai.js` | `window.TlbxAI`, `K.load` | The API above; `TlbxAI.use(engine)` is how a page that loaded a model shares it. |
| `powerup.js` | `K.powerUp` | Brain hat, aura, sparkles. |
| `md.js` | `K.md` | Safe Markdown for chat (escape first; http(s) links only; code blocks with Copy/Preview buttons; works on half-streamed text). |
| `panel.js` + `panel.css` | `window.TlbxAIPanel` | The embeddable side panel (below). |
| `panel-run.js` | `K.panel.send` … | The panel's run: tool loop, steps, Stop, "Undo all AI changes". |
| `picker.js` | `K.picker` | The model choice (WebGPU check with a plain fallback message, models good at app control first, download/use with progress and Cancel) and the download notice (`consent`, the shared first-use notice `shared/firstrun/notice.js` with the real size and licence). Assistant's own downloads use the same notice. |
| `cmdtools.js` | `K.cmdTools` | An app's TlbxCmd commands as tools: one tool per command with an `args` schema (JSON schema in `definitions(cmd)`), `app_state`, `list_commands`, `run_command`; arguments are checked and clamped (TlbxCmd.exec) before a command runs. |

## The AI button and app control (2026-10)
- Every app page with the shell header has an **AI** button (`shell/header.js`, `.sh-ai`, same look as Convert…). Nothing
  of the AI loads before the first click; then it injects `shared/ai/panel.js` (`data-button="false"`) and opens the
  panel. On Assistant itself there is no button. When the header is full the button becomes an icon, then moves into the
  Theme menu ("Ask Assistant…"); it is also "Ask Assistant…" in the command palette (`shell.ai`).
- Layout: above 900 px the page narrows by the panel's width (`html.sap-beside body { margin-inline-end }`, plus a
  resize event so canvases refit); 641–900 px it overlays on the right; ≤640 px it is a bottom sheet (`TlbxSheet`,
  `shared/ui/sheet.js`, unchanged: swipe down, ×, Escape, tap outside).
- No model: the panel shows `picker.js`. Without WebGPU it says so plainly and what still works. A model loaded in
  another tab (Assistant) is used through the bridge.
- "Control <app>" on: before each request the panel calls `TlbxCmd.prepare()` (the app's AI commands load), builds the
  tools from the commands (`cmdtools.js`) and takes `TlbxCmd.checkpoint()`. Each tool call is a step
  ("Gaussian blur, radius 8 ✓", ✗ with the error). Stop (the send button while running) ends the run between actions.
  Limits: 6 model turns and 12 actions per request (`MAX_STEPS`, `MAX_CALLS` in `panel-run.js`). Destructive commands
  ask (`destructive: true`, or the word rule). After a request that changed something, **Undo all AI changes (n)** calls
  the checkpoint's rollback.
- How an app joins: `shared/commands/HANDOFF.md` ▸ "Arguments and app state". Wired: Image Editor
  (`imageeditor/js/app/ai-*.js`, 33 commands), plus Spreadsheets, Documents and Resizer (see their HANDOFFs).
- Assistant's workspace (`ai/js/ui/workspace.js`) uses the same pieces for framed apps: `prepare()` before listing,
  `exec` for `app_command` (arguments checked), `TlbxCmd.state()` for `app_state` (falls back to `window.TlbxAppState`).
- Which models drive apps well enough: tool calling is prompt-based (`tools.js`), so any model can try. Qwen2.5 1.5B
  (the default) follows the tool format and picks the right single tool reliably, and usually manages 2–3 step plans
  such as "blur the background"; Llama 3.2 3B, Qwen2.5 3B and 7B plan longer chains better. Qwen2.5 0.5B and Llama 3.2
  1B often answer in prose instead of calling a tool or invent argument names, so the panel's picker lists only the four
  (`picker.FIT`); the others stay in Assistant's Models page. These are observations from the prompt design, not a benchmark: the browser tests use the
  scripted fake engine.

## The side panel (`panel.js`)
Any app can add it later with one tag: `<script src="../shared/ai/panel.js" defer></script>` (after `shared/apps.js`,
`tlbxui.js`, `hub.js` and, if it has one, `shared/commands/commands.js`). Attributes: `data-button="false"` hides the
floating button (call `TlbxAIPanel.open()` from a menu instead); `data-app="imageeditor"` names the app if
`TlbxHub.register` was not called. It themes itself with the page's `--sui-*` tokens.

**Model sharing, as built:** a BroadcastChannel bridge, not a SharedWorker. WebGPU memory belongs to one tab, and a
SharedWorker cannot be relied on to have WebGPU, so the model lives in the tab that loaded it (normally Assistant) and
other tabs stream through it. If that tab closes, clients see `ready = false`. "Load here" in the panel loads an
already-downloaded model into the current page instead (a second copy in GPU memory), and that page then hosts it for
others. Nothing is downloaded from the panel; downloads happen in Assistant, after consent.

## Tests
`node tests/run.mjs ai` covers all of this; see `ai/HANDOFF.md`.
