import { contract } from '@heliograph/contracts';
import { Controller, Inject } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { CurrentWorkspace } from '../../identity/interface/auth.decorators.js';
import { EntitlementService } from '../application/entitlement.service.js';

@Controller()
export class BillingController {
  constructor(@Inject(EntitlementService) private readonly entitlements: EntitlementService) {}

  @Implement(contract.billing.entitlements)
  entitlementsOf(@CurrentWorkspace() workspaceId: string) {
    return implement(contract.billing.entitlements).handler(async () => {
      const { resolved, lines, credits } = await this.entitlements.overview(workspaceId);
      const s = resolved.subscription;
      return {
        workspaceId,
        plan: { code: resolved.plan.code, name: resolved.plan.name },
        subscription: s
          ? {
              status: s.status,
              currentPeriodEnd: s.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: s.cancelAtPeriodEnd,
              trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
            }
          : null,
        entitlements: lines,
        credits,
      };
    });
  }
}
