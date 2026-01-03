import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Bench prototype
 * Outdoor seating for public spaces - parks, streets, plazas.
 *
 * Unlike indoor furniture (couch, chair), benches are typically:
 * - Weather-resistant (wood, concrete, metal)
 * - Bolted to the ground
 * - Found in public spaces
 *
 * Properties:
 * - capacity: How many people can sit (default 3)
 * - occupants: Array of objrefs to seated people
 * - material: 'wood', 'concrete', 'metal', 'stone'
 * - boltedDown: inherited from describable (usually true for public benches)
 */
export class BenchBuilder implements Builder {
  static provides = ['bench'];
  static depends = ['furniture'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('bench');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('bench', furniture, {
        properties: {
          name: 'Bench',
          description:
            'A simple bench for sitting. The kind you see in parks and plazas.',
          weight: 50000, // 50kg - heavy, typically bolted down
          capacity: 3,
          occupants: [],
          material: 'wood',
          boltedDown: true,

          abilities: `Outdoor seating for public spaces. Seats up to 'capacity' people.

SITTING: People sit via 'sit on bench' - adds them to 'occupants' array.
When full, no more can sit. Standing removes from 'occupants'.

MATERIALS: Wood benches weather and splinter. Concrete is cold but lasts.
Metal conducts temperature - freezing in winter, burning in summer.
Stone is timeless but uncomfortable.

SLEEPING: Can sleep on a bench (poor quality rest, exposed to elements).
Homeless encampments often cluster around benches.

BOLTED: Most public benches are bolted down. 'boltedDown' true means
it can't be picked up or moved.`,
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
      this.obj.setPropertyDescription(
        'material',
        "Construction material: 'wood', 'concrete', 'metal', 'stone'",
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BenchBuilder] Type 'bench' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BenchBuilder);
