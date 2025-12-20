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

  /**
   * Build the Room prototype or rebuild methods on existing object
   * @param locationId - Parent location ID (only used when creating new)
   * @param existingObj - Optional existing object to rebuild methods on
   */
  async build(locationId: number, existingObj?: RuntimeObject): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(locationId);
    const obj = existingObj || await this.manager.create({
      parent: parentObj!,
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
        // Sittable locations in the room
        // Each entry: { name, capacity, occupied: [] }
        // e.g., { name: 'a wooden chair', capacity: 1, occupied: [] }
        // e.g., { name: 'a long bench', capacity: 4, occupied: [] }
        sittables: [],
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

      // Show sittables if any
      const sittables = self.sittables || [];
      if (sittables.length > 0) {
        output += '\\r\\n';
        for (const sittable of sittables) {
          const occupied = sittable.occupied || [];
          if (occupied.length === 0) {
            output += sittable.emptyMsg + '\\r\\n';
          } else {
            // Get names of people sitting
            const sitters = [];
            for (const sitter of occupied) {
              if (sitter) {
                sitters.push(sitter.name);
              }
            }
            const sitterList = await $.format.prose(sitters);
            const verb = sitters.length === 1 ? 'is' : 'are';
            const msg = sittable.occupiedMsg.replace('%s', sitterList + ' ' + verb);
            output += msg + '\\r\\n';
          }
        }
      }

      // Show exits (only non-hidden ones)
      const exits = self.exits || [];
      const visibleExits = [];
      for (let exitId of exits) {
        // Load exit object if it's just an ID
        let exit = exitId;
        if (typeof exitId === 'number') {
          exit = await $load(exitId);
        }
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
      const others = contents.filter(item => item !== viewer);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const obj of others) {
          if (obj) {
            // Handle both RuntimeObjects and legacy raw IDs
            let shortDesc;
            if (typeof obj.shortDesc === 'function') {
              shortDesc = await obj.shortDesc();
            } else {
              shortDesc = obj.name || 'something';
            }
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      // Apply viewer's perception filters
      if (viewer && viewer.perceptionFilters) {
        const filters = viewer.perceptionFilters || [];
        for (const entry of filters) {
          const filter = entry.filter;
          if (filter && filter.modifyRoomDescription) {
            output = await filter.modifyRoomDescription(output, self, viewer);
          }
        }
      }

      return output;
    `);

    obj.setMethod('addExit', `
      /** Add an exit to this room.
       *  @param exit - Exit object
       */
      const exit = args[0];
      if (!exit) return;

      const exits = self.exits || [];
      const alreadyPresent = exits.some(e => e === exit);
      if (!alreadyPresent) {
        exits.push(exit);
        self.exits = exits;
      }
    `);

    obj.setMethod('removeExit', `
      /** Remove an exit from this room.
       *  @param exit - Exit object or direction name
       */
      const exitArg = args[0];
      const exits = self.exits || [];

      if (typeof exitArg === 'string') {
        // Find exit by direction name
        for (let i = 0; i < exits.length; i++) {
          const exit = exits[i];
          if (exit && exit.matches && await exit.matches(exitArg)) {
            exits.splice(i, 1);
            self.exits = exits;
            return;
          }
        }
      } else {
        // Remove by object
        const exitId = exitArg?.id;
        const idx = exits.findIndex(e => e === exitArg);
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
      for (const exit of exits) {
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
      return (self.exits || []).filter(e => e);
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
       *  @param otherRoom - Room RuntimeObject
       *  @returns Distance in meters (integer), or null if room not found
       */
      const other = args[0];
      if (!other) return null;

      const dx = (other.x || 0) - (self.x || 0);
      const dy = (other.y || 0) - (self.y || 0);
      const dz = (other.z || 0) - (self.z || 0);

      // Euclidean distance, rounded to integer
      return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
    `);

    obj.setMethod('directionTo', `
      /** Get compass direction to another room.
       *  @param otherRoom - Room RuntimeObject
       *  @returns Direction string (n, s, e, w, ne, nw, se, sw, up, down) or null
       */
      const other = args[0];
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
      // Check if blocked by non-movement exclusions (sitting, fighting, etc.)
      // Note: walking while walking is allowed (queues movement)
      const currentActions = await $.exclusions.current(player);
      for (const actionInfo of currentActions) {
        if (actionInfo.action !== 'walk' && actionInfo.action !== 'run') {
          const exclusions = await $.exclusions.get(actionInfo.action);
          if (exclusions.includes('walk') || exclusions.includes('run')) {
            // Return the message from the active action
            if (typeof actionInfo.data === 'string') {
              return actionInfo.data;
            }
            return \`You can't do that while \${actionInfo.action}.\`;
          }
        }
      }

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
      if (destRoom) {
        return await destRoom.describe(player);
      }
    `);

    // Override: when an agent arrives, register exit verbs and sit verb
    obj.setMethod('onContentArrived', `
      const obj = args[0];
      const source = args[1];
      const mover = args[2];

      // Only register verbs for agents (things with registerVerb)
      if (!obj.registerVerb) return;

      // Register each exit's name and aliases as verbs
      const exits = self.exits || [];
      for (const exit of exits) {
        if (!exit || !exit.name) continue;

        // Register primary name
        await obj.registerVerb(exit.name.toLowerCase(), self, 'go');

        // Register aliases
        const aliases = exit.aliases || [];
        for (const alias of aliases) {
          await obj.registerVerb(alias.toLowerCase(), self, 'go');
        }
      }

      // Register 'sit' verb if there are sittables
      const sittables = self.sittables || [];
      if (sittables.length > 0) {
        await obj.registerVerb('sit', self, 'sit');
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
      for (const other of contents) {
        if (!other || other === obj) continue; // Skip the one who left
        if (other.onOtherLeft) {
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
      for (const obj of contents) {
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
      const isWatching = watchList.some(w => w === target);

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

    // Add a sittable location to the room
    obj.setMethod('addSittable', `
      /** Add a sittable location to the room.
       *  @param name - Name of the sittable (e.g., "a wooden chair")
       *  @param capacity - How many people can sit here (default: 1)
       *  @param emptyMsg - Message when empty (e.g., "A wooden desk sits behind the counter.")
       *  @param occupiedMsg - Template for occupied (e.g., "%s sitting behind a wooden desk")
       */
      const name = args[0];
      const capacity = args[1] || 1;
      const emptyMsg = args[2] || name + ' sits here.';
      const occupiedMsg = args[3] || '%s sitting on ' + name;

      if (!name) return;

      const sittables = self.sittables || [];
      sittables.push({
        name: name,
        capacity: capacity,
        occupied: [],
        emptyMsg: emptyMsg,
        occupiedMsg: occupiedMsg,
      });
      self.sittables = sittables;

      // If agents are present, register sit verb for them
      const contents = self.contents || [];
      for (const obj of contents) {
        if (obj && obj.registerVerb) {
          await obj.registerVerb('sit', self, 'sit');
        }
      }
    `);

    // Remove a sittable location
    obj.setMethod('removeSittable', `
      /** Remove a sittable location by name or index.
       *  @param nameOrIndex - Name string or numeric index
       */
      const nameOrIndex = args[0];
      const sittables = self.sittables || [];

      if (typeof nameOrIndex === 'number') {
        // Remove by index
        if (nameOrIndex >= 0 && nameOrIndex < sittables.length) {
          // Make anyone sitting here stand up
          const sittable = sittables[nameOrIndex];
          for (const agent of sittable.occupied || []) {
            if (agent && agent.sitting === self) {
              agent.sitting = null;
              agent.sittingOn = null;
            }
          }
          sittables.splice(nameOrIndex, 1);
          self.sittables = sittables;
        }
      } else {
        // Remove by name
        const idx = sittables.findIndex(s => s.name === nameOrIndex);
        if (idx >= 0) {
          // Make anyone sitting here stand up
          const sittable = sittables[idx];
          for (const agent of sittable.occupied || []) {
            if (agent && agent.sitting === self) {
              agent.sitting = null;
              agent.sittingOn = null;
            }
          }
          sittables.splice(idx, 1);
          self.sittables = sittables;
        }
      }
    `);

    // The 'sit' verb - sit on a sittable location
    obj.setMethod('sit', `
      /** Sit down on a sittable location in this room.
       *  Usage: sit
       *  Usage: sit <location>
       */
      const sittables = self.sittables || [];

      if (sittables.length === 0) {
        return 'There is nowhere to sit here.';
      }

      // Check if action is blocked by exclusions
      const blocked = await $.exclusions.check(player, 'sit');
      if (blocked) {
        return blocked; // Returns the message string
      }

      // Check if player is already sitting
      if (player.sitting) {
        return 'You are already sitting. Use "stand" to stand up first.';
      }

      // Parse optional location argument
      const args = command.trim().split(/\\s+/).slice(1); // Remove 'sit'
      const targetName = args.join(' ').toLowerCase();

      let sittable = null;
      let sittableIndex = -1;

      if (targetName) {
        // Find specific sittable by name
        sittableIndex = sittables.findIndex(s => s.name.toLowerCase().includes(targetName));
        if (sittableIndex >= 0) {
          sittable = sittables[sittableIndex];
        } else {
          return \`You don't see "\${targetName}" here to sit on.\`;
        }
      } else {
        // Find first available sittable with space
        for (let i = 0; i < sittables.length; i++) {
          const s = sittables[i];
          if ((s.occupied || []).length < s.capacity) {
            sittable = s;
            sittableIndex = i;
            break;
          }
        }
        if (!sittable) {
          return 'All seating is occupied.';
        }
      }

      // Check capacity
      if ((sittable.occupied || []).length >= sittable.capacity) {
        return \`\${sittable.name} is fully occupied.\`;
      }

      // Sit down
      sittable.occupied = sittable.occupied || [];
      sittable.occupied.push(player);
      player.sitting = self;
      player.sittingOn = sittable.name;

      // Start 'sit' exclusion (blocks walking, etc.)
      await $.exclusions.start(player, 'sit', "You'll need to stand up first.");

      // Register 'stand' verb
      await player.registerVerb('stand', self, 'stand');

      // Announce
      await self.announce(player, null, {
        actor: \`You sit down on \${sittable.name}.\`,
        others: await $.pronoun.sub('%N sits down on ' + sittable.name + '.', player),
      });

      return '';
    `);

    // The 'stand' verb - stand up from sitting
    obj.setMethod('stand', `
      /** Stand up from a sitting position. */
      if (!player.sitting || player.sitting !== self) {
        return 'You are not sitting.';
      }

      const sittables = self.sittables || [];
      const sittingOn = player.sittingOn;

      // Find and remove from sittable
      for (const sittable of sittables) {
        const idx = (sittable.occupied || []).findIndex(p => p === player);
        if (idx >= 0) {
          sittable.occupied.splice(idx, 1);
          break;
        }
      }

      // Clear sitting state
      player.sitting = null;
      player.sittingOn = null;

      // End 'sit' exclusion (allows walking again)
      await $.exclusions.end(player, 'sit');

      // Unregister 'stand' verb
      await player.unregisterVerb('stand', self);

      // Announce
      await self.announce(player, null, {
        actor: \`You stand up from \${sittingOn}.\`,
        others: await $.pronoun.sub('%N stands up from ' + sittingOn + '.', player),
      });

      return '';
    `);

    return obj;
  }
}
