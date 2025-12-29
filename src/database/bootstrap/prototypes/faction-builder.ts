import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

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
export class FactionBuilder {
  static readonly alias = 'faction';
  static readonly parent = 'describable';

  constructor(private manager: ObjectManager) {}

  async build(
    describableId: number,
    existingObj?: RuntimeObject,
  ): Promise<RuntimeObject> {
    const obj =
      existingObj ??
      (await this.manager.create({
        parent: (await this.manager.load(describableId))!,
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

          abilities: `A faction is an organization in the game world.

IDENTITY: 'name' is display name. 'description' explains the faction. 'domain' is web address.

LEADERSHIP: 'leader' is objref to faction leader entity.

CHARACTER CREATION: 'charGen' is objref to chargen handler. New players joining this faction go through faction.charGen.onNewUser().

NETWORK: 'ports' contains allocated ports {http, ws, telnet, ssh, sessionMcp}. 'sshHostKey' is per-faction SSH key.

MEMBERSHIP: Use $factionManager.setMembership(entity, faction) to add members. $factionManager.getMembers(faction) lists members.

LIFECYCLE: Created via $factionManager.create(), destroyed via $factionManager.destroy(). This handles transport spinup/spindown.`,
        },
        methods: {},
      }));

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

    return obj;
  }
}
