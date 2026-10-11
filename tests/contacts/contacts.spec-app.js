/* Contacts app: boot, commands, Files save and reopen by ?drive=, autosave draft, export to Drive,
 * the group filter, TlbxGuard, and the 390 px layout. The app runs in same-origin iframes, so the real
 * Files and draft stores are used. */
(function () {
  'use strict';
  const { describe, it, expect, sleep, waitFor } = TlbxTest;

  /** Load contacts/index.html (plus an optional query) into a frame and wait until it is ready. */
  async function boot(query = '', frameId = 'app') {
    const fr = document.getElementById(frameId);
    fr.src = 'about:blank';
    await sleep(60);
    fr.src = '../../contacts/index.html' + query;
    await waitFor(() => fr.contentWindow && fr.contentWindow.TlbxContacts && fr.contentWindow.TlbxContacts.ready, { timeout: 30000 });
    return fr.contentWindow;
  }
  const driveRecords = async (win) => (await win.TlbxHub.list({ trashed: 'any' }));
  /** The most recent Drive record with this name. */
  const latest = async (win, name) => (await driveRecords(win)).find((r) => r.name === name);
  const shownNames = (win) => [...win.document.querySelectorAll('#rows .nm')].map((n) => n.textContent);

  describe('boot and commands', () => {
    it('starts blank, with the TlbxCmd commands and the shared chrome', async () => {
      await CT.clearDrafts();
      const win = await boot('', 'app');
      expect(win.TlbxContacts.state.list).toHaveLength(0);
      expect(win.document.getElementById('empty').hidden).toBeFalsy();
      expect(win.TlbxCmd.get('export.vcf')).toBeTruthy();
      expect(win.TlbxCmd.get('contacts.dupes')).toBeTruthy();
      expect(win.TlbxCmd.get('file.save')).toBeTruthy();
    });
    it('lists the four export formats', () => {
      const ids = document.getElementById('app').contentWindow.TlbxContacts.format.FORMATS.map((f) => f.id);
      expect(ids).toEqual(['vcf', 'zip', 'google', 'outlook']);
    });
  });

  describe('Files and autosave', () => {
    it('shows the list, and the group sidebar counts and filters it', async () => {
      const win = document.getElementById('app').contentWindow;
      win.TlbxContacts.state.setList(CT.sample());
      await sleep(30);
      expect(win.document.querySelectorAll('#rows .row')).toHaveLength(CT.sample().length);
      const club = win.document.querySelector('.gbtn[data-name="Club"]');
      expect(club).toBeTruthy();
      club.click();
      expect(win.TlbxContacts.state.group).toBe('Club');
      expect(win.document.querySelectorAll('#rows .row')).toHaveLength(1);
      win.document.querySelector('.gbtn[data-kind="all"]').click();
      expect(win.document.querySelectorAll('#rows .row')).toHaveLength(CT.sample().length);
    });
    it('first save asks for a folder and writes a .scontacts record; the app keeps its id', async () => {
      const win = document.getElementById('app').contentWindow;
      win.TlbxHub.pickFolder = async () => null;
      expect(win.TlbxGuard.hasUnsaved()).toBeTruthy();
      const ok = await win.TlbxContacts.storage.save();
      expect(ok).toBeTruthy();
      const id = win.TlbxContacts.state.file.driveId;
      expect(id).toBeTruthy();
      const rec = await win.TlbxHub.get(id);
      expect(rec.name).toBe('Contacts.scontacts');
      expect(rec.type).toBe('application/x-tlbx-contacts');
      expect(rec.from).toBe('contacts');
      expect(win.TlbxContacts.state.file.dirty).toBeFalsy();
      expect(win.TlbxGuard.hasUnsaved()).toBeFalsy();
    });
    it('reopening with ?drive=<id> restores the same contacts', async () => {
      const win = document.getElementById('app').contentWindow;
      const id = win.TlbxContacts.state.file.driveId;
      const expected = win.TlbxContacts.state.list.slice();
      const win2 = await boot('?drive=' + id, 'app2');
      const got = win2.TlbxContacts.state.list;
      expect(got).toHaveLength(expected.length);
      expect(got.map((c) => c.id)).toEqual(expected.map((c) => c.id));
      for (let i = 0; i < got.length; i++) expect(got[i]).toEqual(expected[i]);
      expect(win2.TlbxContacts.state.file.driveId).toBe(id);
      expect(win2.TlbxContacts.state.file.name).toBe('Contacts');
    });
    it('saving again writes the same Drive record', async () => {
      const win = document.getElementById('app').contentWindow;
      const id = win.TlbxContacts.state.file.driveId;
      win.TlbxContacts.state.setList([...win.TlbxContacts.state.list, CT.make({ id: 'more', name: { given: 'More' } })]);
      await win.TlbxContacts.storage.save();
      const win2 = await boot('?drive=' + id, 'app2');
      expect(win2.TlbxContacts.state.list.some((c) => c.id === 'more')).toBeTruthy();
      expect(win2.TlbxContacts.state.list).toHaveLength(CT.sample().length + 1);
    });
    it('a vCard record opens as an unsaved import, so Drive keeps its own format', async () => {
      const win = document.getElementById('app').contentWindow;
      win.TlbxHub.pickFolder = async () => null;
      const put = await win.TlbxHub.put(CT.file(CT.VCF30, 'Team.vcf', 'text/vcard'), { name: 'Team.vcf', from: 'test' });
      const win2 = await boot('?drive=' + put, 'app2');
      expect(win2.TlbxContacts.state.list).toHaveLength(1);
      expect(win2.TlbxContacts.state.file.driveId).toBeFalsy();
      expect(win2.TlbxContacts.state.file.dirty).toBeTruthy();
    });
    it('autosaves a draft to IndexedDB and restores it on a plain start', async () => {
      await CT.clearDrafts();
      const win = await boot('', 'app');
      win.TlbxContacts.state.setList([CT.make({ id: 'draft-1', name: { given: 'Draft', family: 'Person' } })]);
      await sleep(900);
      const d = await win.TlbxContacts.drafts.read();
      expect(d && d.json).toBeTruthy();
      const win2 = await boot('', 'app2');
      expect(win2.TlbxContacts.state.list.map((c) => c.id)).toEqual(['draft-1']);
    });
    it('exports are downloaded and saved to Files', async () => {
      const win = document.getElementById('app').contentWindow;
      const list = win.TlbxContacts.state.list;
      const ok = await win.TlbxContacts.io.exportAs('vcf', list);
      expect(ok).toBeTruthy();
      const rec = await latest(win, 'Contacts.vcf');
      expect(rec).toBeTruthy();
      expect(rec.type).toBe('text/vcard');
      const text = await rec.blob.text();
      expect(text.split('BEGIN:VCARD')).toHaveLength(list.length + 1);
      await win.TlbxContacts.io.exportAs('google', list);
      expect(await latest(win, 'Contacts (Google).csv')).toBeTruthy();
    });
  });

  describe('layout', () => {
    it('works at 390 px wide with no horizontal page scroll', async () => {
      const win = document.getElementById('app').contentWindow;
      win.TlbxContacts.state.setList(CT.sample().concat([CT.make({ id: 'wide', name: { given: 'Supercalifragilisticexpialidocious'.repeat(3) },
        org: 'An organisation with a very long name that would overflow a narrow screen if the layout were careless', phones: [{ value: '+44 7700 900123' }] })]));
      const fr = document.getElementById('app');
      fr.style.width = '390px';
      await sleep(250);
      const de = win.document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      fr.style.width = '1280px';
      expect(overflow).toBeLessThanOrEqual(1);
    });
    it('the editor dialog opens and saves a new phone', async () => {
      const win = document.getElementById('app').contentWindow;
      win.TlbxContacts.editor.open(win.TlbxContacts.state.list[0].id);
      await sleep(120);
      const dlg = win.document.querySelector('.sui-dlg.ed-dlg');
      expect(dlg).toBeTruthy();
      dlg.querySelector('.ed-add').click();
      const rows = dlg.querySelectorAll('.ed-phone');
      const input = rows[rows.length - 1].querySelector('input');
      input.value = '+49 151 000 111';
      [...dlg.querySelectorAll('.sui-btn.sui-primary')].find((b) => b.textContent === 'Save').click();
      await sleep(260);
      const first = win.TlbxContacts.state.list[0];
      expect(first.phones.some((p) => p.value === '+49 151 000 111')).toBeTruthy();
    });
  });
})();
