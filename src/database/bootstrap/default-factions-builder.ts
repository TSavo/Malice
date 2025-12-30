import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds default faction instances
 * Creates $continuum and $cartel factions during bootstrap
 *
 * Run AFTER:
 * - FactionBuilder (creates $faction prototype)
 * - FactionManagerBuilder (creates $factionManager singleton)
 * - CharGenBuilder (creates $charGen)
 * - CartelCharGenBuilder (creates $cartelCharGen)
 */
export class DefaultFactionsBuilder {
  private continuum: RuntimeObject | null = null;
  private cartel: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Check if factions already exist
    if (aliases.continuum) {
      this.continuum = await this.manager.load(aliases.continuum);
    }
    if (aliases.cartel) {
      this.cartel = await this.manager.load(aliases.cartel);
    }

    // Skip if both exist
    if (this.continuum && this.cartel) {
      return;
    }

    // Load dependencies
    const factionPrototype = aliases.faction
      ? await this.manager.load(aliases.faction)
      : null;
    const factionManager = aliases.factionManager
      ? await this.manager.load(aliases.factionManager)
      : null;
    const charGen = aliases.charGen
      ? await this.manager.load(aliases.charGen)
      : null;
    const cartelCharGen = aliases.cartelCharGen
      ? await this.manager.load(aliases.cartelCharGen)
      : null;

    if (!factionPrototype) {
      console.warn('⚠️  $faction prototype not found - skipping faction creation');
      return;
    }
    if (!factionManager) {
      console.warn('⚠️  $factionManager not found - skipping faction creation');
      return;
    }

    // Create Continuum faction
    if (!this.continuum) {
      this.continuum = await this.manager.create({
        parent: factionPrototype,
        properties: {
          name: 'The Continuum',
          description: 'The default governing authority of Malice',
          domain: 'thecontinuum.city',
          charGen: charGen?.id || null,
          leader: null,
          sshHostKey: null,
          ports: null,
          index: 0, // First faction gets index 0
          discordWebhook: null, // Set via admin
        },
        methods: {},
      });

      // Set Continuum-branded onPlayerRegistered
      this.continuum.setMethod(
        'onPlayerRegistered',
        `
        /** Called when a new player registers with Continuum.
         *  Sends branded verification email and Discord notification.
         *  @param player - The newly created player object
         */
        const player = args[0];
        if (!player) return;

        const verifyUrl = 'https://' + self.domain + '/verify?t=' + player.verificationToken;

        // Send Continuum-branded verification email
        try {
          await $email.send({
            to: player.email,
            subject: 'Verify your Continuum citizenship',
            html: \`
              <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 32px;">
                <div style="background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <h1 style="color: #0066cc; margin: 0 0 16px 0;">Welcome to The Continuum</h1>
                  <p style="color: #333; font-size: 16px;">Hello <strong>\${player.playername}</strong>,</p>
                  <p style="color: #333; font-size: 16px;">Thank you for applying for Continuum citizenship. Please verify your identity to complete the registration process.</p>
                  <p style="margin: 32px 0; text-align: center;">
                    <a href="\${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Identity</a>
                  </p>
                  <p style="color: #888; font-size: 12px;">Or copy this link: \${verifyUrl}</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                  <p style="color: #888; font-size: 12px; margin: 0;">This is an automated message from The Continuum. Do not reply.</p>
                </div>
              </div>
            \`,
            faction: self
          });
          console.log('[Continuum] Verification email sent to ' + player.email);
        } catch (err) {
          console.error('[Continuum] Failed to send verification email:', err);
        }

        // Send Discord notification if webhook configured
        if (self.discordWebhook) {
          try {
            await $http.post(self.discordWebhook, {
              content: null,
              embeds: [{
                title: '🎫 New Continuum Citizen Application',
                color: 0x0066cc,
                fields: [
                  { name: 'Username', value: player.playername, inline: true },
                  { name: 'Email', value: player.email, inline: true }
                ],
                footer: { text: 'The Continuum Registration System' },
                timestamp: new Date().toISOString()
              }]
            });
            console.log('[Continuum] Discord notification sent for ' + player.playername);
          } catch (err) {
            console.error('[Continuum] Failed to send Discord notification:', err);
          }
        }
        `,
      );

      // Register with faction manager
      if (factionManager) {
        await factionManager.call('register', this.continuum);
      }

      console.log(`  ✓ Created $continuum faction (#${this.continuum.id})`);
    }

    // Create Gray Cartel faction
    if (!this.cartel) {
      this.cartel = await this.manager.create({
        parent: factionPrototype,
        properties: {
          name: 'Gray Cartel',
          description: 'Underground resistance network',
          domain: 'graycartel.com',
          charGen: cartelCharGen?.id || null,
          leader: null,
          sshHostKey: null,
          ports: null,
          index: 1, // Second faction gets index 1
          discordWebhook: null, // Set via admin
        },
        methods: {},
      });

      // Set Cartel-branded onPlayerRegistered
      this.cartel.setMethod(
        'onPlayerRegistered',
        `
        /** Called when a new player registers with the Gray Cartel.
         *  Sends branded verification email and Discord notification.
         *  @param player - The newly created player object
         */
        const player = args[0];
        if (!player) return;

        const verifyUrl = 'https://' + self.domain + '/verify?t=' + player.verificationToken;

        // Send Cartel-branded verification email
        try {
          await $email.send({
            to: player.email,
            subject: 'Verify your Gray Cartel identity',
            html: \`
              <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 32px;">
                <div style="background: #141414; padding: 32px; border-radius: 8px; border: 1px solid #333;">
                  <h1 style="color: #00ff88; margin: 0 0 16px 0;">Welcome to the Gray Cartel</h1>
                  <p style="color: #e0e0e0; font-size: 16px;">Operative <strong style="color: #00ff88;">\${player.playername}</strong>,</p>
                  <p style="color: #e0e0e0; font-size: 16px;">Your application has been received. Verify your identity to complete the initiation process.</p>
                  <p style="margin: 32px 0; text-align: center;">
                    <a href="\${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #00ff88; color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Identity</a>
                  </p>
                  <p style="color: #666; font-size: 12px;">Or copy this link: \${verifyUrl}</p>
                  <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
                  <p style="color: #666; font-size: 12px; margin: 0;">This message will self-destruct. Do not reply.</p>
                </div>
              </div>
            \`,
            faction: self
          });
          console.log('[Cartel] Verification email sent to ' + player.email);
        } catch (err) {
          console.error('[Cartel] Failed to send verification email:', err);
        }

        // Send Discord notification if webhook configured
        if (self.discordWebhook) {
          try {
            await $http.post(self.discordWebhook, {
              content: null,
              embeds: [{
                title: '🎫 New Cartel Recruit',
                color: 0x00ff88,
                fields: [
                  { name: 'Codename', value: player.playername, inline: true },
                  { name: 'Contact', value: player.email, inline: true }
                ],
                footer: { text: 'Gray Cartel Network' },
                timestamp: new Date().toISOString()
              }]
            });
            console.log('[Cartel] Discord notification sent for ' + player.playername);
          } catch (err) {
            console.error('[Cartel] Failed to send Discord notification:', err);
          }
        }
        `,
      );

      // Register with faction manager
      if (factionManager) {
        await factionManager.call('register', this.cartel);
      }

      console.log(`  ✓ Created $cartel faction (#${this.cartel.id})`);
    }
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    if (this.continuum) {
      await objectManager.call('addAlias', 'continuum', this.continuum.id);
      console.log(`  ✓ Registered continuum alias -> #${this.continuum.id}`);
    }

    if (this.cartel) {
      await objectManager.call('addAlias', 'cartel', this.cartel.id);
      console.log(`  ✓ Registered cartel alias -> #${this.cartel.id}`);
    }
  }
}
