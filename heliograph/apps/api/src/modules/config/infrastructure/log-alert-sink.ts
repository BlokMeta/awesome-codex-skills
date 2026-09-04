import type { ConfigStale, StaleAlertSink } from '@heliograph/domain';
import { Logger } from '@nestjs/common';

/** Until the notification module exists (M1.4), stale-config alerts land in the structured log. */
export class LogAlertSink implements StaleAlertSink {
  private readonly log = new Logger('config.staleness');

  async notify(event: ConfigStale): Promise<void> {
    const line = `stale config ${event.key} (${event.scope}${event.scopeId ? `:${event.scopeId}` : ''}) overdue ${event.overdueDays}d`;
    if (event.level === 'critical') this.log.error(line);
    else this.log.warn(line);
  }
}
