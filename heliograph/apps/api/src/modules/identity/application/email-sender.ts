export interface OutboundEmail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

/** Transactional email port (verification, reset, invitation). Resend adapter lands in M1.4. */
export interface EmailSender {
  send(email: OutboundEmail): Promise<void>;
}
