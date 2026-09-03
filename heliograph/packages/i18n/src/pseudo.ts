/**
 * Pseudo-locale (docs/06 §7): accented letters, ~40% expansion, brackets. Catches hard-coded
 * strings and layouts that break when text grows. ICU placeholders and tags are preserved.
 */
const MAP: Record<string, string> = {
  a: 'á',
  b: 'ƀ',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ĝ',
  h: 'ĥ',
  i: 'í',
  j: 'ĵ',
  k: 'ķ',
  l: 'ł',
  m: 'ɱ',
  n: 'ñ',
  o: 'ó',
  p: 'þ',
  q: ' q',
  r: 'ŕ',
  s: 'š',
  t: 'ţ',
  u: 'ú',
  v: 'ṽ',
  w: 'ŵ',
  x: 'ẋ',
  y: 'ý',
  z: 'ž',
  A: 'Á',
  B: 'Ɓ',
  C: 'Ç',
  D: 'Ð',
  E: 'É',
  F: 'Ƒ',
  G: 'Ĝ',
  H: 'Ĥ',
  I: 'Í',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ł',
  M: 'M',
  N: 'Ñ',
  O: 'Ó',
  P: 'Þ',
  Q: 'Q',
  R: 'Ŕ',
  S: 'Š',
  T: 'Ţ',
  U: 'Ú',
  V: 'Ṽ',
  W: 'Ŵ',
  X: 'Ẋ',
  Y: 'Ý',
  Z: 'Ž',
};

const PLACEHOLDER = /(\{[^}]*\}|<[^>]+>)/g;

export function pseudoLocalize(message: string, expansion = 0.4): string {
  const parts = message.split(PLACEHOLDER);
  const out = parts
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/[A-Za-z]/g, (ch) => MAP[ch] ?? ch)))
    .join('');
  const letters = message.replace(PLACEHOLDER, '').replace(/[^A-Za-z]/g, '').length;
  const pad = '~'.repeat(Math.ceil(letters * expansion));
  return `[${out}${pad}]`;
}
