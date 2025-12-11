import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Room prototype
 * Base prototype for rooms with exits and crowd mechanics.
 *
 * Spatial coordinates (integer only):
 * - x, y, z: Position in world space (meters)
 * - Rooms MUST have coordinates to be spatially related
 * - Exit distances can be computed from coordinates if not specified
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
        // Spatial coordinates (integers, in meters)
        x: 0,
        y: 0,
        z: 0, // Vertical: negative = underground, positive = above ground
        // Array of Exit object IDs
        // Each Exit has: name, aliases, destRoom, distance, hidden, locked
        exits: [],
        // Crowd mechanics
        population: 0, // Artificial crowd level (0-100)
        ambientNoise: 0, // Base noise level (0-100)
        // Lighting (affects vision)
        lighting: 100, // 0=pitch black, 50=dim, 100=well-lit
        // Water level (affects breathing)
        waterLevel: 0, // 0=dry, 50=waist-deep, 100=fully submerged
        // Environment
        outdoor: true, // Is this room outdoors? (affects weather, natural light)
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0]; // Agent viewing this room

      // Show room name and description
      let output = \`\${self.name}\\r\\n\${self.description}\\r\\n\`;

      // Show water level if any
      const waterDesc = await self.getWaterDescription();
      if (waterDesc) {
        output += \`\\r\\n\${waterDesc}\\r\\n\`;
      }

      // Show crowd/atmosphere description if notable
      const crowdDesc = await self.getCrowdDescription();
      if (crowdDesc && crowdDesc !== 'The area is quiet and empty.') {
        output += \`\\r\\n\${crowdDesc}\\r\\n\`;
      }

      // Show exits (only non-hidden ones)
      const exitIds = self.exits || [];
      const visibleExits = [];
      for (const exitId of exitIds) {
        const exit = await $.load(exitId);
        if (exit && !exit.hidden) {
          const desc = exit.describe ? await exit.describe() : exit.name;
          visibleExits.push(desc);
        }
      }
      if (visibleExits.length > 0) {
        output += \`\\r\\nObvious exits: \${visibleExits.join(', ')}\\r\\n\`;
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
      /** Add an exit to this room.
       *  @param exit - Exit object (ID or RuntimeObject)
       */
      const exitArg = args[0];
      const exitId = typeof exitArg === 'number' ? exitArg : exitArg?.id;

      if (!exitId) return;

      const exits = self.exits || [];
      if (!exits.includes(exitId)) {
        exits.push(exitId);
        self.exits = exits;
      }
    `);

    obj.setMethod('removeExit', `
      /** Remove an exit from this room.
       *  @param exit - Exit object (ID or RuntimeObject) or direction name
       */
      const exitArg = args[0];
      const exits = self.exits || [];

      if (typeof exitArg === 'string') {
        // Find exit by direction name
        for (let i = 0; i < exits.length; i++) {
          const exit = await $.load(exits[i]);
          if (exit && exit.matches && await exit.matches(exitArg)) {
            exits.splice(i, 1);
            self.exits = exits;
            return;
          }
        }
      } else {
        // Remove by ID
        const exitId = typeof exitArg === 'number' ? exitArg : exitArg?.id;
        const idx = exits.indexOf(exitId);
        if (idx >= 0) {
          exits.splice(idx, 1);
          self.exits = exits;
        }
      }
    `);

    obj.setMethod('findExit', `
      /** Find an exit by direction name (matches name or aliases).
       *  @param direction - Direction to search for (e.g., 'n', 'north')
       *  @returns The matching Exit object or null
       */
      const direction = args[0]?.toLowerCase();
      if (!direction) return null;

      const exits = self.exits || [];
      for (const exitId of exits) {
        const exit = await $.load(exitId);
        if (exit && exit.matches && await exit.matches(direction)) {
          return exit;
        }
      }
      return null;
    `);

    obj.setMethod('getExits', `
      /** Get all exit objects.
       *  @returns Array of Exit RuntimeObjects
       */
      const exitIds = self.exits || [];
      const exits = [];
      for (const exitId of exitIds) {
        const exit = await $.load(exitId);
        if (exit) exits.push(exit);
      }
      return exits;
    `);

    // Coordinate methods
    obj.setMethod('getCoordinates', `
      /** Get this room's spatial coordinates.
       *  @returns { x, y, z } integer coordinates in meters
       */
      return {
        x: self.x || 0,
        y: self.y || 0,
        z: self.z || 0,
      };
    `);

    obj.setMethod('setCoordinates', `
      /** Set this room's spatial coordinates.
       *  @param x - X coordinate (integer)
       *  @param y - Y coordinate (integer)
       *  @param z - Z coordinate (integer, optional)
       */
      const x = args[0];
      const y = args[1];
      const z = args[2] !== undefined ? args[2] : (self.z || 0);

      // Enforce integers
      self.x = Math.round(x);
      self.y = Math.round(y);
      self.z = Math.round(z);
    `);

    obj.setMethod('distanceTo', `
      /** Calculate 3D distance to another room.
       *  @param otherRoom - Room ID or RuntimeObject
       *  @returns Distance in meters (integer), or null if room not found
       */
      const otherRoomArg = args[0];
      const otherId = typeof otherRoomArg === 'number' ? otherRoomArg : otherRoomArg?.id;

      if (!otherId) return null;

      const other = typeof otherRoomArg === 'number' ? await $.load(otherId) : otherRoomArg;
      if (!other) return null;

      const dx = (other.x || 0) - (self.x || 0);
      const dy = (other.y || 0) - (self.y || 0);
      const dz = (other.z || 0) - (self.z || 0);

      // Euclidean distance, rounded to integer
      return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
    `);

    obj.setMethod('directionTo', `
      /** Get compass direction to another room.
       *  @param otherRoom - Room ID or RuntimeObject
       *  @returns Direction string (n, s, e, w, ne, nw, se, sw, up, down) or null
       */
      const otherRoomArg = args[0];
      const otherId = typeof otherRoomArg === 'number' ? otherRoomArg : otherRoomArg?.id;

      if (!otherId) return null;

      const other = typeof otherRoomArg === 'number' ? await $.load(otherId) : otherRoomArg;
      if (!other) return null;

      const dx = (other.x || 0) - (self.x || 0);
      const dy = (other.y || 0) - (self.y || 0);
      const dz = (other.z || 0) - (self.z || 0);

      // Check vertical first
      if (Math.abs(dz) > Math.abs(dx) && Math.abs(dz) > Math.abs(dy)) {
        return dz > 0 ? 'up' : 'down';
      }

      // Determine horizontal direction
      let dir = '';
      if (dy > 0) dir += 'n';
      else if (dy < 0) dir += 's';

      if (dx > 0) dir += 'e';
      else if (dx < 0) dir += 'w';

      return dir || null;
    `);

    // The 'go' verb - used by exit directions
    // Pattern is just the direction word like 'north', 'south'
    // Queues movement instead of instant teleportation
    obj.setMethod('go', `
      /** Move in a direction. Queues movement based on distance.
       *  Uses player's current movement mode (walk/run).
       *  Distance is taken from exit, or computed from room coordinates.
       */
      // The direction is embedded in the command - extract first word
      const direction = command.trim().toLowerCase().split(/\\s+/)[0];

      // Find matching exit
      const exit = await self.findExit(direction);
      if (!exit) {
        return \`You can't go \${direction} from here.\`;
      }

      // Check if exit can be used (locked, etc.)
      if (exit.canUse) {
        const check = await exit.canUse(player);
        if (!check.allowed) {
          return check.reason;
        }
      }

      const destRoom = exit.destRoom;

      // Get distance: explicit on exit, or compute from coordinates
      let distance = exit.distance;
      if (!distance && destRoom) {
        distance = await self.distanceTo(destRoom);
      }
      // Fallback to 10m if no coordinates set
      distance = distance || 10;

      // Check if player is already moving
      if (player.isMoving && await player.isMoving()) {
        return 'You are already moving. Use "stop" to cancel.';
      }

      // Queue the movement
      if (player.startMovement) {
        const result = await player.startMovement(destRoom, distance, exit.name);
        return result.message;
      }

      // Fallback: instant movement if no queue system
      await player.moveTo(destRoom, player);
      const dest = await $.load(destRoom);
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

      // Register each exit's name and aliases as verbs
      const exitIds = self.exits || [];
      for (const exitId of exitIds) {
        const exit = await $.load(exitId);
        if (!exit) continue;

        // Register primary name
        await obj.registerVerb(exit.name.toLowerCase(), self, 'go');

        // Register aliases
        const aliases = exit.aliases || [];
        for (const alias of aliases) {
          await obj.registerVerb(alias.toLowerCase(), self, 'go');
        }
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

    // Get water level description
    obj.setMethod('getWaterDescription', `
      /** Get a text description of the room's water level.
       *  @returns Description string or empty if dry
       */
      const waterLevel = self.waterLevel || 0;

      if (waterLevel <= 0) {
        return '';
      } else if (waterLevel <= 10) {
        return 'Shallow water covers the floor.';
      } else if (waterLevel <= 30) {
        return 'Water rises to knee level.';
      } else if (waterLevel <= 50) {
        return 'Water reaches waist-deep here.';
      } else if (waterLevel <= 70) {
        return 'Water rises to chest level.';
      } else if (waterLevel <= 90) {
        return 'Water nearly reaches the ceiling.';
      } else {
        return 'This area is completely submerged underwater.';
      }
    `);

    // Check if an agent at a given height would be submerged
    obj.setMethod('isSubmerged', `
      /** Check if an agent of given height would have their head underwater.
       *  @param agentHeight - Height of the agent in cm (default 170)
       *  @returns boolean - true if head would be underwater
       */
      const agentHeight = args[0] || 170; // Default human height
      const waterLevel = self.waterLevel || 0;

      // Water level 100 = 3 meters deep (300cm)
      // Agent is submerged if water exceeds their height
      const waterDepthCm = (waterLevel / 100) * 300;
      return waterDepthCm >= agentHeight;
    `);

    // Get water depth in cm
    obj.setMethod('getWaterDepth', `
      /** Get water depth in centimeters.
       *  @returns Depth in cm (0-300)
       */
      const waterLevel = self.waterLevel || 0;
      return (waterLevel / 100) * 300;
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
