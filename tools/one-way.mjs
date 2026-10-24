// Rule 4, one way in and one way out: files get into an app only through the shared intake (shared/intake, TlbxIntake),
// and out only through the shared outbound builder (shared/intake/outtake.js, TlbxOuttake / TlbxHub.openIn). In the apps
// that have moved to it (STRICT below), app code may not add its own way:
//   in:  a 'drop' or 'paste' listener, TlbxUI.pickFiles, a file <input>, TlbxHub.consumeLaunch / ?drive= / launchQueue,
//        TlbxHub.pickFromDrive (use TlbxIntake.take, pick, fromDrive, launch, dropTarget, or TlbxDrop.attach)
//   out: a hand-made "Open in …" / "Send to …" list (appsAccepting(...).map, labels built from an app name)
//        (use TlbxOuttake.items / menu / button, TlbxHub.openIn or sendMenuItems)
// A line that has to stay (a drop that reorders tabs, the app's own clipboard) says why with an "intake-ok:" or
// "outtake-ok:" comment. Add an app's folder to STRICT once it is migrated (shared/intake/HANDOFF.md has the list).
export const STRICT = ['pdf/', 'imageeditor/js/', 'convert/', 'gallery/', 'resize/', 'bgremover/'];
const EXEMPT = /^(shared\/intake\/|shared\/drop\/|vendor\/|tests\/)|\.min\.js$/;
export const RULES = [
  { re: /addEventListener\(\s*['"](drop|paste)['"]/, why: "a '$1' listener of its own" },
  { re: /\bpickFiles\s*\(/, why: 'TlbxUI.pickFiles (use TlbxIntake.pick)' },
  { re: /type:\s*['"]file['"]|type="file"|\.type\s*=\s*['"]file['"]/, why: 'a file input of its own (use TlbxIntake.pick)' },
  { re: /\bconsumeLaunch\s*\(|searchParams\.get\(\s*['"]drive['"]\s*\)|\blaunchQueue\b/, why: 'its own ?drive= or launch reader (use TlbxIntake.launch)' },
  { re: /\bpickFromDrive\s*\(/, why: 'its own Files picker (use TlbxIntake.fromDrive)' },
  { re: /appsAccepting\([^)]*\)\s*\.map\(|label:\s*[`'"](?:Open in|Send to) (?:\$\{|['"]\s*\+)/, why: 'a hand-made "Open in" / "Send to" list (use TlbxOuttake.items)', out: true },
];
export const strict = (f) => STRICT.some((d) => f.startsWith(d)) && !EXEMPT.test(f) && /\.(m?js|html)$/.test(f);

/** The one-way problems in a file's text: [{ line, why }]. Comment lines and lines marked intake-ok / outtake-ok pass. */
export function oneWayProblems(text) {
  const out = [];
  String(text).split('\n').forEach((l, i) => {
    const t = l.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    for (const r of RULES) {
      const m = r.re.exec(l);
      if (!m) continue;
      if (/\b(intake|outtake)-ok:/.test(l)) continue;
      out.push({ line: i + 1, why: r.why.replace('$1', m[1] || '') });
    }
  });
  return out;
}
