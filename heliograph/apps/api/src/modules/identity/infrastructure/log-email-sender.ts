import { Logger } from '@nestjs/common';
import type { EmailSender, OutboundEmail } from '../application/email-sender.js';

/** Development sender: writes the message to the log (links included) until Resend lands (M1.4). */
export class LogEmailSender implements EmailSender {
  private readonly log = new Logger('email');
  readonly sent: OutboundEmail[] = [];

  async send(email: OutboundEmail): Promise<void> {
    this.sent.push(email);
    this.log.log(`to=${email.to} subject=${email.subject} ${email.text}`);
  }
}
