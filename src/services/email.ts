import { Resend } from 'resend';

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  factionId?: number;
}

export class EmailService {
  private client: Resend;
  private domains: Map<number, string> = new Map();

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  /**
   * Register a faction's email domain
   */
  registerDomain(factionId: number, domain: string): void {
    this.domains.set(factionId, domain);
  }

  /**
   * Send an email from the appropriate faction domain
   */
  async send(opts: EmailSendOptions): Promise<{ id: string }> {
    const domain = opts.factionId
      ? this.domains.get(opts.factionId)
      : 'malice.world';

    const result = await this.client.emails.send({
      from: `noreply@${domain}`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });

    return { id: result.data?.id || 'unknown' };
  }
}
