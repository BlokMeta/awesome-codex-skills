import type { Clock, ConfigStale, StaleAlertSink, Staleness } from '@heliograph/domain';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CLOCK, CONFIG_SERVICE, STALE_ALERT_SINK } from '../../../shared/tokens.js';
import { meter } from '../../../telemetry.js';
import type { ConfigService } from './config.service.js';

/**
 * Hourly sweep over every effective policy entry (ADR-0011 §4). Entries past `max_age_days`
 * become ConfigStale alerts — warning at 1× the threshold, critical at 2× — so an operator
 * re-verifies or supersedes them from the panel. Nothing here mutates config.
 */
@Injectable()
export class StalenessWatcher {
  private lastCounts: Record<'warning' | 'critical', number> = { warning: 0, critical: 0 };

  constructor(
    @Inject(CONFIG_SERVICE) private readonly config: ConfigService,
    @Inject(STALE_ALERT_SINK) private readonly sink: StaleAlertSink,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {
    meter()
      .createObservableGauge('hg_config_stale_keys', {
        description: 'Policy entries past max_age_days, by severity (ADR-0011)',
      })
      .addCallback((result) => {
        result.observe(this.lastCounts.warning, { level: 'warning' });
        result.observe(this.lastCounts.critical, { level: 'critical' });
      });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<ConfigStale[]> {
    const report = await this.config.staleness();
    const events = report.filter((s) => s.level !== 'fresh').map((s) => this.toEvent(s));
    this.lastCounts = {
      warning: events.filter((e) => e.level === 'warning').length,
      critical: events.filter((e) => e.level === 'critical').length,
    };
    for (const event of events) await this.sink.notify(event);
    return events;
  }

  private toEvent(s: Staleness): ConfigStale {
    return {
      type: 'ConfigStale',
      key: s.key,
      scope: s.scope,
      scopeId: s.scopeId,
      overdueDays: s.overdueDays,
      level: s.level === 'critical' ? 'critical' : 'warning',
      at: this.clock.now(),
    };
  }
}
