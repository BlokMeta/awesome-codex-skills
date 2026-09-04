/**
 * Compiles every locale's .po catalog into Lingui runtime JSON (`catalogs/<locale>.json`) so
 * apps import messages without a bundler loader (docs/06). English falls back to the source
 * text of the descriptors; the pseudo-locale is generated.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LOCALES } from '../src/locales.js';
import { parsePo, poToCatalog } from '../src/po.js';
import { compileCatalog, pseudoCatalog, sourceCatalog } from '../src/runtime.js';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'catalogs');
mkdirSync(out, { recursive: true });

for (const locale of LOCALES) {
  let raw: Record<string, string>;
  if (locale.pseudo) raw = pseudoCatalog();
  else {
    const po = readFileSync(resolve(root, 'locales', locale.code, 'messages.po'), 'utf8');
    raw = { ...sourceCatalog(), ...poToCatalog(parsePo(po)) };
  }
  const compiled = compileCatalog(raw);
  writeFileSync(resolve(out, `${locale.code}.json`), `${JSON.stringify(compiled)}\n`);
  process.stdout.write(`catalogs/${locale.code}.json (${Object.keys(compiled).length} messages)\n`);
}
