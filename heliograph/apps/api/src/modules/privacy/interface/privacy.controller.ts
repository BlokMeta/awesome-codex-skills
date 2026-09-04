import { contract } from '@heliograph/contracts';
import { Controller, Inject } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { unwrapOrThrow } from '../../../shared/http/domain-error.js';
import type { Principal } from '../../identity/application/principal.js';
import { ClientMeta, CurrentSession } from '../../identity/interface/auth.decorators.js';
import {
  type ClientMeta as ClientMetaValue,
  ConsentService,
  type ConsentStatusView,
} from '../application/consent.service.js';

const toResponse = (v: ConsentStatusView) => ({
  pending: v.pending,
  accepted: v.accepted.map((a) => ({ ...a, acceptedAt: a.acceptedAt.toISOString() })),
  optional: v.optional,
  published: v.published,
});

@Controller()
export class PrivacyController {
  constructor(@Inject(ConsentService) private readonly consents: ConsentService) {}

  @Implement(contract.privacy.consentStatus)
  status(@CurrentSession() session: Principal) {
    return implement(contract.privacy.consentStatus).handler(async () =>
      toResponse(await this.consents.status(session.user.id)),
    );
  }

  @Implement(contract.privacy.acceptConsents)
  accept(@CurrentSession() session: Principal, @ClientMeta() meta: ClientMetaValue) {
    return implement(contract.privacy.acceptConsents).handler(async ({ input }) =>
      toResponse(unwrapOrThrow(await this.consents.accept(session.user.id, input.accept, meta))),
    );
  }

  @Implement(contract.privacy.withdrawConsent)
  withdraw(@CurrentSession() session: Principal) {
    return implement(contract.privacy.withdrawConsent).handler(async ({ input }) =>
      toResponse(unwrapOrThrow(await this.consents.withdraw(session.user.id, input.document))),
    );
  }
}
