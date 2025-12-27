import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the Telescope prototype
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
export class TelescopeBuilder {
  static readonly alias = 'telescope';
  static readonly parent = 'describable';

  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(describableId);
    const obj = await this.manager.create({
      parent: parentObj!,
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
        abilities: `Observation telescope mounted on a fixed base. Can be tilted and swiveled to view
different areas of the city.

PROPERTIES:
- tilt: vertical angle (0=straight down, higher=further out)
- swivel: horizontal angle (0=north, 90=east, 180=south, 270=west)

USING THE TELESCOPE: When a player looks through the telescope, call lookThrough()
which returns raw room descriptions along the line of sight. AGGREGATE THIS DATA
INTO A VIVID NARRATION for the player - describe what they see as a cohesive scene,
not a list of rooms. Focus on landmarks, activity, atmosphere, and spatial relationships.

ADJUSTING: The AI can modify tilt/swivel properties directly based on player intent
("point it north", "look down at the street", etc.).

RANGE: At tilt=0, views directly below. At tilt=60, views ~1.7x mount height away.
At tilt=85, views ~11x mount height away.`,
      },
      methods: {},
    });

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

    // lookThrough(player) - Main viewing method
    obj.setMethod(
      'lookThrough',
      `
      /** Look through the telescope and see the city.
       *  Uses $world.castRay for proper line-of-sight tracing.
       *  @param player - The player looking through
       *  @returns Aggregated descriptions of visible rooms
       */
      const loc = self.location;
      const fromX = loc?.x ?? 0;
      const fromY = loc?.y ?? 0;
      const fromZ = self.mountZ ?? loc?.z ?? 0;

      // Cast ray - returns rooms along line of sight
      const { rooms: rayRooms, distance, blocked } = await $.world.castRay(
        fromX, fromY, fromZ, self.tilt || 0, self.swivel || 0
      );

      // For vertical views (down or up), get 9 surrounding rooms at target height
      const visibleRooms = [];
      const tilt = self.tilt || 0;
      const isLookingDown = tilt < 45;
      const isLookingUp = tilt > 135;

      if ((isLookingDown || isLookingUp) && rayRooms.length > 0) {
        const center = rayRooms[0];
        const cells = [
          { x: center.x, y: center.y, isCenter: true },
          { x: center.x - 1, y: center.y + 1 },
          { x: center.x, y: center.y + 1 },
          { x: center.x + 1, y: center.y + 1 },
          { x: center.x - 1, y: center.y },
          { x: center.x + 1, y: center.y },
          { x: center.x - 1, y: center.y - 1 },
          { x: center.x, y: center.y - 1 },
          { x: center.x + 1, y: center.y - 1 },
        ];

        for (const cell of cells) {
          // Looking down: get highest (surface). Looking up: get lowest (floor above)
          const room = isLookingDown
            ? await $.world.getHighestRoomAt(cell.x, cell.y)
            : await $.world.getLowestRoomAt(cell.x, cell.y);
          if (!room) continue;
          const roomObj = await $load(room.id);
          if (roomObj) {
            visibleRooms.push({
              room: roomObj,
              x: room.x, y: room.y, z: room.z,
              isCenter: cell.isCenter || false,
            });
          }
        }
      } else {
        // Horizontal: use all rooms from ray trace
        for (const r of rayRooms) {
          const roomObj = await $load(r.id);
          if (roomObj) {
            visibleRooms.push({
              room: roomObj,
              x: r.x, y: r.y, z: r.z,
              isCenter: false,
            });
          }
        }
      }

      if (visibleRooms.length === 0) {
        return 'You peer through the telescope but see only empty terrain.';
      }

      // Build header
      const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
      const dir = directions[Math.round((self.swivel || 0) / 45) % 8];
      const viewType = isLookingDown ? 'down' : isLookingUp ? 'up' : 'horizontally';

      let output = \`Looking \${viewType} toward the \${dir} (tilt \${tilt}°, swivel \${self.swivel || 0}°):\\n\\n\`;

      // Aggregate room descriptions using describe()
      for (const { room, isCenter } of visibleRooms) {
        const marker = isCenter ? '[CENTER] ' : '';
        const desc = await room.describe();
        output += \`\${marker}\${desc}\\n\\n\`;
      }

      output += \`Distance: ~\${Math.round(distance)}m\`;
      if (blocked) output += ' (view blocked by structure)';

      return output;
      `,
    );

    return obj;
  }
}
