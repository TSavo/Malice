import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Safe prototype
 * Secure lockable storage
 */
export class SafeBuilder implements Builder {
  static provides = ['safe'];
  static depends = ['furniture', 'pocket', 'lock'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('safe');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('safe', furniture, {
        properties: {
          name: 'Safe',
          description: 'A secure metal safe',
          weight: 100000,
          open: false,
          lock: null,
          contents: null,
          fireproof: true,

          abilities: `Heavy metal box. Very hard to break into - requires cracking or cutting.
Combination lock, keypad, or key lock. Fireproof protects contents from fire.
Too heavy to move when bolted down. Small safes can be stolen whole.
Drilling takes hours. Explosives may destroy contents.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('open', 'Whether safe door is open');
      this.obj.setPropertyDescription('lock', 'Objref to lock mechanism');
      this.obj.setPropertyDescription(
        'fireproof',
        'Whether contents survive fire',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SafeBuilder] Type 'safe' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SafeBuilder);
