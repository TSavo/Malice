import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds default faction instances
 * Creates $continuum and $cartel factions during bootstrap
 *
 * Run AFTER:
 * - FactionBuilder (creates $faction prototype)
 * - FactionManagerBuilder (creates $factionManager singleton)
 * - CharGenBuilder (creates $charGen)
 * - CartelCharGenBuilder (creates $cartelCharGen)
 */
export class DefaultFactionsBuilder {
  private continuum: RuntimeObject | null = null;
  private cartel: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Check if factions already exist
    if (aliases.continuum) {
      this.continuum = await this.manager.load(aliases.continuum);
    }
    if (aliases.cartel) {
      this.cartel = await this.manager.load(aliases.cartel);
    }

    // Skip if both exist
    if (this.continuum && this.cartel) {
      return;
    }

    // Load dependencies
    const factionPrototype = aliases.faction
      ? await this.manager.load(aliases.faction)
      : null;
    const factionManager = aliases.factionManager
      ? await this.manager.load(aliases.factionManager)
      : null;
    const charGen = aliases.charGen
      ? await this.manager.load(aliases.charGen)
      : null;
    const cartelCharGen = aliases.cartelCharGen
      ? await this.manager.load(aliases.cartelCharGen)
      : null;

    if (!factionPrototype) {
      console.warn('⚠️  $faction prototype not found - skipping faction creation');
      return;
    }
    if (!factionManager) {
      console.warn('⚠️  $factionManager not found - skipping faction creation');
      return;
    }

    // Create Continuum faction
    if (!this.continuum) {
      this.continuum = await this.manager.create({
        parent: factionPrototype,
        properties: {
          name: 'Continuum',
          description: 'The default governing authority of Malice',
          domain: 'malice.life',
          charGen: charGen?.id || null,
          leader: null,
          sshHostKey: null,
          ports: null,
          index: 0, // First faction gets index 0
        },
        methods: {},
      });

      // Register with faction manager
      if (factionManager) {
        await factionManager.call('register', this.continuum);
      }

      console.log(`  ✓ Created $continuum faction (#${this.continuum.id})`);
    }

    // Create Gray Cartel faction
    if (!this.cartel) {
      this.cartel = await this.manager.create({
        parent: factionPrototype,
        properties: {
          name: 'Gray Cartel',
          description: 'Underground resistance network',
          domain: 'graycartel.com',
          charGen: cartelCharGen?.id || null,
          leader: null,
          sshHostKey: null,
          ports: null,
          index: 1, // Second faction gets index 1
        },
        methods: {},
      });

      // Register with faction manager
      if (factionManager) {
        await factionManager.call('register', this.cartel);
      }

      console.log(`  ✓ Created $cartel faction (#${this.cartel.id})`);
    }
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    if (this.continuum) {
      await objectManager.call('addAlias', 'continuum', this.continuum.id);
      console.log(`  ✓ Registered continuum alias -> #${this.continuum.id}`);
    }

    if (this.cartel) {
      await objectManager.call('addAlias', 'cartel', this.cartel.id);
      console.log(`  ✓ Registered cartel alias -> #${this.cartel.id}`);
    }
  }
}
