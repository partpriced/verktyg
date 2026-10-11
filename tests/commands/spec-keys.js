/* Key binding parser, canonical form, platform display and keydown → step. */
(function () {
  const { describe, it, expect } = TlbxTest;
  describe('parser', () => {
    it('maps Mod to Ctrl on Windows/Linux and to ⌘ on a Mac, in a fixed modifier order', () => {
      expect(TlbxCmd.parse('Mod+S', false)).toEqual(['Mod+S']);
      expect(TlbxCmd.parse('Ctrl+S', false)).toEqual(['Mod+S']);
      expect(TlbxCmd.parse('Ctrl+S', true)).toEqual(['Ctrl+S']);
      expect(TlbxCmd.parse('Cmd+S', true)).toEqual(['Mod+S']);
      expect(TlbxCmd.parse('Meta+S', true)).toEqual(['Mod+S']);
      expect(TlbxCmd.canon('Shift+Mod+Z', false)).toBe('Mod+Shift+Z');
      expect(TlbxCmd.canon('shift+mod+z', false)).toBe('Mod+Shift+Z');
      expect(TlbxCmd.canon('Alt+Shift+Mod+arrowup', false)).toBe('Mod+Alt+Shift+ArrowUp');
    });
    it('parses chords, special keys, aliases and the plus key', () => {
      expect(TlbxCmd.parse('Mod+K Mod+S', false)).toEqual(['Mod+K', 'Mod+S']);
      expect(TlbxCmd.parse('g  g')).toEqual(['G', 'G']);
      expect(TlbxCmd.canon('Esc')).toBe('Escape');
      expect(TlbxCmd.canon('Del')).toBe('Delete');
      expect(TlbxCmd.canon('PgDn')).toBe('PageDown');
      expect(TlbxCmd.canon('space')).toBe('Space');
      expect(TlbxCmd.canon('Mod++', false)).toBe('Mod++');
      expect(TlbxCmd.canon('Mod+Plus', false)).toBe('Mod++');
      expect(TlbxCmd.canon('f5')).toBe('F5');
      expect(TlbxCmd.canon('?')).toBe('?');
      expect(TlbxCmd.canon('/')).toBe('/');
      expect(TlbxCmd.parse(['Mod+K', 'Mod+S'], false)).toEqual(['Mod+K', 'Mod+S']);
    });
    it('rejects bindings with no key or unknown modifiers', () => {
      expect(TlbxCmd.parse('Mod+')).toBe(null);
      expect(TlbxCmd.parse('Shift')).toBe(null);
      expect(TlbxCmd.parse('Ctrl+Shift')).toBe(null);
      expect(TlbxCmd.parse('Hyper+S')).toBe(null);
      expect(TlbxCmd.parse('')).toBe(null);
    });
  });
  describe('display', () => {
    it('shows ⌘/⇧/⌥ symbols on a Mac and Ctrl+… elsewhere', () => {
      expect(TlbxCmd.format('Mod+S', true)).toBe('⌘S');
      expect(TlbxCmd.format('Shift+Mod+Z', true)).toBe('⇧⌘Z');
      expect(TlbxCmd.format('Alt+Mod+ArrowUp', true)).toBe('⌥⌘↑');
      expect(TlbxCmd.format('Ctrl+Alt+Shift+Mod+K', true)).toBe('⌃⌥⇧⌘K');
      expect(TlbxCmd.format('Mod+S', false)).toBe('Ctrl+S');
      expect(TlbxCmd.format('Shift+Mod+Z', false)).toBe('Ctrl+Shift+Z');
      expect(TlbxCmd.format('Mod+K Mod+S', false)).toBe('Ctrl+K Ctrl+S');
      expect(TlbxCmd.format('Delete', false)).toBe('Del');
      expect(TlbxCmd.format('Delete', true)).toBe('⌦');
      expect(TlbxCmd.format('Escape', false)).toBe('Esc');
      expect(TlbxCmd.format('t', false)).toBe('T');
    });
    it('keyFor gives the display string of the first binding', () => {
      T.fresh();
      T.spy({ id: 't.save', keys: ['Mod+S', 'F2'] });
      expect(TlbxCmd.keyFor('t.save')).toBe('Ctrl+S');
      expect(TlbxCmd.keysFor('t.save')).toEqual(['Ctrl+S', 'F2']);
      TlbxCmd.mac = true;
      expect(TlbxCmd.keyFor('t.save')).toBe('⌘S');
      TlbxCmd.mac = false;
      expect(TlbxCmd.keyFor('nope')).toBe('');
    });
  });
  describe('keydown → step', () => {
    const ev = (o) => new KeyboardEvent('keydown', o);
    it('uses Ctrl as Mod on PC and Meta as Mod on a Mac', () => {
      expect(TlbxCmd.eventSteps(ev({ key: 's', code: 'KeyS', ctrlKey: true }), false)).toEqual(['Mod+S']);
      expect(TlbxCmd.eventSteps(ev({ key: 's', code: 'KeyS', metaKey: true }), true)).toEqual(['Mod+S']);
      expect(TlbxCmd.eventSteps(ev({ key: 's', code: 'KeyS', ctrlKey: true }), true)).toEqual(['Ctrl+S']);
      expect(TlbxCmd.eventSteps(ev({ key: 'Z', code: 'KeyZ', ctrlKey: true, shiftKey: true }), false)).toEqual(['Mod+Shift+Z']);
    });
    it('reads letters from the code when Alt changes the character, and offers symbol forms', () => {
      expect(TlbxCmd.eventSteps(ev({ key: 'å', code: 'KeyA', altKey: true }), true)).toEqual(['Alt+A']);
      expect(TlbxCmd.eventSteps(ev({ key: '?', code: 'Slash', shiftKey: true }), false)).toEqual(['Shift+?', '?', 'Shift+/']);
      expect(TlbxCmd.eventSteps(ev({ key: '+', code: 'Equal', ctrlKey: true, shiftKey: true }), false)).toEqual(['Mod+Shift++', 'Mod++', 'Mod+Shift+=']);
      expect(TlbxCmd.eventSteps(ev({ key: '}', code: 'BracketRight', ctrlKey: true, shiftKey: true }), false)).toEqual(['Mod+Shift+}', 'Mod+}', 'Mod+Shift+]']);
      expect(TlbxCmd.eventSteps(ev({ key: ']', code: 'BracketRight', ctrlKey: true }), false)).toEqual(['Mod+]']);
      expect(TlbxCmd.eventSteps(ev({ key: ' ', code: 'Space' }), false)).toEqual(['Space']);
      expect(TlbxCmd.eventSteps(ev({ key: 'Shift', code: 'ShiftLeft', shiftKey: true }), false)).toBe(null);
    });
  });
})();
