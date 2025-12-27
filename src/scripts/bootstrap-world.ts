/**
 * bootstrap-world.ts - Complete world creation CLI
 *
 * Creates the MOO world from scratch:
 * - Minimal objects (#1 Root, #2 System)
 * - All prototypes (PrototypeOrchestrator)
 * - Core systems (CoreSystemBuilder)
 * - World geometry (if --full)
 *
 * Usage:
 *   npm run bootstrap:world          # Prototypes + core systems only
 *   npm run bootstrap:world:full     # Full world with geometry + buildings
 */

import { AliasLoader } from '../database/bootstrap/alias-loader.js';
import { CoreSystemBuilder } from '../database/bootstrap/core-system-builder.js';
import { MinimalBootstrap } from '../database/bootstrap/minimal-bootstrap.js';
import { PrototypeOrchestrator } from '../database/bootstrap/prototype-orchestrator.js';
import { ObjectDatabase } from '../database/object-db.js';
import { ObjectManager } from '../database/object-manager.js';

type CliOptions = {
  full: boolean;
  mongoUri: string;
  dbName: string;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    full: false,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB || process.env.DB_NAME || 'malice',
  };

  for (const arg of argv) {
    if (arg === '--full') opts.full = true;
    else if (arg === '--systems') opts.full = false;
    else if (arg.startsWith('--mongoUri='))
      opts.mongoUri = arg.slice('--mongoUri='.length);
    else if (arg.startsWith('--dbName='))
      opts.dbName = arg.slice('--dbName='.length);
    else if (arg === '--help' || arg === '-h') {
      throw new Error('help');
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(
    'Usage: node --import tsx src/scripts/bootstrap-world.ts [--full | --systems]',
  );
  console.log('');
  console.log('Creates the MOO world from scratch.');
  console.log('');
  console.log('Environment:');
  console.log('  MONGO_URI  MongoDB URI (default: mongodb://localhost:27017)');
  console.log('  MONGO_DB   Database name (default: malice)');
  console.log('  DB_NAME    (dev compose) Database name');
  console.log('');
  console.log('Options:');
  console.log(
    '  --systems        Build prototypes + core systems only (default)',
  );
  console.log('  --full           Build complete world with geometry + buildings');
  console.log('  --mongoUri=URI   Override Mongo connection URI');
  console.log('  --dbName=NAME    Override Mongo database name');
}

async function main() {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof Error && err.message === 'help') {
      printHelp();
      process.exit(0);
    }
    throw err;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🏗️  Bootstrap World');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${opts.full ? 'FULL (prototypes + systems + geometry)' : 'SYSTEMS (prototypes + core systems only)'}`);
  console.log(`Database: ${opts.dbName} @ ${opts.mongoUri}`);
  console.log('');

  const db = new ObjectDatabase(opts.mongoUri, opts.dbName);
  await db.connect();

  try {
    const manager = new ObjectManager(db);

    // Load existing objects into memory (may be empty)
    console.log('Loading existing objects...');
    await manager.loadAll();

    // Phase 1: Minimal (Root, System)
    console.log('');
    console.log('Phase 1: Minimal bootstrap (Root, System)...');
    const minimalBootstrap = new MinimalBootstrap(manager);
    await minimalBootstrap.bootstrap();

    // Phase 2: Prototypes
    console.log('');
    console.log('Phase 2: Building prototypes...');
    const prototypeBuilder = new PrototypeOrchestrator(manager);
    await prototypeBuilder.buildPrototypes();
    console.log('  ✅ Created Describable, Agent, Human, Player prototypes');

    // Phase 3: Core systems
    console.log('');
    console.log('Phase 3: Building core systems...');
    const coreSystemBuilder = new CoreSystemBuilder(manager);
    await coreSystemBuilder.buildCoreSystems();
    console.log('  ✅ Created AuthManager, CharGen, PreAuthHandler, Recycler');
    console.log('  ✅ Created $.pronoun, $.proportional, $.room, $.bodyFactory');

    // Phase 4: Reload aliases
    console.log('');
    console.log('Phase 4: Loading aliases...');
    const aliasLoader = new AliasLoader(manager);
    await aliasLoader.loadAliases();
    console.log('  ✅ Loaded all aliases');

    // Phase 5: World geometry (if --full)
    if (opts.full) {
      console.log('');
      console.log('Phase 5: Building world geometry...');

      const { WorldBuilder } = await import(
        '../database/bootstrap/world-builder.js'
      );
      const { BuildingBuilder } = await import(
        '../database/bootstrap/building-builder.js'
      );

      const worldBuilder = new WorldBuilder(manager);
      await worldBuilder.build();

      const buildingBuilder = new BuildingBuilder(manager);
      await buildingBuilder.build();
      console.log('  ✅ Built Smith Tower and other buildings');

      // Register global building object aliases
      console.log('');
      console.log('Phase 6: Registering building aliases...');
      await registerBuildingAliases(manager);

      // Place special objects
      console.log('');
      console.log('Phase 7: Placing special objects...');
      await placeSpecialObjects(manager);

      // Final alias reload
      await aliasLoader.loadAliases();
    }

    console.log('');
    console.log('Flushing pending writes...');
    await manager.flushWrites();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ World bootstrap complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } finally {
    await db.disconnect();
  }
}

async function registerBuildingAliases(manager: ObjectManager): Promise<void> {
  const objectManager = await manager.load(0);
  if (!objectManager) return;

  const citySigns = await manager.findByProperty(
    'name',
    'City Announcement Board',
  );
  if (citySigns[0]) {
    await objectManager.call('addAlias', 'cityAnnounce', citySigns[0].id);
    console.log('  ✅ Registered $.cityAnnounce');
  } else {
    console.warn('  ⚠️  City Announcement Board not found');
  }

  const theCoreRooms = await manager.findByProperty('name', 'The Core');
  if (theCoreRooms[0]) {
    await objectManager.call('addAlias', 'theCore', theCoreRooms[0].id);
    console.log('  ✅ Registered $.theCore');
  } else {
    console.warn('  ⚠️  The Core not found');
  }

  const theBlindRooms = await manager.findByProperty('name', 'The Blind');
  if (theBlindRooms[0]) {
    await objectManager.call('addAlias', 'theBlind', theBlindRooms[0].id);
    console.log('  ✅ Registered $.theBlind');
  } else {
    console.warn('  ⚠️  The Blind not found');
  }
}

async function placeSpecialObjects(manager: ObjectManager): Promise<void> {
  const objectManager = await manager.load(0);
  if (!objectManager) return;

  const aliases = (objectManager.get('aliases') || {}) as Record<
    string,
    number
  >;

  // Sister Gray → Sister's Quarters (z=-5)
  if (aliases.sisterGray) {
    const sisterGray = await manager.load(aliases.sisterGray);
    const sistersQuarters = await manager.findByProperty(
      'name',
      "Sister's Quarters",
    );
    if (sisterGray && sistersQuarters.length > 0) {
      await sisterGray.call('moveTo', sistersQuarters[0]);
      console.log(
        `  ✅ Placed Sister Gray in Sister's Quarters (#${sistersQuarters[0].id})`,
      );
    }
  }

  // Pluribus → The Core (z=-1, Smith Tower datacenter)
  if (aliases.pluribus && aliases.theCore) {
    const pluribus = await manager.load(aliases.pluribus);
    const theCore = await manager.load(aliases.theCore);
    if (pluribus && theCore) {
      await pluribus.call('moveTo', theCore);
      console.log(`  ✅ Placed Pluribus in The Core (#${theCore.id})`);
    }
  }

  // The Mask → The Blind (z=-6, underground complex)
  if (aliases.theMask && aliases.theBlind) {
    const theMask = await manager.load(aliases.theMask);
    const theBlind = await manager.load(aliases.theBlind);
    if (theMask && theBlind) {
      await theMask.call('moveTo', theBlind);
      console.log(`  ✅ Placed The Mask in The Blind (#${theBlind.id})`);
    }
  }
}

main().catch((err) => {
  console.error('bootstrap-world failed:', err);
  process.exit(1);
});
