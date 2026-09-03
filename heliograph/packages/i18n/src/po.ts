/** Minimal .po reader/writer for our catalogs (msgid = message id, msgstr = translation). */
export interface PoEntry {
  readonly id: string;
  readonly str: string;
  readonly fuzzy: boolean;
  readonly comment?: string;
}

const unquote = (s: string): string =>
  s.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');

interface Draft {
  id: string;
  str: string;
  fuzzy: boolean;
  comment?: string;
  mode: 'id' | 'str' | null;
}

const emptyDraft = (): Draft => ({ id: '', str: '', fuzzy: false, mode: null });

function toEntry(d: Draft): PoEntry | null {
  if (!d.id) return null;
  return d.comment
    ? { id: d.id, str: d.str, fuzzy: d.fuzzy, comment: d.comment }
    : { id: d.id, str: d.str, fuzzy: d.fuzzy };
}

function applyLine(d: Draft, line: string): void {
  if (line.startsWith('#, ') && line.includes('fuzzy')) d.fuzzy = true;
  else if (line.startsWith('#. ')) d.comment = line.slice(3);
  else if (line.startsWith('msgid ')) {
    d.mode = 'id';
    d.id = unquote(line.slice(6));
  } else if (line.startsWith('msgstr ')) {
    d.mode = 'str';
    d.str = unquote(line.slice(7));
  } else if (line.startsWith('"') && d.mode) {
    d[d.mode] += unquote(line);
  }
}

export function parsePo(text: string): PoEntry[] {
  const entries: PoEntry[] = [];
  let draft = emptyDraft();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '') {
      const e = toEntry(draft);
      if (e) entries.push(e);
      draft = emptyDraft();
      continue;
    }
    applyLine(draft, line);
  }
  const last = toEntry(draft);
  if (last) entries.push(last);
  return entries;
}

const quote = (s: string): string =>
  `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;

export function serializePo(entries: readonly PoEntry[], locale: string): string {
  const head = `msgid ""\nmsgstr ""\n"Language: ${locale}\\n"\n"Content-Type: text/plain; charset=UTF-8\\n"\n`;
  const body = entries
    .map((e) =>
      [
        e.comment ? `#. ${e.comment}` : null,
        e.fuzzy ? '#, fuzzy' : null,
        `msgid ${quote(e.id)}`,
        `msgstr ${quote(e.str)}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
  return `${head}\n${body}\n`;
}

export function poToCatalog(entries: readonly PoEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) if (e.str && !e.fuzzy) out[e.id] = e.str;
  return out;
}
