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

const LETTER = /[A-Za-z]/;

/**
 * Transforms letters only at brace depth 0 and outside tags, so ICU arguments, plural/select
 * keywords (`one`, `other`, `=0`) and nested option text stay valid for the compiler.
 */
export function pseudoLocalize(message: string, expansion = 0.4): string {
  let depth = 0;
  let inTag = false;
  let letters = 0;
  let out = '';
  for (const ch of message) {
    if (ch === '{') depth += 1;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    else if (ch === '<') inTag = true;
    else if (ch === '>') inTag = false;
    if (depth === 0 && !inTag && LETTER.test(ch)) {
      letters += 1;
      out += MAP[ch] ?? ch;
    } else {
      out += ch;
    }
  }
  return `[${out}${'~'.repeat(Math.ceil(letters * expansion))}]`;
}
