/**
 * Expected business failures. `code` is for machines, `messageId` for the client's
 * i18n catalog, `params` fills the ICU message (docs/05 §3).
 */
export interface DomainError {
  readonly code: string;
  readonly messageId: string;
  readonly params?: Readonly<Record<string, string | number>>;
}

export const domainError = (
  code: string,
  messageId: string,
  params?: Readonly<Record<string, string | number>>,
): DomainError => (params ? { code, messageId, params } : { code, messageId });
