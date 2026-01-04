// Zeitgeist Building - Second Floor (z=2)
// Artist studios - working spaces for rent

export const building = {
  name: 'Zeitgeist Building',
  x: -13,
  y: 1,
  width: 3,
  height: 3,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR (shared reference)
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%STUDIO_LOBBY',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%LOCK_A': {
      prototype: 'rentableLock',
      name: 'Studio A Lock',
      description: 'A digital lock with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 100,
    },

    '%LOCK_B': {
      prototype: 'rentableLock',
      name: 'Studio B Lock',
      description: 'A digital lock with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 100,
    },

    '%LOCK_C': {
      prototype: 'rentableLock',
      name: 'Studio C Lock',
      description: 'A digital lock with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 100,
    },

    '%LOCK_D': {
      prototype: 'rentableLock',
      name: 'Studio D Lock',
      description: 'A digital lock with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 100,
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════════════════

    '%DOOR_A': {
      prototype: 'door',
      name: 'Studio A Door',
      description: 'A solid door with a frosted glass panel.',
      locked: true,
      open: false,
      locks: ['%LOCK_A'],
    },

    '%DOOR_B': {
      prototype: 'door',
      name: 'Studio B Door',
      description: 'A solid door with a frosted glass panel.',
      locked: true,
      open: false,
      locks: ['%LOCK_B'],
    },

    '%DOOR_C': {
      prototype: 'door',
      name: 'Studio C Door',
      description: 'A solid door with a frosted glass panel.',
      locked: true,
      open: false,
      locks: ['%LOCK_C'],
    },

    '%DOOR_D': {
      prototype: 'door',
      name: 'Studio D Door',
      description: 'A solid door with a frosted glass panel.',
      locked: true,
      open: false,
      locks: ['%LOCK_D'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=2) - ARTIST STUDIOS
    // ═══════════════════════════════════════════════════════════════════

    '%STUDIO_LOBBY': {
      name: 'Zeitgeist Building - Studio Floor',
      description: `The second floor hallway connects four artist studios, the spaces carved from what was once open warehouse floor. The corridor is narrow, walls painted a neutral grey that's accumulated the smudges and scuffs of creative work—paint drips, charcoal smears, the residue of art in progress.

Frosted glass panels let light through from the studios, shadows moving behind them when anyone's working. The floor is painted concrete, cleaned periodically but never quite returning to its original color. A shared bathroom is visible at the hall's end.

A bulletin board on the wall holds notices: studio shares wanted, equipment for sale, announcements for shows that may or may not have happened. The community of artists that lived here continues in these artifacts even when the artists themselves are absent.

The freight elevator gate stands against the south wall. Stairs wind down to the gallery below.`,
      x: -12,
      y: 1,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%HALL_N',
        east: { room: '%STUDIO_B', door: '%DOOR_B', locks: ['%LOCK_B'] },
        west: { room: '%STUDIO_A', door: '%DOOR_A', locks: ['%LOCK_A'] },
        down: '%GALLERY_LOBBY',
        up: '%LOFT_LOBBY',
        'in': '%E',
      },
      sittables: [
        {
          name: 'a hall bench',
          capacity: 2,
          emptyMsg: 'A simple wooden bench sits against the wall.',
          occupiedMsg: '%s waiting in the hallway',
        },
      ],
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          await obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 2;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here at the studio floor.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. The freight elevator creaks somewhere in the shaft.';
          }

          return 'The button clicks, but nothing responds.';
        `,
      },
      elevatorId: '%E',
    },

    '%HALL_N': {
      name: 'Zeitgeist Building - North Hall',
      description: `The northern end of the studio corridor, where two more studio doors face each other across the narrow space. A window at the hall's end looks north over the alley behind the building, the view mostly walls and fire escapes, the unglamorous backside of Pioneer Square.

A fire extinguisher hangs on the wall, its inspection tag current—someone was maintaining this building right up until the end. A shared utility closet holds cleaning supplies, lightbulbs, the maintenance detritus of any building with tenants.

The smell here is a mixture of paint and turpentine and something vaguely chemical—the residue of artists who work in mediums that don't always smell pleasant. Ventilation was a concern. Proper ventilation was expensive. Artists made do.`,
      x: -12,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STUDIO_LOBBY',
        east: { room: '%STUDIO_D', door: '%DOOR_D', locks: ['%LOCK_D'] },
        west: { room: '%STUDIO_C', door: '%DOOR_C', locks: ['%LOCK_C'] },
      },
    },

    '%STUDIO_A': {
      name: 'Studio A - Painter\'s Space',
      description: `A painter's studio, the kind of space artists dream about and rarely afford. North-facing windows fill the room with even, cool light—the light that painters have sought since painting began. The walls are splattered with decades of color, a palimpsest of every artist who's worked here.

An easel stands near the window, holding a canvas that's been primed but never painted. The artist left it ready, expecting to return. Tubes of oil paint litter a worktable, some hardened, some still viable. Brushes soak in jars of murky solvent.

A daybed pushed against the wall suggests the artist sometimes slept here, which violates every lease agreement ever written for artist studios. The violation was universal. Nobody complained.

The smell is linseed oil and turpentine and the particular dust of old buildings. A small sink in the corner has paint stains that will never come out.`,
      x: -13,
      y: 1,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: { room: '%STUDIO_LOBBY', door: '%DOOR_A', locks: ['%LOCK_A'] },
      },
      sittables: [
        {
          name: 'a paint-stained stool',
          capacity: 1,
          emptyMsg: 'A wooden stool splattered with paint sits before the easel.',
          occupiedMsg: '%s perched on the painter\'s stool',
        },
        {
          name: 'a daybed',
          capacity: 2,
          emptyMsg: 'A narrow daybed pushed against the wall offers rest.',
          occupiedMsg: '%s resting on the daybed',
        },
      ],
    },

    '%STUDIO_B': {
      name: 'Studio B - Sculptor\'s Workshop',
      description: `A sculptor's space, the floor reinforced to handle weight and impact. Stone dust dulls every surface despite the industrial air filtration humming in the corner. Tools hang on pegboard walls: chisels, mallets, rasps, the implements of someone who argues with rock.

A half-finished marble piece stands on a heavy turntable—a figure emerging from rough stone, the face defined while the body remains trapped. The work is skilled, patient, the kind of project that takes years. Whether those years will ever be completed is unclear.

A pneumatic hammer sits silent, its air compressor unplugged. The dust collector bag is full and needs emptying. Someone left mid-project, mid-day, mid-thought. The stone waits, patient as it's been for millions of years.`,
      x: -11,
      y: 1,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%STUDIO_LOBBY', door: '%DOOR_B', locks: ['%LOCK_B'] },
      },
      sittables: [
        {
          name: 'a work bench',
          capacity: 1,
          emptyMsg: 'A sturdy work bench holds sculpting tools.',
          occupiedMsg: '%s at the sculptor\'s bench',
        },
        {
          name: 'a resting chair',
          capacity: 1,
          emptyMsg: 'A heavy chair sits in the corner, covered in stone dust.',
          occupiedMsg: '%s resting in the dusty chair',
        },
      ],
    },

    '%STUDIO_C': {
      name: 'Studio C - Photography Darkroom',
      description: `A photographer's studio, half of it converted into a working darkroom. The darkroom door is marked with a red light that no longer works—the "in use" signal for a process that's becoming archaeology. Inside: enlargers, trays for developer and fixer, strings for hanging prints to dry.

The studio side is a shooting space, bare walls painted white, lighting equipment on stands positioned around a central area. A camera on a tripod faces nothing. The equipment is professional, expensive, the accumulated investment of someone serious about their work.

Contact sheets pin to a cork board show the last project: portraits of hands, close-up studies of wrinkles and calluses. The work matches what's hanging in the gallery below. This was Marcus Chen's studio. His archive lives on even when he doesn't.`,
      x: -13,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: { room: '%HALL_N', door: '%DOOR_C', locks: ['%LOCK_C'] },
      },
      sittables: [
        {
          name: 'a photography stool',
          capacity: 1,
          emptyMsg: 'A height-adjustable stool sits before the camera equipment.',
          occupiedMsg: '%s at the photography setup',
        },
      ],
    },

    '%STUDIO_D': {
      name: 'Studio D - Mixed Media',
      description: `A studio that defies categorization—the space of an artist who works in everything and nothing. Found objects fill shelving units: broken electronics, doll parts, industrial waste, natural debris. Each item is labeled with date and location of acquisition. The collection is vast and mysterious.

A large work table dominates the center, currently holding an assemblage in progress: television components arranged around a bird's nest, the wiring forming a halo or a cage or both. The piece has no obvious meaning, which probably means something.

The walls are covered with sketches, photographs, newspaper clippings, maps—the visual detritus of a mind that sees connections everywhere. String connects some items, like a detective's murder board. The artist was investigating something. Whether they found answers is lost with them.`,
      x: -11,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%HALL_N', door: '%DOOR_D', locks: ['%LOCK_D'] },
      },
      sittables: [
        {
          name: 'a swivel chair',
          capacity: 1,
          emptyMsg: 'An office chair on wheels sits at the work table.',
          occupiedMsg: '%s working at the assemblage table',
        },
        {
          name: 'a bean bag',
          capacity: 2,
          emptyMsg: 'A worn bean bag chair slumps in the corner.',
          occupiedMsg: '%s sunk into the bean bag',
        },
      ],
    },
  },

  postProcessors: [],
};
