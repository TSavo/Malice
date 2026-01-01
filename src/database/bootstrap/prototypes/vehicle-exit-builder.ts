import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the VehicleExit prototype
 * An exit that dynamically resolves to vehicle.location
 *
 * Used for exits leading OUT of a vehicle (doors, ramps, hatches).
 * The destination is always the room where the vehicle is parked.
 */
export class VehicleExitBuilder implements Builder {
  static provides = ['vehicleExit'];
  static depends = ['exit'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vehicleExit');
    if (existing) {
      this.obj = existing;
    } else {
      const exit = await this.manager.load('exit');
      if (!exit) throw new Error('Exit type not found');

      this.obj = await this.manager.define('vehicleExit', exit, {
        properties: {
          name: 'door',
          aliases: ['out', 'outside', 'exit', 'leave'],
          isVehicleExit: true, // Marks this as resolving to vehicle.location
          destRoom: null, // Dynamic - resolved by getDestination()

          abilities: `Exit leading outside a vehicle.

DYNAMIC DESTINATION: 'destRoom' is null. getDestination() resolves to vehicle.location.
The destination changes as the vehicle moves between rooms.

NAMING: Override 'name' per instance: 'cab door', 'loading ramp', 'cargo hatch', etc.

PROPERTIES: Can have any exit properties - locked, hidden, slow, etc.
Each vehicle exit can have different characteristics.

EXAMPLES:
- Car: 'driver door', 'passenger door'
- Cargo van: 'driver door', 'passenger door', 'cargo doors' (locked)
- Aircraft carrier: 'hangar door' (locked), 'loading ramp' (slow), 'flight deck ladder'`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Override getDestination to dynamically resolve to vehicle.location
    obj.setMethod(
      'getDestination',
      `
      /**
       * Get the destination room - dynamically resolves to vehicle.location.
       * @returns The room where the vehicle is currently parked
       */
      // Find the room this exit is attached to
      const room = self.source;
      if (!room) return null;

      // The room is either a $vehicleRoom (has vehicle property) or the vehicle itself
      const vehicle = room.vehicle || room;
      if (!vehicle) return null;

      // Return where the vehicle is parked
      return vehicle.location;
    `,
    );

    // Override describe to show dynamic destination
    obj.setMethod(
      'describe',
      `
      /**
       * Get description of this exit for room listing.
       * @returns Description string
       */
      const aliases = self.aliases || [];
      const shortAlias = aliases.length > 0 ? ' [' + aliases[0] + ']' : '';
      const lockStr = self.locked ? ' (locked)' : '';

      // Get current outside location name
      const dest = await self.getDestination();
      const destName = dest ? dest.name : 'outside';

      return self.name + shortAlias + ' → ' + destName + lockStr;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'isVehicleExit',
      'true for exits that lead outside a vehicle. Destination resolves dynamically.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VehicleExitBuilder);
