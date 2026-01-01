import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the UnderwaterRoom prototype
 *
 * Temporary location underwater (z < 0). Created dynamically by $spatial
 * when submarines dive to new depths, recycled when empty.
 *
 * Inherits from Location and auto-registers with $spatial via hooks.
 * Coordinate system: 30m per x/y unit, 3m per z unit (z=-10 = 30m deep).
 */
export class UnderwaterRoomBuilder implements Builder {
  static provides = ['underwaterRoom'];
  static depends = ['location'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('underwaterRoom');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const location = await this.manager.load('location');
      if (!location) {
        throw new Error('Location type not found - required for UnderwaterRoom');
      }

      this.obj = await this.manager.define('underwaterRoom', location, {
        properties: {
          name: 'Underwater',
          description: 'Beneath the waves.',
          // Coordinates (set on creation)
          x: 0,
          y: 0,
          z: -1, // Negative for underwater
          // Flags
          underwater: true,
          outdoor: false, // No sky visible
          // Environmental conditions
          visibility: 50, // 0-100, decreases with depth
          // AI-readable abilities
          abilities: `Underwater location at depth. Submarines and divers operate here.

DEPTH: Depth is z * -3 meters. z=-1 = 3m (shallow), z=-10 = 30m, z=-100 = 300m.
Deeper = darker, more pressure.

PRESSURE: pressure = depth / 10 atmospheres. z=-33 = 10 atm.
Exceeding crush depth damages vessels. Humans need gear below z=-3.

VISIBILITY: Decreases with depth. Bright at z=-1, murky at z=-30, black at z=-50+.
Lights extend visibility. Sonar works in darkness.

OXYGEN: Zero ambient oxygen. Submarines have air supply. Divers need tanks.
Running out of air = drowning.

COORDINATES: Same x,y grid as surface (30m per unit).
Submarines at same x,y,z share this room.

MOVEMENT: Submarines navigate by coordinates (not exits).
Can ascend/descend through z-levels. Surface at z=0.

LIFECYCLE: Created by AI via $spatial.ensureRoom() when submarines dive there.
AI only creates underwater rooms in water terrain at reasonable depth (z >= -15).
Deeper than z=-15 requires explicit "deep trench" hint or AI refuses.
Rooms are PERMANENT once created - they stay forever for future dives.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!;

    // Override describe to show depth and conditions
    obj.setMethod(
      'describe',
      `
      /**
       * Describe this underwater room to a viewer.
       * Shows depth, pressure, visibility, and other vessels.
       */
      const viewer = args[0];
      const depth = await self.getDepth();
      const pressure = await self.getPressure();
      const visibility = self.visibility || 50;

      let output = self.name + '\\r\\n';
      output += depth + 'm below the surface.\\r\\n';

      // Visibility description
      if (visibility >= 80) {
        output += 'Clear water filters sunlight from above.\\r\\n';
      } else if (visibility >= 50) {
        output += 'Dim light filters down from the surface.\\r\\n';
      } else if (visibility >= 20) {
        output += 'Murky twilight surrounds you.\\r\\n';
      } else if (visibility > 0) {
        output += 'Near-total darkness. Only faint hints of light.\\r\\n';
      } else {
        output += 'Absolute darkness. The abyss.\\r\\n';
      }

      // Pressure warning at depth
      if (pressure >= 10) {
        output += 'Crushing pressure at ' + pressure.toFixed(1) + ' atmospheres.\\r\\n';
      } else if (pressure >= 5) {
        output += 'Significant pressure at ' + pressure.toFixed(1) + ' atmospheres.\\r\\n';
      }

      // Show contents (submarines, divers)
      const contents = self.contents || [];
      const others = contents.filter(c => c && c.id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nHere:\\r\\n';
        for (const obj of others) {
          if (obj) {
            const name = obj.name || 'something';
            output += '  - ' + name + '\\r\\n';
          }
        }
      }

      // Navigation
      output += '\\r\\nNavigate: north, south, east, west';
      output += '\\r\\nDepth: up (ascend), down (descend)';
      if (self.z === -1) {
        output += '\\r\\nSurface: up (to surface)';
      }

      return output;
      `,
    );

    // Get depth in meters
    obj.setMethod(
      'getDepth',
      `
      /** Get depth in meters (z * -3) */
      return (self.z || -1) * -3;
      `,
    );

    // Get pressure in atmospheres
    obj.setMethod(
      'getPressure',
      `
      /** Get pressure in atmospheres (1 + depth/10) */
      const depth = (self.z || -1) * -3;
      return 1 + (depth / 10);
      `,
    );

    // Get visibility based on depth
    obj.setMethod(
      'calculateVisibility',
      `
      /**
       * Calculate visibility based on depth.
       * Updates self.visibility and returns value.
       */
      const depth = (self.z || -1) * -3;

      // Visibility decreases with depth
      // Full visibility to ~10m, then decreases
      let vis = 100;
      if (depth > 10) {
        vis = Math.max(0, 100 - (depth - 10) * 2);
      }

      // Below 50m, visibility drops faster
      if (depth > 50) {
        vis = Math.max(0, vis - (depth - 50));
      }

      self.visibility = Math.round(vis);
      return self.visibility;
      `,
    );

    // Check if a vessel can operate at this depth
    obj.setMethod(
      'isSafeFor',
      `
      /**
       * Check if depth is safe for a vessel.
       * @param vessel - The submarine/vehicle to check
       * @returns true if safe, or warning/error string
       */
      const vessel = args[0];
      if (!vessel) return 'No vessel specified';

      const depth = (self.z || -1) * -3;
      const maxDepth = vessel.maxDepth || 0;

      // Surface vessels can't dive
      if (maxDepth === 0) {
        return 'Vessel cannot operate underwater';
      }

      // Check crush depth (maxDepth is in z-levels, negative)
      const maxDepthMeters = maxDepth * -3;
      if (depth > maxDepthMeters) {
        return 'Exceeds crush depth (' + maxDepthMeters + 'm)';
      }

      // Warning zone (within 20% of crush depth)
      if (depth > maxDepthMeters * 0.8) {
        return 'warning: approaching crush depth';
      }

      return true;
      `,
    );

    // Check oxygen for a diver
    obj.setMethod(
      'checkOxygen',
      `
      /**
       * Check if a diver has sufficient oxygen.
       * @param diver - The agent to check
       * @returns true if ok, or warning string
       */
      const diver = args[0];
      if (!diver) return 'No diver specified';

      // Submarines provide their own air
      if (diver.isSubmarine || diver.isWatercraft) {
        return true;
      }

      // Check for diving gear
      const gear = diver.equippedGear || [];
      const hasTank = gear.some(g => g && (g.isOxygenTank || g.isDivingGear));

      if (!hasTank) {
        return 'No oxygen supply - drowning imminent';
      }

      // Check tank level if applicable
      for (const g of gear) {
        if (g && g.oxygen !== undefined && g.oxygen <= 0) {
          return 'Oxygen tank empty';
        }
      }

      return true;
      `,
    );

    // Get the room above (could be water surface or shallower underwater)
    obj.setMethod(
      'getRoomAbove',
      `
      /**
       * Get or create the room one z-level up.
       * @returns The room above, or null if AI says no
       */
      const aboveZ = self.z + 1;
      if (aboveZ > 0) {
        return null; // Can't go above surface from underwater
      }
      // AI decides if ascending is valid (always should be in water terrain)
      return await $spatial.ensureRoom(self, self.x, self.y, aboveZ, 'submarine ascending, shallower underwater');
      `,
    );

    // Get the room below (deeper underwater)
    obj.setMethod(
      'getRoomBelow',
      `
      /**
       * Get or create the room one z-level down.
       * @returns The room below, or null if AI says no (too deep)
       */
      const belowZ = self.z - 1;
      // AI may refuse if too deep (below z=-15 without explicit hint)
      return await $spatial.ensureRoom(self, self.x, self.y, belowZ, 'submarine descending, deeper underwater');
      `,
    );

    // Damage from pressure (for vessels at crush depth)
    obj.setMethod(
      'applyPressureDamage',
      `
      /**
       * Apply pressure damage to vessels exceeding their depth rating.
       * Called by scheduler tick.
       */
      const contents = self.contents || [];
      const depth = (self.z || -1) * -3;

      for (const obj of contents) {
        if (!obj) continue;

        // Check crush depth
        const maxDepth = obj.maxDepth;
        if (maxDepth === undefined) continue; // Not a diving vessel

        const maxDepthMeters = maxDepth * -3;
        if (depth > maxDepthMeters) {
          // Apply hull damage
          const damage = Math.ceil((depth - maxDepthMeters) / 10);
          const currentHp = obj.hp || obj.hullIntegrity || 100;
          const newHp = currentHp - damage;

          if (obj.hullIntegrity !== undefined) {
            obj.hullIntegrity = newHp;
          } else {
            obj.hp = newHp;
          }

          // Announce
          if (obj.location && obj.location.announce) {
            await obj.location.announce(obj, null, {
              others: obj.name + ' groans under the pressure.'
            });
          }

          // Check for destruction
          if (newHp <= 0) {
            // Vessel implodes
            if (obj.location && obj.location.announce) {
              await obj.location.announce(obj, null, {
                others: obj.name + ' implodes from the pressure!'
              });
            }
            // Eject contents, recycle vessel
            if (obj.ejectAll) {
              await obj.ejectAll();
            }
            if ($recycler) {
              await $recycler.recycle(obj);
            }
          }
        }
      }
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'underwater',
      'Flag indicating this is an underwater room',
    );
    obj.setPropertyDescription('x', 'X coordinate (30m per unit)');
    obj.setPropertyDescription('y', 'Y coordinate (30m per unit)');
    obj.setPropertyDescription(
      'z',
      'Z coordinate (3m per unit, depth = z * -3 meters)',
    );
    obj.setPropertyDescription(
      'visibility',
      'Visibility percentage (0-100). Decreases with depth.',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[UnderwaterRoomBuilder] Type 'underwaterRoom' auto-aliased`);
  }
}

// Self-register
registerBuilder(UnderwaterRoomBuilder);
