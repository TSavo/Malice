import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Faction prototype
 * Singleton manager for faction memberships and relationships
 *
 * Tracks:
 * - Which entities belong to which factions
 * - Relationships between factions (friendly, hostile, neutral)
 *
 * Usage:
 *   await $.faction.setFaction(entity, 'Continuum')
 *   await $.faction.setRelationship('Continuum', 'Scavengers', 'hostile')
 *   const friendly = await $.faction.isFriendly(entityA, entityB)
 */
export class FactionBuilder {
  constructor(private manager: ObjectManager) {}

  async build(rootId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: rootId,
      properties: {
        name: 'Faction Manager',
        description: 'Manages faction memberships and inter-faction relationships.',
        // Map of factionName -> { members: [entityIds], description, leader }
        factions: {},
        // Map of "factionA:factionB" -> relationship ('friendly', 'hostile', 'neutral')
        // Relationships are bidirectional - stored once with sorted key
        relationships: {},
        // Map of entityId -> factionName for quick lookup
        memberships: {},
      },
      methods: {},
    });

    // Create a new faction
    obj.setMethod('createFaction', `
      const name = args[0];
      const description = args[1] || '';

      if (!name || typeof name !== 'string') {
        return { success: false, error: 'Faction name required.' };
      }

      const factions = self.factions || {};
      if (factions[name]) {
        return { success: false, error: 'Faction already exists.' };
      }

      factions[name] = {
        members: [],
        description,
        leader: null,
        created: Date.now(),
      };
      self.factions = factions;

      return { success: true, faction: name };
    `);

    // Get faction info
    obj.setMethod('getFactionInfo', `
      const name = args[0];
      const factions = self.factions || {};
      return factions[name] || null;
    `);

    // List all factions
    obj.setMethod('listFactions', `
      const factions = self.factions || {};
      return Object.keys(factions);
    `);

    // Set an entity's faction membership
    obj.setMethod('setFaction', `
      const entity = args[0];
      const factionName = args[1];

      if (!entity) return { success: false, error: 'Entity required.' };

      const entityId = typeof entity === 'number' ? entity : entity.id;
      if (!entityId) return { success: false, error: 'Invalid entity.' };

      const factions = self.factions || {};
      const memberships = self.memberships || {};

      // Remove from old faction if any
      const oldFaction = memberships[entityId];
      if (oldFaction && factions[oldFaction]) {
        factions[oldFaction].members = factions[oldFaction].members.filter(id => id !== entityId);
      }

      // Add to new faction (or clear if null)
      if (factionName) {
        if (!factions[factionName]) {
          // Auto-create faction if it doesn't exist
          factions[factionName] = { members: [], description: '', leader: null, created: Date.now() };
        }
        if (!factions[factionName].members.includes(entityId)) {
          factions[factionName].members.push(entityId);
        }
        memberships[entityId] = factionName;
      } else {
        delete memberships[entityId];
      }

      self.factions = factions;
      self.memberships = memberships;

      return { success: true, faction: factionName };
    `);

    // Get an entity's faction
    obj.setMethod('getFaction', `
      const entity = args[0];
      if (!entity) return null;

      const entityId = typeof entity === 'number' ? entity : entity.id;
      if (!entityId) return null;

      const memberships = self.memberships || {};
      return memberships[entityId] || null;
    `);

    // Set relationship between two factions
    obj.setMethod('setRelationship', `
      const factionA = args[0];
      const factionB = args[1];
      const relationship = args[2]; // 'friendly', 'hostile', 'neutral'

      if (!factionA || !factionB) {
        return { success: false, error: 'Two faction names required.' };
      }

      if (!['friendly', 'hostile', 'neutral'].includes(relationship)) {
        return { success: false, error: 'Relationship must be friendly, hostile, or neutral.' };
      }

      // Create sorted key for bidirectional lookup
      const key = [factionA, factionB].sort().join(':');

      const relationships = self.relationships || {};

      if (relationship === 'neutral') {
        delete relationships[key];
      } else {
        relationships[key] = relationship;
      }

      self.relationships = relationships;

      return { success: true, relationship };
    `);

    // Get relationship between two factions
    obj.setMethod('getRelationship', `
      const factionA = args[0];
      const factionB = args[1];

      if (!factionA || !factionB) return 'neutral';
      if (factionA === factionB) return 'friendly'; // Same faction = friendly

      const key = [factionA, factionB].sort().join(':');
      const relationships = self.relationships || {};

      return relationships[key] || 'neutral';
    `);

    // Check if two entities are friendly (same faction or allied factions)
    obj.setMethod('isFriendly', `
      const entityA = args[0];
      const entityB = args[1];

      if (!entityA || !entityB) return false;

      const idA = typeof entityA === 'number' ? entityA : entityA.id;
      const idB = typeof entityB === 'number' ? entityB : entityB.id;

      if (idA === idB) return true; // Same entity

      const memberships = self.memberships || {};
      const factionA = memberships[idA];
      const factionB = memberships[idB];

      // No faction = neutral to everyone
      if (!factionA || !factionB) return false;

      // Same faction = friendly
      if (factionA === factionB) return true;

      // Check faction relationship
      const relationship = await self.getRelationship(factionA, factionB);
      return relationship === 'friendly';
    `);

    // Check if two entities are hostile
    obj.setMethod('isHostile', `
      const entityA = args[0];
      const entityB = args[1];

      if (!entityA || !entityB) return false;

      const idA = typeof entityA === 'number' ? entityA : entityA.id;
      const idB = typeof entityB === 'number' ? entityB : entityB.id;

      if (idA === idB) return false; // Can't be hostile to self

      const memberships = self.memberships || {};
      const factionA = memberships[idA];
      const factionB = memberships[idB];

      // No faction = neutral
      if (!factionA || !factionB) return false;

      // Same faction = not hostile
      if (factionA === factionB) return false;

      // Check faction relationship
      const relationship = await self.getRelationship(factionA, factionB);
      return relationship === 'hostile';
    `);

    // Get all members of a faction
    obj.setMethod('getMembers', `
      const factionName = args[0];
      if (!factionName) return [];

      const factions = self.factions || {};
      const faction = factions[factionName];

      return faction ? [...faction.members] : [];
    `);

    // Set faction leader
    obj.setMethod('setLeader', `
      const factionName = args[0];
      const entity = args[1];

      if (!factionName) return { success: false, error: 'Faction name required.' };

      const factions = self.factions || {};
      if (!factions[factionName]) {
        return { success: false, error: 'Faction does not exist.' };
      }

      const entityId = entity ? (typeof entity === 'number' ? entity : entity.id) : null;
      factions[factionName].leader = entityId;
      self.factions = factions;

      return { success: true };
    `);

    // Get faction leader
    obj.setMethod('getLeader', `
      const factionName = args[0];
      if (!factionName) return null;

      const factions = self.factions || {};
      const faction = factions[factionName];

      return faction ? faction.leader : null;
    `);

    return obj;
  }
}
