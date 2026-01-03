import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the VehicleDoor prototype
 * Extends $door with vehicle-part damage tracking.
 * Used with $vehicleExit.door for access control.
 */
export class VehicleDoorBuilder implements Builder {
  static provides = ['vehicleDoor'];
  static depends = ['door'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vehicleDoor');
    if (existing) {
      this.obj = existing;
    } else {
      const door = await this.manager.load('door');
      if (!door) throw new Error('Door type not found');

      this.obj = await this.manager.define('vehicleDoor', door, {
        properties: {
          name: 'Vehicle Door',
          description: 'A vehicle door',
          // Vehicle-part properties
          partType: 'door',
          condition: 100,
          damage: 0,
          installed: null,
          weight: 25000, // 25kg
          // Door-specific
          side: 'left', // left, right, rear, front

          abilities: `Vehicle door. Extends $door, adds vehicle part damage tracking.

Inherits door mechanics: 'locked', 'open', 'locks[]', 'durability'.
Adds: 'side' (left/right/rear), 'condition', 'damage', 'installed'.
Use existing locks ($biometricLock, $rentableLock, etc.) in 'locks[]'.
Damageable - high damage may jam door or break locks.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Vehicle-part methods
    obj.setMethod(
      'isFunctional',
      `
      /**
       * Check if this door is functional.
       * @returns true if door can function, false otherwise
       */
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;
      return condition > 20 && damage < 80;
    `,
    );

    obj.setMethod(
      'takeDamage',
      `
      /**
       * Apply damage to this door.
       * @param amount - Amount of damage to apply (0-100 scale)
       */
      const amount = args[0] ?? 0;
      self.damage = Math.min(100, (self.damage ?? 0) + amount);
      if (self.damage > 50) {
        const conditionLoss = (self.damage - 50) * 0.5;
        self.condition = Math.max(0, (self.condition ?? 100) - conditionLoss);
      }
      // Also affect door durability
      self.durability = Math.max(0, (self.durability ?? 100) - amount * 0.5);
      return { damage: self.damage, condition: self.condition };
    `,
    );

    obj.setPropertyDescription(
      'side',
      'Door position: left, right, rear, front',
    );
    obj.setPropertyDescription(
      'condition',
      'Functional state 0-100. Higher is better.',
    );
    obj.setPropertyDescription(
      'damage',
      'Physical damage 0-100. Lower is better.',
    );
    obj.setPropertyDescription(
      'partType',
      'Part type for vehicle installation',
    );
    obj.setPropertyDescription(
      'installed',
      'Vehicle this door is installed on',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[VehicleDoorBuilder] Type 'vehicleDoor' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VehicleDoorBuilder);
