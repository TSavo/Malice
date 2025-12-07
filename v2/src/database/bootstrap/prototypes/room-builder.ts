import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Room prototype
 * Base prototype for rooms with exits and crowd mechanics.
 *
 * Crowding affects perception:
 * - population: artificial crowd (NPCs, busy streets) 0-100
 * - Actual agents in room add to effective crowd
 * - Higher crowd = harder to perceive people you're not watching
 * - ambientNoise: base noise level 0-100 (affects hearing)
 *
 * Crowd levels:
 * - 0-10: Empty/quiet (easy perception)
 * - 11-30: Light crowd (some interference)
 * - 31-60: Moderate crowd (need to watch to see/hear clearly)
 * - 61-80: Heavy crowd (hard to perceive non-watched people)
 * - 81-100: Packed (can barely perceive anyone not watched)
 */
export class RoomBuilder {
  constructor(private manager: ObjectManager) {}

  async build(locationId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: locationId,
      properties: {
        name: 'Room',
        description: 'Base prototype for rooms',
        exits: {}, // Map of direction -> destination room ID
        // Crowd mechanics
        population: 0, // Artificial crowd level (0-100)
        ambientNoise: 0, // Base noise level (0-100)
        // Lighting (affects vision)
        lighting: 100, // 0=pitch black, 50=dim, 100=well-lit
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0]; // Agent viewing this room

      // Show room name and description
      let output = \`\${self.name}\\r\\n\${self.description}\\r\\n\`;

      // Show exits
      const exits = self.exits || {};
      const exitNames = Object.keys(exits);
      if (exitNames.length > 0) {
        output += \`\\r\\nObvious exits: \${exitNames.join(', ')}\\r\\n\`;
      } else {
        output += '\\r\\nThere are no obvious exits.\\r\\n';
      }

      // Show contents (agents/objects in room), excluding the viewer
      const contents = self.contents || [];
      const others = contents.filter(id => id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const objId of others) {
          const obj = await $.load(objId);
          if (obj) {
            const shortDesc = await obj.shortDesc();
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      return output;
    `);

    obj.setMethod('addExit', `
      const direction = args[0];
      const destId = args[1];
      const exits = self.exits || {};
      exits[direction] = destId;
      self.exits = exits;
    `);

    obj.setMethod('removeExit', `
      const direction = args[0];
      const exits = self.exits || {};
      delete exits[direction];
      self.exits = exits;
    `);

    // The 'go' verb - used by exit directions
    // Pattern is just the direction word like 'north', 'south'
    // args[3] = direction string (from %s in pattern, but we store it as literal)
    obj.setMethod('go', `
      // The direction is embedded in the command - extract first word
      const direction = command.trim().toLowerCase().split(/\\s+/)[0];

      const exits = self.exits || {};
      const destId = exits[direction];

      if (!destId) {
        return \`You can't go \${direction} from here.\`;
      }

      // Move player to destination (triggers all hooks)
      await player.moveTo(destId, player);

      // Show new room
      const dest = await $.load(destId);
      if (dest) {
        return await dest.describe(player);
      }
    `);

    // Override: when an agent arrives, register exit verbs
    obj.setMethod('onContentArrived', `
      const obj = args[0];
      const source = args[1];
      const mover = args[2];

      // Only register verbs for agents (things with registerVerb)
      if (!obj.registerVerb) return;

      // Register each exit direction as a verb (simple pattern, just the word)
      const exits = self.exits || {};
      for (const direction of Object.keys(exits)) {
        await obj.registerVerb(direction, self, 'go');
      }

      // TODO: Announce arrival to others in room
    `);

    // Override: when an agent leaves, unregister exit verbs and notify others
    obj.setMethod('onContentLeft', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];

      // Only unregister verbs for agents
      if (obj.unregisterVerbsFrom) {
        // Unregister all verbs this room provided
        await obj.unregisterVerbsFrom(self.id);
      }

      // Notify other agents in the room that this person left
      // They should remove them from watch lists, etc.
      const contents = self.contents || [];
      for (const id of contents) {
        if (id === obj.id) continue; // Skip the one who left
        const other = await $.load(id);
        if (other && other.onOtherLeft) {
          await other.onOtherLeft(obj);
        }
      }

      // TODO: Announce departure to others in room
    `);

    // Rooms can contain things
    obj.setMethod('canContain', `
      const obj = args[0];
      return true;
    `);

    // Get effective crowd level (population + actual agents)
    obj.setMethod('getCrowdLevel', `
      /** Calculate effective crowd level (0-100+).
       *  Combines artificial population with actual agents in room.
       *  Each agent adds ~5 to crowd level.
       *  @returns Effective crowd level
       */
      const population = self.population || 0;
      const contents = self.contents || [];

      // Count agents (objects with canSee/canHear methods)
      let agentCount = 0;
      for (const id of contents) {
        const obj = await $.load(id);
        if (obj && (obj.canSee || obj.canHear)) {
          agentCount++;
        }
      }

      // Each agent adds 5 to crowd level
      return Math.min(100, population + (agentCount * 5));
    `);

    // Get effective noise level
    obj.setMethod('getNoiseLevel', `
      /** Calculate effective noise level (0-100).
       *  Combines ambient noise with crowd noise.
       *  @returns Effective noise level
       */
      const ambient = self.ambientNoise || 0;
      const crowdLevel = await self.getCrowdLevel();

      // Crowd adds noise (50% of crowd level)
      const crowdNoise = crowdLevel * 0.5;

      return Math.min(100, ambient + crowdNoise);
    `);

    // Check if viewer can perceive target in this room
    // Returns { canSee: bool, canHear: bool, visualClarity: 0-100, audioClarity: 0-100 }
    obj.setMethod('getPerception', `
      /** Check how well viewer can perceive target in this room.
       *  Factors: crowd level, lighting, viewer's sensory ability, whether target is watched.
       *  Viewer's canSee/canHear return { max, percent } where:
       *    - max = trained capacity (higher = better potential)
       *    - percent = current function (100 = fully rested)
       *  @param viewer - The person trying to perceive
       *  @param target - The person/object being perceived
       *  @returns {canSee, canHear, visualClarity, audioClarity}
       */
      const viewer = args[0];
      const target = args[1];

      if (!viewer || !target) {
        return { canSee: false, canHear: false, visualClarity: 0, audioClarity: 0 };
      }

      const crowdLevel = await self.getCrowdLevel();
      const noiseLevel = await self.getNoiseLevel();
      const lighting = self.lighting || 100;

      // Get viewer's sensory capabilities { max, percent }
      const visionStats = viewer.canSee ? await viewer.canSee() : { max: 100, percent: 100 };
      const hearingStats = viewer.canHear ? await viewer.canHear() : { max: 100, percent: 100 };

      // Effective sensory quality: max determines potential, percent is current capacity
      // Scale to 0-1 where 100 max at 100% = 1.0
      const visionQuality = (visionStats.max / 100) * (visionStats.percent / 100);
      const hearingQuality = (hearingStats.max / 100) * (hearingStats.percent / 100);

      // Check if viewer is watching target
      const watchList = viewer.watchList || [];
      const isWatching = watchList.includes(target.id);

      // Base clarity starts at 100, reduced by crowd/noise/darkness
      // Watching someone gives +50 clarity bonus
      const watchBonus = isWatching ? 50 : 0;

      // Visual clarity: affected by crowd, lighting, and viewer's vision quality
      // High vision max allows seeing through crowds better
      // Current percent affects sharpness
      let visualClarity = 100 - (crowdLevel * 0.7) + watchBonus;
      visualClarity = visualClarity * (lighting / 100); // Scale by lighting
      visualClarity = visualClarity * visionQuality; // Scale by viewer's vision
      visualClarity = Math.max(0, Math.min(100, visualClarity));

      // Audio clarity: affected by noise level and viewer's hearing quality
      let audioClarity = 100 - (noiseLevel * 0.8) + watchBonus;
      audioClarity = audioClarity * hearingQuality; // Scale by viewer's hearing
      audioClarity = Math.max(0, Math.min(100, audioClarity));

      const canSee = visionStats.max > 0 && visualClarity > 10;
      const canHear = hearingStats.max > 0 && audioClarity > 10;

      return {
        canSee,
        canHear,
        visualClarity: canSee ? visualClarity : 0,
        audioClarity: canHear ? audioClarity : 0,
        isWatching,
        crowdLevel,
        noiseLevel,
        lighting,
        // Include viewer's sensory stats for debugging/display
        visionStats,
        hearingStats,
      };
    `);

    // Get a description of the crowd/atmosphere
    obj.setMethod('getCrowdDescription', `
      /** Get a text description of the room's crowd level.
       *  @returns Description string
       */
      const crowdLevel = await self.getCrowdLevel();
      const noiseLevel = await self.getNoiseLevel();

      let desc = '';

      // Crowd description
      if (crowdLevel <= 10) {
        desc = 'The area is quiet and empty.';
      } else if (crowdLevel <= 30) {
        desc = 'A few people mill about.';
      } else if (crowdLevel <= 60) {
        desc = 'The area is moderately crowded.';
      } else if (crowdLevel <= 80) {
        desc = 'The crowd is thick and pressing.';
      } else {
        desc = 'The area is packed with people.';
      }

      // Noise description
      if (noiseLevel > 70) {
        desc += ' The noise is deafening.';
      } else if (noiseLevel > 50) {
        desc += ' A constant din fills the air.';
      } else if (noiseLevel > 30) {
        desc += ' A murmur of conversation drifts through.';
      }

      return desc;
    `);

    return obj;
  }
}
