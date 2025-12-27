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
        abilities: `Observation telescope mounted on a fixed base. Can be tilted and swiveled within
configured limits to view different areas of the city.

ADJUSTING: Players can 'tilt telescope to X' or 'swivel telescope to Y' where X/Y
are angles in degrees. Tilt 0 = straight down, higher = further out. Swivel 0 = north,
90 = east, 180 = south, 270 = west.

VIEWING: When a player looks through the telescope, it casts a ray from the mount
position at the current tilt/swivel angles. Looking down shows surface rooms plus
the 8 surrounding cells. Looking horizontally traces through outdoor rooms until
blocked by an indoor room or gap.

RANGE: At tilt=0, views directly below. At tilt=60, views ~1.7x the mount height
away. At tilt=85, views ~11x the mount height away.`,
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

    // tilt(angle) - Adjust vertical angle
    obj.setMethod(
      'tilt',
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

    // swivel(angle) - Adjust horizontal angle
    obj.setMethod(
      'swivel',
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
       *  @returns AI-synthesized description of what's visible
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
              name: roomObj.name,
              description: roomObj.description,
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
              name: roomObj.name,
              description: roomObj.description,
              x: r.x, y: r.y, z: r.z,
              isCenter: false,
            });
          }
        }
      }

      if (visibleRooms.length === 0) {
        return 'You peer through the telescope but see only empty terrain.';
      }

      // Build AI prompt
      const roomDescriptions = visibleRooms.map(r =>
        \`[\${r.isCenter ? 'CENTER' : 'VISIBLE'}] \${r.name}: \${r.description}\`
      ).join('\\n\\n');

      const viewType = self.tilt < 45 ? "bird's-eye view from above" : 'horizontal view';
      const prompt = \`You are looking through a telescope. View type: \${viewType}. Distance: \${distance}m.

Visible areas:
\${roomDescriptions}

Describe what the viewer sees in 2-3 sentences, synthesizing these locations naturally. Focus on activity, landmarks, atmosphere. Don't list room names.\`;

      const response = await $query('openrouter/google/gemini-2.0-flash-exp:free', prompt);
      return response || 'The view is hazy today.';
      `,
    );

    return obj;
  }
}
