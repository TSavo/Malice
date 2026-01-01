import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds $email MOO object for sending emails
 *
 * Pure MOO object - uses Resend API via dynamic import.
 * API key stored in object property, set during bootstrap from env.
 *
 * Usage from MOO code:
 *   await $email.send({
 *     to: 'user@example.com',
 *     subject: 'Hello',
 *     html: '<h1>Hi</h1>',
 *     faction: $continuum  // Optional: uses faction's domain
 *   });
 */
export class EmailBuilder implements Builder {
  static provides = ['email'];
  static depends: string[] = [];

  private email: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.email) {
      this.email = await this.manager.load(aliases.email);
      if (this.email) return;
    }

    if (!this.email) {
      const root = await this.manager.load('root');
      this.email = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Email Service',
          description: 'Email service using Resend API',
          apiKey: process.env.EMAIL_API_KEY || '',
          defaultDomain: 'malice.world',
          // Faction ID -> domain mapping
          factionDomains: {},
        },
      });
    }

    // Update API key from environment (in case it changed)
    if (process.env.EMAIL_API_KEY) {
      this.email.set('apiKey', process.env.EMAIL_API_KEY);
    }

    // Register a faction's email domain
    this.email.setMethod(
      'registerDomain',
      `
      const factionId = args[0];
      const domain = args[1];

      const domains = self.factionDomains || {};
      domains[factionId] = domain;
      self.factionDomains = domains;

      return { success: true, factionId, domain };
    `,
    );

    // Send an email
    this.email.setMethod(
      'send',
      `
      const opts = args[0];

      if (!opts || !opts.to || !opts.subject || !opts.html) {
        return { error: 'Missing required fields: to, subject, html' };
      }

      const apiKey = self.apiKey;
      if (!apiKey) {
        return { error: 'Email API key not configured' };
      }

      // Determine domain based on faction
      let domain = self.defaultDomain || 'malice.world';
      if (opts.faction && opts.faction.id) {
        const factionDomains = self.factionDomains || {};
        if (factionDomains[opts.faction.id]) {
          domain = factionDomains[opts.faction.id];
        }
      }

      try {
        const { Resend } = await import('resend');
        const client = new Resend(apiKey);

        const result = await client.emails.send({
          from: 'noreply@' + domain,
          to: opts.to,
          subject: opts.subject,
          html: opts.html,
        });

        return { id: result.data?.id || 'unknown' };
      } catch (err) {
        return { error: String(err) };
      }
    `,
    );

    // Check if email is configured
    this.email.setMethod(
      'isConfigured',
      `
      return !!self.apiKey;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.email) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'email', this.email.id);
    console.log(`✅ Registered $email alias -> #${this.email.id}`);
  }
}

// Self-register
registerBuilder(EmailBuilder);
