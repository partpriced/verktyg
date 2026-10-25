# ITpris Verktyg for Claude Code (ITpris Verktyg MCP)

[ITpris Verktyg](https://verktyg.itpris.se) is a set of free apps that run in your browser: Image Editor (photo editing),
PDF Editor, Video Editor (video), File Converter, Workflows and more. This plugin lets Claude Code use the app you have
open in your browser, with the app's own commands, and bring your files in and the results back out as files on your
computer.

## Install (once)

In Claude Code:

```
/plugin marketplace add partpriced/claude-plugin
/plugin install worksuite@worksuite
```

You need Node.js 20 or newer (Claude Code already has it) and Chrome, Edge or another Chromium browser.

## Use it

```
/worksuite:tlbx-connect imageeditor
```

1. Claude Code opens ITpris Verktyg in your browser and shows a short code, like `K7Q-4MZ`.
2. Chrome asks once whether the site may use apps and services on this device. Choose **Allow**. That is how the
   page reaches Claude Code on your computer. It talks to your own computer only (127.0.0.1), not to your network.
3. Type the code in the page. The page shows **Claude Code is connected · Disconnect** in the corner.

Then just ask, for example:

```
/worksuite:tlbx-edit "remove the background of ./photos/cat.jpg and save it as ./cat-cutout.png"
```

or in your own words: "resize every picture in ./shots to 1200 px wide with ITpris Verktyg", "turn report.docx into a PDF".

Any ITpris Verktyg page can connect too: press Ctrl+K (⌘K on a Mac) and choose **Connect an AI app…**.

## Disconnect

Press **Disconnect** in the page, close the tab, or ask Claude Code to disconnect. Ending the Claude Code session ends
it as well. The next time, you pair again with a new code.

## What it can do

- `connect`, `status`, `use_tab`, `disconnect`: pairing, and choosing a tab when several are connected.
- `tlbx_…`: the tools of the app in the active tab, generated from the app's own commands (the same ones as the
  ITpris Verktyg AI panel): for example `tlbx_app_state`, `tlbx_list_commands`, `tlbx_run_command`, `tlbx_list_files`,
  `tlbx_run_operation`, `tlbx_run_workflow`, `tlbx_open_file`, and one tool per app command (Image Editor has more than 30).
  They change when you switch apps.
- `send_file_to_app`: a file on your computer into the app (or into Files, the site's storage in your browser).
- `save_result`: a file from the app or Files to your computer. It never replaces a file unless you ask.

Paths are relative to the folder Claude Code runs in. A path outside it is used only when you name it.

## Privacy and safety

- Everything stays on your computer. The server listens on 127.0.0.1 only and accepts only the ITpris Verktyg pages
  (verktyg.itpris.se and verktyg.itpris.se). A page can use it only after you type the one-time code; each tab is
  paired on its own, and the code expires after 10 minutes or 5 wrong tries.
- Your files stay on your computer and in your browser. What Claude Code sends to Anthropic is what it always sends:
  your conversation, including the tool calls and their results.
- Actions that delete, clear or replace your work ask you in the page first, following your AI permission settings.
- Claude Code asks you before each tool it has not been allowed to use.

## Without the plugin

The same server runs in other AI apps (below) or by hand: `npx -y github:partpriced/claude-plugin`.
Settings (environment variables): `WORKSUITE_PORT` (first port; default 47821, then the next 9),
`WORKSUITE_SITE`, `WORKSUITE_ROOT` (the folder for relative paths), `WORKSUITE_NO_OPEN=1` (never open a browser).

Source: [partpriced/verktyg](https://github.com/partpriced/verktyg) (`tools/claude-plugin/`, `shared/agent/`). MIT licence.
