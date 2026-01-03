import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the IED prototype
 * Improvised Explosive Device
 */
export class IedBuilder implements Builder {
  static provides = ['ied'];
  static depends = ['explosive'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('ied');
    if (existing) {
      this.obj = existing;
    } else {
      const explosive = await this.manager.load('explosive');
      if (!explosive) throw new Error('Explosive type not found');

      this.obj = await this.manager.define('ied', explosive, {
        properties: {
          name: 'IED',
          description: 'Improvised explosive device',
          weight: 3000,
          damage: 180,
          blastRadius: 12,
          triggerType: 'remote',
          concealed: true,

          abilities: `Homemade bomb. Variable triggers: pressure plate, tripwire, remote, timer.
Concealed in everyday objects - bags, vehicles, trash.
Variable power depending on materials. Often includes shrapnel.
Unreliable - may fail or detonate prematurely. Bomb squad can disarm.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'triggerType',
        'How it detonates: remote, pressure, tripwire, timer',
      );
      this.obj.setPropertyDescription(
        'concealed',
        'Whether hidden in container/debris',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[IedBuilder] Type 'ied' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(IedBuilder);
