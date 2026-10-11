// What Helper says. One pool per mood; the same line never comes up twice in a row.
export const LINES = {
  hello: ['Hi! Pet me.', 'oh hi. tlbx.', 'I am Helper. Hello.', 'pet the tlbx.'],
  pet: ['hehe', 'more tlbx pls', 'purr…', 'squish!', 'HAHAHHEHEHE', 'best day', 'tlbx.', 'again again', 'i am jelly happy', '<3'],
  thrown: ['Wheee!', 'Yeet!', 'AAAAAA', 'I CAN FLY', 'tlbx in flight', 'weeeeeee'],
  ouch: ['OUCH!', 'ouch…', 'my goo!', 'oof.', 'that was my face'],
  annoyed: ['WHY YOU TREAT TLBX LIKE THIS', 'do that again. I dare you.', 'rude.', 'I have feelings. sticky ones.', 'not cool.'],
  dizzy: ['@_@', 'which way is up', 'seeing stars', 'blorp…', 'five of you'],
  rage: ['I AM THE TLBX', 'RAAAAAGH', 'NOW YOU DID IT', 'TLBX SMASH', 'EVERYTHING IS GOO NOW', 'YOU WANTED CHAOS?'],
  calm: ['…ok i\'m fine', 'phew.', 'sorry about the page.', 'deep tlbx breaths', 'it was the goo talking'],
  chaos: ['RAAAH!', 'chaos time', 'unleashed.', 'hehehe. goo.'],
  eat: ['Hello!', 'nom', 'tasty letters', 'crunchy font', 'mmm, kerning'],
  bite: ['CHOMP', 'nom nom', 'crispy card', 'tastes like pixels'],
  knock: ['Oops.', 'Mine.', 'Bye!', 'Down you go.', 'gravity test'],
  blast: ['PEW', 'GOO BLAST', 'BLORP!', 'ka-SPLAT', 'eat goo'],
  hole: ['behold: the void', 'black hole go brrr', 'it hungers', 'into the tlbx dimension'],
  idle: ['tlbx.', 'is it lunch', '…', 'hmm.', 'nice website', 'drag me. I dare you.', 'I could eat a heading'],
  level: ['LEVEL UP', 'stronger tlbx', 'I feel taller'],
  restore: ['All better.', 'good as new', 'I didn\'t do it'],
};

let last = '';
const lastOf = {};
/** A random line from a pool, never the line said last. */
export function line(kind) {
  const pool = LINES[kind] || LINES.idle;
  const choices = pool.filter((l) => l !== last && l !== lastOf[kind]);
  const l = (choices.length ? choices : pool)[Math.floor(Math.random() * (choices.length || pool.length))];
  last = l;
  lastOf[kind] = l;
  return l;
}
