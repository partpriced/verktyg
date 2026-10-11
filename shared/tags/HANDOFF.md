# ITpris tags: handoff

`shared/tags/tags.js` holds the pure tag helpers (normalise, parse, add, remove, counts, filter) shared by
Files and Music Player. It exposes `window.TlbxTags`. It touches no storage: callers write `meta.tags`
on the Drive record themselves.

## Where it is used

- **Music Player** (`music/`) loads it and stores tags on each track's Drive record (`meta.tags`), so they
  travel with the file.
- **Files** (`drive/js/core/tags.js`) still has its own copy of the same functions. It is not switched yet.

## Follow-up for drive

Drive should switch to this file later: load `shared/tags/tags.js` and replace `DR.normTag`, `DR.tagsOf`,
`DR.tagCounts` and the add/remove logic with `TlbxTags` calls. Drive files are not edited by this change.
