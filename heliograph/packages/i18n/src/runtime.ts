import { type I18n, type Messages, setupI18n } from '@lingui/core';
import { compileMessage } from '@lingui/message-utils/compileMessage';
import { allDescriptors, type MessageDescriptor } from './messages/index.js';
import { pseudoLocalize } from './pseudo.js';

export type Catalog = Readonly<Record<string, string>>;

/** Compiles ICU source strings into Lingui's runtime format. */
export function compileCatalog(raw: Catalog): Messages {
  const out: Messages = {};
  for (const [id, text] of Object.entries(raw)) out[id] = compileMessage(text);
  return out;
}

/** English source catalog derived from the descriptors themselves (never out of date). */
export function sourceCatalog(): Catalog {
  return Object.fromEntries(allDescriptors().map((d) => [d.id, d.message]));
}

export function pseudoCatalog(): Catalog {
  return Object.fromEntries(
    Object.entries(sourceCatalog()).map(([id, text]) => [id, pseudoLocalize(text)]),
  );
}

export interface CreateI18nOptions {
  locale: string;
  catalog: Catalog;
  /** Used for ids missing from `catalog`. */
  fallback?: Catalog;
}

export function createI18n({ locale, catalog, fallback }: CreateI18nOptions): I18n {
  const i18n = setupI18n({
    locale,
    messages: { [locale]: compileCatalog({ ...fallback, ...catalog }) },
  });
  return i18n;
}

export function translate(
  i18n: I18n,
  descriptor: MessageDescriptor,
  values?: Record<string, unknown>,
): string {
  return i18n._(descriptor.id, values, { message: descriptor.message });
}
