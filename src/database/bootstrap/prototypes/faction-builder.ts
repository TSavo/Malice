import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Faction prototype
 * A creatable object representing a faction in the game world.
 *
 * Each faction has:
 * - name: Faction display name (e.g., 'Gray Cartel')
 * - domain: Web domain for faction (e.g., 'graycartel.com')
 * - charGen: Reference to chargen object for new players
 * - description: Faction description
 * - leader: Reference to faction leader entity
 * - sshHostKey: Per-faction SSH host key (auto-generated)
 * - ports: Allocated port bundle {http, ws, telnet, ssh, sessionMcp}
 *
 * Usage:
 *   const faction = await $recycler.create($faction, {
 *     name: 'Gray Cartel',
 *     domain: 'graycartel.com',
 *     charGen: $cartelCharGen,
 *     description: 'Underground resistance network'
 *   });
 *
 * Network transports are managed by $factionManager.create() which
 * creates the faction object AND spins up its transport bundle.
 */
export class FactionBuilder implements Builder {
  static provides = ['faction'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('faction');
    if (existing) {
      this.obj = existing;
    } else {
      const parent = await this.manager.load('describable');
      if (!parent) throw new Error('FactionBuilder: Parent type \'describable\' not found');

      this.obj = await this.manager.define('faction', parent, {
        properties: {
          name: 'Faction',
          description: 'A faction in the game world.',
          // Faction-specific properties
          domain: null, // Web domain (e.g., 'graycartel.com')
          charGen: null, // Objref to chargen object
          leader: null, // Objref to faction leader
          sshHostKey: null, // Per-faction SSH host key
          ports: null, // {http, ws, telnet, ssh, sessionMcp}
          index: null, // Faction index for port allocation
          discordWebhook: null, // Discord webhook for registration tickets

          abilities: `A faction is an organization in the game world.

IDENTITY: 'name' is display name. 'description' explains the faction. 'domain' is web address.

LEADERSHIP: 'leader' is objref to faction leader entity.

CHARACTER CREATION: 'charGen' is objref to chargen handler. New players joining this faction go through faction.charGen.onNewUser().

NETWORK: 'ports' contains allocated ports {http, ws, telnet, ssh, sessionMcp}. 'sshHostKey' is per-faction SSH key.

MEMBERSHIP: Use $factionManager.setMembership(entity, faction) to add members. $factionManager.getMembers(faction) lists members.

LIFECYCLE: Created via $factionManager.create(), destroyed via $factionManager.destroy(). This handles transport spinup/spindown.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!

    obj.setMethod(
      'describe',
      `
      /** Get a description of this faction.
       *  @returns Description string with name and member count
       */
      const members = await $factionManager.getMembers(self);
      const memberCount = members ? members.length : 0;
      const leaderName = self.leader ? self.leader.name : 'none';

      let desc = self.name;
      if (self.description) {
        desc += ' - ' + self.description;
      }
      desc += '\\nLeader: ' + leaderName;
      desc += '\\nMembers: ' + memberCount;
      if (self.domain) {
        desc += '\\nDomain: ' + self.domain;
      }
      return desc;
    `,
    );

    obj.setMethod(
      'getPortInfo',
      `
      /** Get port allocation info for this faction.
       *  @returns Object with port numbers or null if not allocated
       */
      return self.ports || null;
    `,
    );

    obj.setMethod(
      'isOnline',
      `
      /** Check if this faction's transports are running.
       *  @returns true if transport bundle is active
       */
      if (!self.ports) return false;
      // Check with $transports registry
      const info = await $transports?.get(self.id);
      return info !== null && info !== undefined;
    `,
    );

    obj.setMethod(
      'onPlayerRegistered',
      `
      /** Called when a new player registers with this faction.
       *  Sends verification email and creates Discord ticket.
       *  Override in specific faction instances for custom branding.
       *  @param player - The newly created player object
       */
      const player = args[0];
      if (!player) return;

      const verifyUrl = 'https://' + self.domain + '/verify?t=' + player.verificationToken;

      // Send verification email
      try {
        await $email.send({
          to: player.email,
          subject: 'Verify your ' + self.name + ' account',
          html: '<div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">'
            + '<h1 style="color: #00ff88;">Welcome to ' + self.name + '</h1>'
            + '<p>Hello <strong>' + player.playername + '</strong>,</p>'
            + '<p>Click the button below to verify your email address:</p>'
            + '<p><a href="' + verifyUrl + '" style="display: inline-block; padding: 12px 24px; background: #00ff88; color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a></p>'
            + '<p style="color: #888; font-size: 12px;">Or copy this link: ' + verifyUrl + '</p>'
            + '</div>',
          faction: self
        });
        console.log('[Faction] Verification email sent to ' + player.email);
      } catch (err) {
        console.error('[Faction] Failed to send verification email:', err);
      }

      // Send Discord notification if webhook configured
      if (self.discordWebhook) {
        try {
          await $http.post(self.discordWebhook, {
            content: null,
            embeds: [{
              title: '📧 New Registration',
              color: 0x00ff88,
              fields: [
                { name: 'Username', value: player.playername, inline: true },
                { name: 'Email', value: player.email, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          });
          console.log('[Faction] Discord notification sent for ' + player.playername);
        } catch (err) {
          console.error('[Faction] Failed to send Discord notification:', err);
        }
      }
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'domain',
      'Web domain for this faction (e.g., graycartel.com). Used for HTTP Host routing.',
    );
    obj.setPropertyDescription(
      'charGen',
      'Objref to chargen handler. New players call faction.charGen.onNewUser(context, username, password).',
    );
    obj.setPropertyDescription(
      'leader',
      'Objref to the faction leader entity.',
    );
    obj.setPropertyDescription(
      'sshHostKey',
      'Per-faction SSH host key. Auto-generated on first transport spinup, persisted for consistency.',
    );
    obj.setPropertyDescription(
      'ports',
      'Allocated port bundle: {http, ws, telnet, ssh, sessionMcp}. Set by $transports.create().',
    );
    obj.setPropertyDescription(
      'index',
      'Faction index used for port allocation. Lower indices get lower port numbers.',
    );
    obj.setPropertyDescription(
      'discordWebhook',
      'Discord webhook URL for registration notifications. Set to receive alerts when new players register.',
    );
  }

  async registerAliases(): Promise<void> {
    console.log('[FactionBuilder] Type \'faction\' auto-aliased');
  }
}

// Self-register
registerBuilder(FactionBuilder);
