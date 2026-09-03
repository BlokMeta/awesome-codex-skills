/**
 * `pnpm i18n:check` — for every non-pseudo locale, every message id must have a non-fuzzy
 * translation (docs/06 §3). Also flags catalog entries whose id no longer exists in code.
 * `--write` regenerates missing entries as fuzzy copies of the source text.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LOCALES } from '../src/locales.js';
import { allDescriptors } from '../src/messages/index.js';
import { type PoEntry, parsePo, serializePo } from '../src/po.js';

const root = resolve(import.meta.dirname, '..');
const write = process.argv.includes('--write');
const descriptors = allDescriptors();
const ids = new Set(descriptors.map((d) => d.id));
let problems = 0;

for (const locale of LOCALES.filter((l) => !l.pseudo)) {
  const dir = resolve(root, 'locales', locale.code);
  const file = resolve(dir, 'messages.po');
  const entries = existsSync(file) ? parsePo(readFileSync(file, 'utf8')) : [];
  const byId = new Map(entries.map((e) => [e.id, e]));
  const missing = descriptors.filter((d) => !byId.get(d.id)?.str || byId.get(d.id)?.fuzzy);
  const orphans = entries.filter((e) => !ids.has(e.id));
  const complete = descriptors.length - missing.length;
  process.stdout.write(
    `${locale.code}: ${complete}/${descriptors.length} translated${missing.length ? `, ${missing.length} missing/fuzzy` : ''}${orphans.length ? `, ${orphans.length} orphan` : ''}\n`,
  );
  for (const d of missing) process.stdout.write(`  ✗ ${d.id}\n`);
  for (const o of orphans) process.stdout.write(`  · orphan ${o.id}\n`);
  if (!locale.incomplete) problems += missing.length;
  if (write) {
    const next: PoEntry[] = descriptors.map((d) => {
      const existing = byId.get(d.id);
      if (existing?.str && !existing.fuzzy)
        return d.comment ? { ...existing, comment: d.comment } : existing;
      const isSource = locale.code === 'en';
      return d.comment
        ? { id: d.id, str: d.message, fuzzy: !isSource, comment: d.comment }
        : { id: d.id, str: d.message, fuzzy: !isSource };
    });
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, serializePo(next, locale.code));
  }
}

if (problems > 0 && !write) {
  process.stdout.write(
    `\n${problems} eksik çeviri. Çevirmek için locales/<code>/messages.po; iskelet için --write\n`,
  );
  process.exitCode = 1;
}
