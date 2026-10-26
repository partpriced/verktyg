/* Spreadsheets, Swedish: opening, importing and saving files, the drop strip and the Config kind.
 * Rules: shared/i18n/APPS-HOWTO.md; terms: shared/i18n/glossary-sv.md. */
window.TlbxI18n && window.TlbxI18n.add('sv', {
  'tables.file.open_failed': 'Det gick inte att öppna filen',
  'tables.file.save_failed': 'Det gick inte att spara',
  'tables.file.left_out': 'Öppnad, men några delar kom inte med',
  'tables.file.left_out_body': 'Spara behåller den som en Tables-fil i Filer; Arkiv ▸ Ladda ned ▸ XLSX skriver en ny Excel-fil.',
  'tables.file.opened': 'Öppnade {name}',
  'tables.file.opened_it': 'Öppnade filen',
  'tables.file.not_ours': 'Det här är inte en Tables-fil.',
  'tables.file.kinds': 'Spreadsheets öppnar .stab-, .xlsx-, .ods-, .csv- och .tsv-filer.',
  'tables.file.damaged': 'Den här Tables-filen är skadad ({what}).',
  'tables.file.newer': 'Den här Tables-filen kommer från en nyare version av Spreadsheets.',

  'tables.import.unknown_fn': '{n} formler använder en funktion som Spreadsheets inte har än, så de visar #NAME?.',
  'tables.import.unknown_fn#one': '{n} formel använder en funktion som Spreadsheets inte har än, så den visar #NAME?.',
  'tables.import.skipped': 'Importerades inte: {list}.',
  'tables.import.chart_kind': '{n} diagram av typen {kind} importerades inte: Spreadsheets ritar stapel-, liggande stapel-, linje- och cirkeldiagram.',
  'tables.import.chart_kind#one': '{n} diagram av typen {kind} importerades inte: Spreadsheets ritar stapel-, liggande stapel-, linje- och cirkeldiagram.',
  'tables.import.chart_shape': '{n} diagram importerades inte: deras serier är inte ett sammanhängande cellblock.',
  'tables.import.chart_shape#one': '{n} diagram importerades inte: dess serier är inte ett sammanhängande cellblock.',

  'tables.drop.label': 'Släpp ett kalkylark för att öppna det',
  'tables.drop.noun': 'ett kalkylark',

  'tables.config.label': 'Arbetsbok',
  'tables.config.desc': 'Blad och deras cellinnehåll; en formel skrivs som text som börjar med =',
  'tables.config.kept': 'den öppna arbetsboken behölls',
});
