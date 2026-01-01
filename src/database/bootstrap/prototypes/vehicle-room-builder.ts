import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the VehicleRoom prototype
 * An internal room within a multi-room vehicle.
 *
 * Examples:
 * - Cargo van cab and cargo area
 * - Aircraft carrier bridge, hangar, engine room
 * - Yacht cabins, bridge, deck
 *
 * Key differences from regular rooms:
 * - No world coordinates (x, y, z) - position is relative to vehicle
 * - Has `vehicle` property pointing to parent vehicle
 * - When vehicle moves, all internal rooms move with it
 */
export class VehicleRoomBuilder implements Builder {
  static provides = ['vehicleRoom'];
  static depends = ['room'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vehicleRoom');
    if (existing) {
      this.obj = existing;
    } else {
      const room = await this.manager.load('room');
      if (!room) throw new Error('Room type not found');

      this.obj = await this.manager.define('vehicleRoom', room, {
        properties: {
          name: 'Vehicle Room',
          description: 'An internal compartment of a vehicle',
          // Reference to parent vehicle
          vehicle: null, // objref to $vehicle
          // No world coordinates - relative to vehicle
          x: null,
          y: null,
          z: null,
          // Internal rooms don't have exits to world - only to other internal rooms
          // Use $vehicleExit for exits leading outside
          exits: [],

          abilities: `Internal compartment of a vehicle.

VEHICLE: 'vehicle' property points to the parent vehicle this room is inside.

NO COORDINATES: Unlike regular rooms, internal rooms have no x/y/z coordinates.
They exist *inside* the vehicle. The vehicle has world coordinates.

EXITS: Regular exits connect to other internal rooms (cab → cargo).
Use $vehicleExit for exits leading outside (door, ramp, hatch).
$vehicleExit.getDestination() dynamically returns vehicle.location.

MOVEMENT: When the vehicle moves, this room moves with it.
Passengers stay in the internal room - their world position changes automatically.

PERCEPTION: Can hear/see things in this internal room.
Use lookOutside() to see where the vehicle is parked.

EXAMPLE LAYOUT (cargo van):
- cab: exits = [{name:'back', destRoom:cargo}, {name:'door', vehicleExit}]
- cargo: exits = [{name:'front', destRoom:cab}, {name:'cargo doors', vehicleExit, locked}]`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Get the parent vehicle
    obj.setMethod(
      'getVehicle',
      `
      /**
       * Get the vehicle this room belongs to.
       * @returns The parent vehicle object
       */
      return self.vehicle;
    `,
    );

    // Get what's outside (vehicle's current location)
    obj.setMethod(
      'getOutsideRoom',
      `
      /**
       * Get the room outside the vehicle.
       * @returns The room where the vehicle is parked
       */
      const vehicle = self.vehicle;
      if (!vehicle) return null;
      return vehicle.location;
    `,
    );

    // Override getCoordinates to return vehicle's coordinates
    obj.setMethod(
      'getCoordinates',
      `
      /**
       * Get coordinates from parent vehicle.
       * Internal rooms don't have their own coordinates.
       * @returns Vehicle's coordinates or null
       */
      const vehicle = self.vehicle;
      if (!vehicle) return { x: 0, y: 0, z: 0 };

      if (vehicle.getCurrentCoordinates) {
        return await vehicle.getCurrentCoordinates();
      }
      return {
        x: vehicle.x || 0,
        y: vehicle.y || 0,
        z: vehicle.z || 0
      };
    `,
    );

    // Look outside the vehicle
    obj.setMethod(
      'lookOutside',
      `
      /**
       * Describe what's outside the vehicle.
       * @param viewer - The agent looking
       */
      const viewer = args[0];
      const vehicle = self.vehicle;

      if (!vehicle) return 'You cannot see outside.';

      // Delegate to vehicle's lookOutside if it has one
      if (vehicle.lookOutside) {
        return await vehicle.lookOutside(viewer);
      }

      // Fallback: describe vehicle's location
      const outside = vehicle.location;
      if (!outside) return 'Nothing visible outside.';

      if (vehicle.travelState) {
        const destName = vehicle.travelState.destRoom?.name || 'somewhere';
        return \`The world rushes by as you head toward \${destName}.\`;
      }

      if (outside.describe) {
        return await outside.describe(viewer);
      }
      return outside.name + '\\r\\n' + (outside.description || '');
    `,
    );

    // Override describe to show vehicle context
    obj.setMethod(
      'describe',
      `
      /**
       * Describe this internal room.
       */
      const viewer = args[0];

      // Room name and description
      let output = self.name + '\\r\\n' + (self.description || '') + '\\r\\n';

      // Show exits
      const exits = self.exits || [];
      const visibleExits = [];
      for (const exit of exits) {
        if (exit && !exit.hidden) {
          const desc = exit.describe ? await exit.describe() : exit.name;
          visibleExits.push(desc);
        }
      }
      if (visibleExits.length > 0) {
        output += \`\\r\\nExits: \${visibleExits.join(', ')}\\r\\n\`;
      }

      // Show contents (excluding viewer)
      const contents = self.contents || [];
      const others = contents.filter(item => item !== viewer);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const obj of others) {
          if (obj) {
            const shortDesc = obj.shortDesc ? await obj.shortDesc() : obj.name;
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      return output;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'vehicle',
      'Reference to the parent vehicle this room is inside.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VehicleRoomBuilder);
