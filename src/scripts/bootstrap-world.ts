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
  console.log(
    '  --full           Build complete world with geometry + buildings',
  );
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
  console.log(
    `Mode: ${opts.full ? 'FULL (prototypes + systems + geometry)' : 'SYSTEMS (prototypes + core systems only)'}`,
  );
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
    console.log(
      '  ✅ Created $.pronoun, $.proportional, $.room, $.bodyFactory',
    );

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

      // Build spatial index
      console.log('');
      console.log('Phase 8: Building spatial index...');
      const spatial = manager.getAliases().get('spatial');
      if (spatial) {
        const result = (await spatial.call('rebuild')) as { indexed?: number };
        console.log(`  ✅ Indexed ${result?.indexed || 0} rooms`);
      } else {
        console.warn('  ⚠️  $spatial not found - skipping index rebuild');
      }

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

  // Totem Pole → Occidental Ave S & S. Main St (the zero point)
  if (aliases.totemPole && aliases.room) {
    const totemPole = await manager.load(aliases.totemPole);
    const roomPrototype = await manager.load(aliases.room);
    // Find the intersection room at x=-7, y=0 (Occidental & Main)
    const zeroPoint = await manager.findByProperty(
      'name',
      'Occidental Ave S & S. Main St',
    );

    if (totemPole && zeroPoint.length > 0 && roomPrototype) {
      const groundRoom = zeroPoint[0];
      await totemPole.call('moveTo', groundRoom);

      // Register $bottomOfTotemPole alias
      await objectManager.call('addAlias', 'bottomOfTotemPole', groundRoom.id);
      console.log(
        `  ✅ Placed Totem Pole at zero point (#${groundRoom.id}), aliased $bottomOfTotemPole`,
      );

      // Create the top-of-pole room at z=1
      const topRoom = await manager.create({
        parent: roomPrototype,
        properties: {
          name: 'Top of the Totem Pole',
          description: `Sixty feet above the plaza, you crouch among Raven's carved wings. The platform here—if you can call it that—is barely wide enough for one person, a maintenance ledge added when CorpSec installed the cameras decades ago. The wood is weathered smooth, grey as bone.

The city spreads below in a grid of empty streets and dead buildings. From here you can see the whole of Pioneer Square: Occidental Park's dead trees, the Smith Tower rising to the north, the seawall and the grey water beyond. The wind is stronger at this height, cold and constant.

Raven's beak points at the sky inches from your face. The camera lenses in its eyes are visible from here—small, dark, watching. A red LED pulses faintly behind the left eye. Someone is always recording.

The only way down is the way you came up: sixty feet of carved cedar, hand over hand past Wolf and Whale and Bear.`,
          x: groundRoom.get('x') ?? -7,
          y: groundRoom.get('y') ?? 0,
          z: 1,
          outdoor: true,
          abilities: `The top of the sixty-foot totem pole. A narrow maintenance ledge among Raven's wings.

CLIMBING DOWN: player.moveTo($bottomOfTotemPole)

NARRATION when descending:
- $topOfTotemPole sees: "[Player] begins the long climb down, disappearing below Raven's beak."
- $bottomOfTotemPole sees: "[Player] descends the totem pole, emerging from among the carved
  figures to drop the last few feet to the concrete."

NARRATION when someone arrives from below:
- $bottomOfTotemPole sees: "[Player] climbs the totem pole, ascending hand over hand past
  Bear and Whale and Wolf until they disappear among Raven's wings."
- $topOfTotemPole sees: "[Player] pulls themselves up onto the narrow platform, wind
  whipping at their clothes, sixty feet above the plaza."

SURVEILLANCE: The camera in Raven's left eye has a clear view of anyone up here.
Pluribus sees all.

CAPACITY: One person. Maybe two if they're friendly. Three would be suicide.`,
        },
        methods: {},
      });

      // Register $topOfTotemPole alias
      await objectManager.call('addAlias', 'topOfTotemPole', topRoom.id);
      console.log(
        `  ✅ Created Top of the Totem Pole room (#${topRoom.id}), aliased $topOfTotemPole`,
      );
    } else {
      console.warn('  ⚠️  Could not place Totem Pole - room not found');
    }
  }

  // Observation Deck Telescopes - 4 at cardinal directions on 38th floor
  if (aliases.telescope) {
    const telescopeProto = await manager.load(aliases.telescope);
    if (telescopeProto) {
      const telescopeSpots = [
        {
          roomName: 'Smith Tower - 38th Floor - Observation Deck',
          name: 'West Telescope',
          desc: 'A coin-operated telescope facing west toward the waterfront and Elliott Bay.',
        },
        {
          roomName: 'Smith Tower - 38th Floor - Glass Dome Catwalk',
          name: 'North Telescope',
          desc: 'A coin-operated telescope facing north toward downtown Seattle.',
        },
        {
          roomName: 'Smith Tower - 38th Floor - East Terrace',
          name: 'East Telescope',
          desc: 'A coin-operated telescope facing east toward the International District.',
        },
        {
          roomName: 'Smith Tower - 38th Floor - Southeast Alcove',
          name: 'South Telescope',
          desc: 'A coin-operated telescope facing south toward the stadiums and SoDo.',
        },
      ];

      for (const spot of telescopeSpots) {
        const rooms = await manager.findByProperty('name', spot.roomName);
        if (rooms.length > 0) {
          const room = rooms[0];
          const telescope = await manager.create({
            parent: telescopeProto,
            properties: {
              name: spot.name,
              description: spot.desc,
              mountZ: 38,
            },
            methods: {},
          });
          await telescope.call('moveTo', room);
          await telescope.call('calibratePointsOfInterest');
          console.log(
            `  ✅ Placed ${spot.name} in ${spot.roomName.split(' - ').pop()} (#${room.id})`,
          );
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('bootstrap-world failed:', err);
  process.exit(1);
});
