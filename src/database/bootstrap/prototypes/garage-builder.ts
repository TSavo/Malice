import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Garage type
 * A room specialized for vehicle repair and maintenance.
 * Inherits from $room, adds repair-specific abilities.
 */
export class GarageBuilder implements Builder {
  static provides = ['garage'];
  static depends = ['room'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('garage');
    if (existing) {
      this.obj = existing;
      return;
    }

    // Get parent type
    const room = await this.manager.load('room');
    if (!room) {
      throw new Error('Room type not found - required for Garage');
    }

    this.obj = await this.manager.define('garage', room, {
      properties: {
        name: 'Garage',
        description: 'A vehicle repair shop with tools and equipment.',
        // Garages are typically indoors
        outdoor: false,
        // Default lighting
        lighting: 80,

        abilities: `Vehicle repair shop. Cars, motorcycles, and other vehicles can be repaired here.

REPAIR: Tools and equipment available for mechanical work. Mechanics can diagnose problems, repair damaged parts, and restore vehicle condition. Requires a mechanic or someone with mechanical skill.

PARTS: Vehicle parts can be installed or removed here. Engine swaps, tire changes, transmission work - all possible with the right parts and expertise.

FUEL: Has a fuel pump for refueling vehicles. Gasoline and diesel available.

HOTWIRING: A mechanic here could hotwire a vehicle... for a price. No questions asked if the payment is right.

STORAGE: Vehicles can be stored here temporarily. Not a long-term parking solution.`,
      },
      methods: {},
    });

    // Property descriptions
    this.obj.setPropertyDescription(
      'abilities',
      'What can be done in this garage - repair, parts, fuel, etc.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
    if (!this.obj) return;
    console.log(`[GarageBuilder] Type 'garage' auto-aliased`);
  }
}

// Self-register
registerBuilder(GarageBuilder);
