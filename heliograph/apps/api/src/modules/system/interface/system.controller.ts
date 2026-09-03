import { contract } from '@heliograph/contracts';
import type { Clock } from '@heliograph/domain';
import { Controller, Inject } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { APP_VERSION, CLOCK, CONFIG_SERVICE } from '../../../shared/tokens.js';
import type { ConfigService } from '../../config/application/config.service.js';

@Controller()
export class SystemController {
  constructor(
    @Inject(CONFIG_SERVICE) private readonly config: ConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(APP_VERSION) private readonly version: string,
  ) {}

  @Implement(contract.system.health)
  health() {
    return implement(contract.system.health).handler(async () => {
      const stale = (await this.config.staleness()).filter((s) => s.level !== 'fresh');
      return {
        status: stale.some((s) => s.level === 'critical') ? ('degraded' as const) : ('ok' as const),
        version: this.version,
        checkedAt: this.clock.now().toISOString(),
        dependencies: [{ name: 'config', status: 'ok' as const }],
        staleConfigKeys: stale.length,
      };
    });
  }

  @Implement(contract.system.configHealth)
  configHealth() {
    return implement(contract.system.configHealth).handler(async () => {
      const now = this.clock.now();
      const stale = (await this.config.staleness()).filter((s) => s.level !== 'fresh');
      return {
        checkedAt: now.toISOString(),
        stale: stale.map((s) => ({
          key: s.scopeId ? `${s.key}[${s.scopeId}]` : s.key,
          verifiedAt: new Date(now.getTime() - s.ageDays * 86_400_000).toISOString(),
          maxAgeDays: s.maxAgeDays,
          overdueDays: s.overdueDays,
        })),
      };
    });
  }
}
