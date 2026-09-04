import {
  type Clock,
  type ConfigReader,
  type ConsentRepository,
  type DomainError,
  domainError,
  err,
  type LegalDocument,
  LegalDocumentSchema,
  OPTIONAL_CONSENTS,
  ok,
  optionalConsentState,
  type PublishedVersions,
  pendingRequired,
  type Result,
  type StoredConsent,
  VersionSchema,
} from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { CLOCK, CONFIG_READER, CONSENT_REPOSITORY } from '../../../shared/tokens.js';

export interface ConsentStatusView {
  readonly pending: LegalDocument[];
  readonly accepted: { document: LegalDocument; version: string; acceptedAt: Date }[];
  readonly optional: ReturnType<typeof optionalConsentState>;
  readonly published: PublishedVersions;
}

export interface ClientMeta {
  readonly ip: string | null;
  readonly userAgent: string | null;
}

/**
 * Consent bookkeeping (docs/16 §7, rule 15). Published versions come from dynamic config
 * (`legal.<doc>.version`, ADR-0011) so a new legal text version automatically re-prompts users.
 */
@Injectable()
export class ConsentService {
  constructor(
    @Inject(CONSENT_REPOSITORY) private readonly repo: ConsentRepository,
    @Inject(CONFIG_READER) private readonly config: ConfigReader,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async published(): Promise<PublishedVersions> {
    const out: Partial<Record<LegalDocument, string>> = {};
    for (const doc of LegalDocumentSchema.options) {
      try {
        out[doc] = await this.config.get(`legal.${doc}.version`, (v) => VersionSchema.parse(v));
      } catch {
        // not published yet — never required, never accepted
      }
    }
    return out;
  }

  async status(
    operatorId: string,
    ctx: { checkoutInTurkey?: boolean } = {},
  ): Promise<ConsentStatusView> {
    const [records, published] = await Promise.all([
      this.repo.listForOperator(operatorId),
      this.published(),
    ]);
    return this.view(records, published, ctx);
  }

  async accept(
    operatorId: string,
    items: readonly { document: LegalDocument; version: string }[],
    meta: ClientMeta,
  ): Promise<Result<ConsentStatusView, DomainError>> {
    const published = await this.published();
    for (const item of items) {
      const current = published[item.document];
      if (!current) {
        return err(
          domainError('privacy.document_not_published', 'errors.privacy.documentNotPublished', {
            document: item.document,
          }),
        );
      }
      if (item.version !== current) {
        return err(
          domainError('privacy.version_outdated', 'errors.privacy.versionOutdated', {
            document: item.document,
            published: current,
          }),
        );
      }
    }
    const now = this.clock.now();
    await this.repo.append(
      items.map((i) => ({
        id: ulid(now.getTime()),
        operatorId,
        document: i.document,
        version: i.version,
        acceptedAt: now,
        ip: meta.ip,
        userAgent: meta.userAgent,
      })),
    );
    return ok(this.view(await this.repo.listForOperator(operatorId), published, {}));
  }

  async withdraw(
    operatorId: string,
    document: LegalDocument,
  ): Promise<Result<ConsentStatusView, DomainError>> {
    if (!OPTIONAL_CONSENTS.includes(document)) {
      return err(
        domainError('privacy.not_withdrawable', 'errors.privacy.notWithdrawable', { document }),
      );
    }
    await this.repo.withdraw(operatorId, document, this.clock.now());
    return ok(await this.status(operatorId));
  }

  private view(
    records: readonly StoredConsent[],
    published: PublishedVersions,
    ctx: { checkoutInTurkey?: boolean },
  ): ConsentStatusView {
    return {
      pending: pendingRequired(records, published, ctx),
      accepted: records
        .filter((r) => !r.withdrawnAt)
        .map((r) => ({ document: r.document, version: r.version, acceptedAt: r.acceptedAt })),
      optional: optionalConsentState(records, published),
      published,
    };
  }
}
