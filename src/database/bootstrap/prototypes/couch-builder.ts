import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Couch prototype
 */
export class CouchBuilder implements Builder {
  static provides = ['couch'];
  static depends = ['furniture'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('couch');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('couch', furniture, {
        properties: {
          name: 'Couch',
          description: 'A cushioned seat for multiple people',
          weight: 35000,
          capacity: 3,
          occupants: [],

          abilities: `Seats multiple people. Can sleep on in a pinch (poor quality rest).
Cushions can hide small items. Heavy - hard to move alone.
Provides some cover if you duck behind it.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'capacity',
        'Number of people who can sit',
      );
      this.obj.setPropertyDescription(
        'occupants',
        'Array of objrefs to seated people',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CouchBuilder] Type 'couch' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CouchBuilder);
