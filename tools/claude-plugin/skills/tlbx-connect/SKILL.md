---
name: tlbx-connect
description: Connect Claude Code to the ITpris Verktyg apps open in the browser (pairing code, browser tab). Use when the person wants to use ITpris Verktyg, Image Editor, PDF Editor, Video Editor, Workflows or File Converter from here.
argument-hint: "[app, e.g. imageeditor, workflows, pdf]"
allowed-tools: mcp__plugin_worksuite_app__connect mcp__plugin_worksuite_app__status
---

Connect to ITpris Verktyg in the browser.

1. Call the `connect` tool of the ITpris Verktyg MCP server (`mcp__plugin_worksuite_app__connect`), with `app` set to "$ARGUMENTS" when it names an app (for example `imageeditor`, `workflows`, `pdf`, `convert`, `videostudio`); leave `app` out otherwise.
2. Show the person the pairing code from the result on a line of its own, in bold, exactly as given, and tell them in plain words:
   - type it in the ITpris Verktyg tab where it asks for the code (or Ctrl+K / ⌘K, "Connect an AI app…");
   - Chrome may ask to let the site use apps and services on this device: choose Allow (it lets the page reach this computer only);
   - the code works once, for 10 minutes.
3. Call `status` with `wait_seconds: 120`. When it says connected, name the app and say what you can now do there (the `tlbx_` tools). If it is still not connected, say so and offer to try again; never guess a code.
