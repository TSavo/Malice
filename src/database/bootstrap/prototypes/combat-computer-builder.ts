import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the CombatComputer type
 * AI fire control system for vehicle weapons.
 */
export class CombatComputerBuilder implements Builder {
  static provides = ['combatComputer'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('combatComputer');
    if (existing) {
      this.obj = existing;
      return;
    }

    const vehiclePart = await this.manager.load('vehiclePart');
    if (!vehiclePart) {
      throw new Error('VehiclePart type not found');
    }

    this.obj = await this.manager.define('combatComputer', vehiclePart, {
      properties: {
        name: 'Combat Computer',
        description: 'AI-powered fire control system.',
        partType: 'combatComputer',
        weight: 3000,
        condition: 100,
        damage: 0,

        abilities: `Fire control system. Tracks targets, aims turrets, calculates lead.

Uses faction IFF. Coordinates all hardpoint weapons. Works while moving.
Voice interface: "target that", "weapons free", "hold fire".`,
      },
      methods: {},
    });

    this.obj.setPropertyDescription('condition', 'Targeting accuracy degrades with condition');
    this.obj.setPropertyDescription('damage', 'High damage = targeting failure');
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    console.log(`[CombatComputerBuilder] Type 'combatComputer' auto-aliased`);
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CombatComputerBuilder);
