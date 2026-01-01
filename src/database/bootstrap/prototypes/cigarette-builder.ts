import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Cigarette prototype
 */
export class CigaretteBuilder implements Builder {
  static provides = ['cigarette'];
  static depends = ['smokable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cigarette');
    if (existing) {
      this.obj = existing;
    } else {
      const smokable = await this.manager.load('smokable');
      if (!smokable) throw new Error('Smokable type not found');

      this.obj = await this.manager.define('cigarette', smokable, {
        properties: {
          name: 'Cigarette',
          description: 'A tobacco cigarette',
          portions: 10, // ~10 drags
          remaining: 10,
          weight: 10,
          effects: {
            calm: { intensity: 15, decay: 0.2 },
            focus: { intensity: 5, decay: 0.3 },
          },

          abilities: `Quick smoke. ~10 drags. Calms nerves, aids focus.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CigaretteBuilder] Type 'cigarette' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CigaretteBuilder);
