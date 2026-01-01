import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Telescope type
 * An observation device that casts rays and uses AI to synthesize views.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - tilt/swivel properties define viewing angle
 * - Abilities describe how to adjust and use the telescope
 * - AI interprets what the viewer sees through lookThrough()
 *
 * Properties:
 * - tilt: Vertical angle (0=straight down, higher=further out)
 * - swivel: Horizontal angle (0=north, 90=east, 180=south, 270=west)
 * - tiltMin/tiltMax: Range limits for tilt
 * - swivelMin/swivelMax: Range limits for swivel
 * - mountZ: Z-level where telescope is mounted
 */
export class TelescopeBuilder implements Builder {
  static provides = ['telescope'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('telescope');
    if (existing) {
      this.obj = existing;
    } else {
      // Create telescope as a TYPE
      const parentObj = await this.manager.load('describable');
      if (!parentObj)
        throw new Error('TelescopeBuilder: $describable not found');

      this.obj = await this.manager.define('telescope', parentObj, {
        properties: {
          name: 'Telescope',
          description: 'An observation telescope mounted on a fixed base.',
          tilt: 45,
          swivel: 0,
          tiltMin: 0,
          tiltMax: 85,
          swivelMin: 0,
          swivelMax: 359,
          mountZ: 0,
          // Default POIs - major intersections and landmarks from Pioneer Square
          // Avenues: Waterfront(-21), 1st(-14), Occidental(-7), 2nd(0), 3rd(+7), 4th(+14)
          // Streets: King(-12), Jackson(-6), Main(0), Washington(+6), Yesler(+12)
          pointsOfInterest: [
            // Landmarks
            { name: 'Totem Pole', x: -7, y: 0, z: 0 },
            { name: 'Top of Totem', x: -7, y: 0, z: 1 },
            { name: 'Smith Tower Entrance', x: -12, y: 12, z: 0 },
            { name: 'Grand Central', x: -9, y: 2, z: 0 },
            { name: 'Occidental Park', x: -3, y: 2, z: 0 },
            { name: 'Pioneer Building', x: 5, y: 9, z: 0 },
            { name: 'Sinkhole', x: -16, y: -8, z: 0 },
            { name: 'Supply Depot', x: -21, y: -5, z: 0 },
            { name: 'Fabrication Factory', x: -21, y: 10, z: 0 },
            // Yesler Way intersections (y=+12)
            { name: 'Waterfront & Yesler', x: -21, y: 12, z: 0 },
            { name: '1st & Yesler', x: -14, y: 12, z: 0 },
            { name: 'Occidental & Yesler', x: -7, y: 12, z: 0 },
            { name: '2nd & Yesler', x: 0, y: 12, z: 0 },
            { name: '3rd & Yesler', x: 7, y: 12, z: 0 },
            { name: '4th & Yesler', x: 14, y: 12, z: 0 },
            // Washington intersections (y=+6)
            { name: 'Waterfront & Washington', x: -21, y: 6, z: 0 },
            { name: '1st & Washington', x: -14, y: 6, z: 0 },
            { name: 'Occidental & Washington', x: -7, y: 6, z: 0 },
            { name: '2nd & Washington', x: 0, y: 6, z: 0 },
            { name: '3rd & Washington', x: 7, y: 6, z: 0 },
            { name: '4th & Washington', x: 14, y: 6, z: 0 },
            // Main intersections (y=0)
            { name: 'Waterfront & Main', x: -21, y: 0, z: 0 },
            { name: '1st & Main', x: -14, y: 0, z: 0 },
            { name: 'Occidental & Main', x: -7, y: 0, z: 0 },
            { name: '2nd & Main', x: 0, y: 0, z: 0 },
            { name: '3rd & Main', x: 7, y: 0, z: 0 },
            { name: '4th & Main', x: 14, y: 0, z: 0 },
            // Jackson intersections (y=-6)
            { name: 'Waterfront & Jackson', x: -21, y: -6, z: 0 },
            { name: '1st & Jackson', x: -14, y: -6, z: 0 },
            { name: 'Occidental & Jackson', x: -7, y: -6, z: 0 },
            { name: '2nd & Jackson', x: 0, y: -6, z: 0 },
            { name: '3rd & Jackson', x: 7, y: -6, z: 0 },
            { name: '4th & Jackson', x: 14, y: -6, z: 0 },
            // King intersections (y=-12)
            { name: 'Waterfront & King', x: -21, y: -12, z: 0 },
            { name: '1st & King', x: -14, y: -12, z: 0 },
            { name: 'Occidental & King', x: -7, y: -12, z: 0 },
            { name: '2nd & King', x: 0, y: -12, z: 0 },
            { name: '3rd & King', x: 7, y: -12, z: 0 },
            { name: '4th & King', x: 14, y: -12, z: 0 },
          ],
          abilities: `Observation telescope for viewing distant locations across the city.

MOUNTED TELESCOPE (at fixed location like observation deck):
1. First check available POIs:
   const pois = telescope.pointsOfInterest.filter(p => p.available);
2. Aim at one: await telescope.aimAt('Totem Pole')
3. Look: const view = await telescope.lookThrough()

Available POI names:
- Landmarks: "Totem Pole", "Top of Totem", "Grand Central", "Occidental Park",
  "Pioneer Building", "Sinkhole", "Supply Depot", "Fabrication Factory"
- Intersections: "[Avenue] & [Street]" e.g. "Waterfront & Yesler", "4th & King"
  Avenues: Waterfront, 1st, Occidental, 2nd, 3rd, 4th
  Streets: Yesler, Washington, Main, Jackson, King

Blocked POIs have available:false with reason (e.g. "obstructed by building").

PORTABLE TELESCOPE (player carrying it around):
Don't bother with POIs - just use cardinal directions:
  await telescope.setTilt(90);  // horizontal
  await telescope.setSwivel(0);   // north (90=east, 180=south, 270=west)
  const view = await telescope.lookThrough();

UNDERSTANDING THE VIEW:
- Horizontal (tilt ≥45°): Shows all rooms along the sightline (entire street)
- Downward (tilt <45°): Shows 3x3 grid of ground-level rooms

NARRATING TO PLAYERS:
Aggregate the room descriptions into a cohesive panorama. Don't list rooms -
describe what they observe as a scene, weaving together landmarks and atmosphere.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj;

    // Property descriptions
    obj.setPropertyDescription(
      'tilt',
      'Vertical viewing angle in degrees. 0=straight down, higher=further out.',
    );
    obj.setPropertyDescription(
      'swivel',
      'Horizontal viewing angle in degrees. 0=north, 90=east, 180=south, 270=west.',
    );
    obj.setPropertyDescription(
      'tiltMin',
      'Minimum allowed tilt angle (default: 0).',
    );
    obj.setPropertyDescription(
      'tiltMax',
      'Maximum allowed tilt angle (default: 85).',
    );
    obj.setPropertyDescription(
      'swivelMin',
      'Minimum allowed swivel angle (default: 0).',
    );
    obj.setPropertyDescription(
      'swivelMax',
      'Maximum allowed swivel angle (default: 359).',
    );
    obj.setPropertyDescription(
      'mountZ',
      'Z-level where telescope is mounted, used for ray calculations.',
    );
    obj.setPropertyDescription(
      'pointsOfInterest',
      'Array of {name, x, y, z, tilt?, swivel?, available?} for quick aiming.',
    );

    // setTilt(angle) - Adjust vertical angle
    obj.setMethod(
      'setTilt',
      `
      /** Adjust telescope tilt angle.
       *  @param angle - Tilt in degrees (0=straight down, higher=further out)
       *  @returns Confirmation message
       */
      const angle = args[0];
      const min = self.tiltMin ?? 0;
      const max = self.tiltMax ?? 85;

      if (angle < min || angle > max) {
        return \`The telescope can only tilt between \${min}° and \${max}°.\`;
      }

      self.tilt = angle;
      return \`You tilt the telescope to \${angle}°.\`;
      `,
    );

    // setSwivel(angle) - Adjust horizontal angle
    obj.setMethod(
      'setSwivel',
      `
      /** Adjust telescope swivel angle.
       *  @param angle - Swivel in degrees (0=north, 90=east, 180=south, 270=west)
       *  @returns Confirmation message
       */
      const angle = args[0] % 360;
      const min = self.swivelMin ?? 0;
      const max = self.swivelMax ?? 359;

      // Handle wrap-around for swivel limits
      if (min <= max) {
        if (angle < min || angle > max) {
          return \`The telescope can only swivel between \${min}° and \${max}°.\`;
        }
      }

      self.swivel = angle;
      const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
      const dir = directions[Math.round(angle / 45) % 8];
      return \`You swivel the telescope to face \${dir} (\${angle}°).\`;
      `,
    );

    // calibratePointsOfInterest() - Update POIs with tilt/swivel from current location
    obj.setMethod(
      'calibratePointsOfInterest',
      `
      /** Recalculate tilt/swivel for all points of interest from current location.
       *  Updates each POI with: tilt, swivel, distance, available (within limits).
       *  @returns Updated pointsOfInterest array
       */
      const loc = self.location;
      const fromX = loc?.x ?? 0;
      const fromY = loc?.y ?? 0;
      const fromZ = self.mountZ ?? loc?.z ?? 0;

      const tiltMin = self.tiltMin ?? 0;
      const tiltMax = self.tiltMax ?? 85;
      const swivelMin = self.swivelMin ?? 0;
      const swivelMax = self.swivelMax ?? 359;

      const pois = self.pointsOfInterest || [];
      const updated = [];

      for (const poi of pois) {
        const dx = poi.x - fromX;
        const dy = poi.y - fromY;
        const dz = (poi.z ?? 0) - fromZ;

        // Horizontal distance
        const horizDist = Math.sqrt(dx * dx + dy * dy);
        const totalDist = Math.sqrt(horizDist * horizDist + dz * dz);

        // Calculate tilt (0 = straight down, 90 = horizontal)
        // tilt = atan(horizDist / |dz|) when looking down
        let tilt = 0;
        if (dz < 0) {
          // Looking down
          tilt = Math.atan2(horizDist, Math.abs(dz)) * 180 / Math.PI;
        } else if (dz === 0) {
          tilt = 90; // Horizontal
        } else {
          tilt = 90 + Math.atan2(dz, horizDist) * 180 / Math.PI; // Looking up
        }

        // Calculate swivel (bearing from north)
        // 0=north(+y), 90=east(+x), 180=south(-y), 270=west(-x)
        const swivel = (90 - Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

        // Check if within limits
        let available = true;
        let reason = null;

        if (tilt < tiltMin || tilt > tiltMax) {
          available = false;
          reason = tilt < tiltMin ? 'too steep' : 'too shallow';
        }

        // Check swivel limits (handle wrap-around)
        if (available && swivelMin <= swivelMax) {
          if (swivel < swivelMin || swivel > swivelMax) {
            available = false;
            reason = 'outside swivel range';
          }
        }

        // Check for obstructions - cast ray and see if it hits indoor first
        if (available) {
          const rayResult = await $spatial.castRay(fromX, fromY, fromZ, tilt, swivel, Math.min(totalDist + 5, 50));
          if (rayResult.hit && !rayResult.room.outdoor) {
            available = false;
            reason = 'obstructed by building';
          }
        }

        updated.push({
          name: poi.name,
          x: poi.x,
          y: poi.y,
          z: poi.z ?? 0,
          tilt: Math.round(tilt),
          swivel: Math.round(swivel),
          distance: Math.round(totalDist),
          available,
          reason,
        });
      }

      self.pointsOfInterest = updated;
      return updated;
      `,
    );

    // aimAt(poiName) - Point telescope at a named POI
    obj.setMethod(
      'aimAt',
      `
      /** Aim telescope at a named point of interest.
       *  @param poiName - Name of the POI to aim at
       *  @returns Status message
       */
      const name = args[0];
      const pois = self.pointsOfInterest || [];
      const poi = pois.find(p => p.name.toLowerCase() === name.toLowerCase());

      if (!poi) {
        const names = pois.map(p => p.name).join(', ');
        return \`Unknown point of interest: "\${name}". Known: \${names || 'none'}\`;
      }

      if (!poi.available) {
        return \`Cannot aim at \${poi.name}: \${poi.reason || 'unavailable from this location'}.\`;
      }

      self.tilt = poi.tilt;
      self.swivel = poi.swivel;

      const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
      const dir = directions[Math.round(poi.swivel / 45) % 8];

      return \`You aim the telescope at \${poi.name} (\${dir}, ~\${poi.distance}m away).\`;
      `,
    );

    // lookThrough(player, exclusions) - Main viewing method with raycasting
    obj.setMethod(
      'lookThrough',
      `
      /** Look through the telescope and see the city.
       *  Uses $spatial for O(1) coordinate lookups and efficient raycasting.
       *  @param player - The player looking through (optional)
       *  @returns Aggregated descriptions of visible rooms
       */
      const t0 = Date.now();
      const loc = self.location;
      const startX = loc?.x ?? 0;
      const startY = loc?.y ?? 0;
      const fromZ = self.mountZ ?? loc?.z ?? 0;
      const tilt = self.tilt || 0;
      const swivel = self.swivel || 0;

      // Project sqrt(3) units (cube diagonal) to clear adjacent cell in any direction
      const checkDist = Math.sqrt(3);
      const tiltRad = tilt * Math.PI / 180;
      const swivelRad = swivel * Math.PI / 180;
      const horizontal = Math.sin(tiltRad) * checkDist;
      const vertical = -Math.cos(tiltRad) * checkDist;
      const checkX = Math.round(startX + horizontal * Math.sin(swivelRad));
      const checkY = Math.round(startY + horizontal * Math.cos(swivelRad));
      const checkZ = Math.round(fromZ + vertical);

      // Check for wall/ground using $spatial (O(1) lookup)
      const t1 = Date.now();
      const nearbyRoom = await $spatial.getRoomDataAt(checkX, checkY, checkZ);
      console.log('[telescope] getRoomDataAt took', Date.now() - t1, 'ms');

      if (nearbyRoom && !nearbyRoom.outdoor) {
        if (tilt < 45) {
          return 'The telescope is pointed at the ground.';
        } else {
          return 'The telescope is pointed at a wall.';
        }
      }

      // Cast ray using $spatial (efficient index-based raycasting)
      const t2 = Date.now();
      const maxDist = 50;
      let rayResult = await $spatial.castRay(startX, startY, fromZ, tilt, swivel, maxDist);
      console.log('[telescope] castRay took', Date.now() - t2, 'ms, hit:', rayResult.hit, 'dist:', rayResult.distance);

      const isLookingDown = tilt < 45;

      // If we hit an indoor room, trace backwards up the ray to find first outdoor
      if (rayResult.hit && !rayResult.room.outdoor) {
        console.log('[telescope] hit indoor room, searching back for outdoor...');
        const tiltRad = tilt * Math.PI / 180;
        const swivelRad = swivel * Math.PI / 180;
        const dx = Math.sin(tiltRad) * Math.sin(swivelRad);
        const dy = Math.sin(tiltRad) * Math.cos(swivelRad);
        const dz = -Math.cos(tiltRad);

        // Trace back from hit point toward telescope
        for (let d = rayResult.distance - 1; d >= 1; d--) {
          const x = Math.round(startX + dx * d);
          const y = Math.round(startY + dy * d);
          const z = Math.round(fromZ + dz * d);
          const room = await $spatial.getRoomDataAt(x, y, z);
          if (room && room.outdoor) {
            rayResult = { hit: true, room, distance: d, x, y, z };
            console.log('[telescope] found outdoor at dist', d);
            break;
          }
        }
      }

      if (!rayResult.hit) {
        return 'You peer through the telescope but see only empty terrain.';
      }

      const center = rayResult.room;
      const distance = rayResult.distance;
      const visibleRooms = new Map();

      // Build grid around target at z=0 - just check if rooms exist
      const t3 = Date.now();
      if (isLookingDown) {
        // Drop to z=0 and check 3x3 grid
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const room = await $spatial.getRoomDataAt(center.x + dx, center.y + dy, 0);
            if (room && room.outdoor && !visibleRooms.has(room.id)) {
              visibleRooms.set(room.id, { room, z: 0 });
            }
          }
        }
      } else {
        // Horizontal view - trace along ray and collect all outdoor rooms
        const tiltRad = tilt * Math.PI / 180;
        const swivelRad = swivel * Math.PI / 180;
        const dx = Math.sin(tiltRad) * Math.sin(swivelRad);
        const dy = Math.sin(tiltRad) * Math.cos(swivelRad);
        const dz = -Math.cos(tiltRad);

        // Trace ray and collect outdoor rooms
        for (let d = 1; d <= maxDist; d++) {
          const x = Math.round(startX + dx * d);
          const y = Math.round(startY + dy * d);
          const z = Math.round(fromZ + dz * d);
          const room = await $spatial.getRoomDataAt(x, y, z);
          if (room && room.outdoor && !visibleRooms.has(room.id)) {
            visibleRooms.set(room.id, { room, z, distance: d });
          }
        }
      }
      console.log('[telescope] grid check took', Date.now() - t3, 'ms, found', visibleRooms.size, 'rooms');

      if (visibleRooms.size === 0) {
        return 'You peer through the telescope but see only empty terrain.';
      }

      // Build header
      const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
      const dir = directions[Math.round(swivel / 45) % 8];

      let output = \`Looking down toward the \${dir} (tilt \${tilt}°, swivel \${swivel}°):\\n\\n\`;

      // Sort by z-level (highest first)
      const sorted = [...visibleRooms.values()].sort((a, b) => b.z - a.z);

      // The room objrefs can be used directly - no need to $load
      const t4 = Date.now();
      for (const { room, z } of sorted) {
        if (room) {
          const zLabel = z > 0 ? \`[z=\${z}] \` : '';
          const desc = await room.describe();
          output += \`\${zLabel}\${desc}\\n\\n\`;
        }
      }
      console.log('[telescope] describe x', sorted.length, 'took', Date.now() - t4, 'ms');
      console.log('[telescope] TOTAL took', Date.now() - t0, 'ms');

      output += \`Distance: ~\${Math.round(distance)}m\`;

      return output;
      `,
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[TelescopeBuilder] Type 'telescope' auto-aliased`);
  }
}

// Self-register
registerBuilder(TelescopeBuilder);
