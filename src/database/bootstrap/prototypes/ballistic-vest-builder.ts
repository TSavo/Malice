import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the BallisticVest prototype
 */
export class BallisticVestBuilder implements Builder {
  static provides = ['ballisticVest'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('ballisticVest');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('ballisticVest', armor, {
        properties: {
          name: 'Ballistic Vest',
          description: 'Kevlar body armor',
          covers: ['torso'],
          protection: 40,
          armorType: 'ballistic',
          weight: 4000,

          abilities: `Stops pistol rounds and shrapnel. Worn under or over clothing.
Multiple hits degrade protection. Won't stop rifle rounds or stabs.
Bruising from blunt trauma even when bullet stopped.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BallisticVestBuilder] Type 'ballisticVest' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BallisticVestBuilder);
