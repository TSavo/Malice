// Zeitgeist Building - Roof (z=4)
// Outdoor rooftop with garden and communal space

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
        out: '%ROOF_ACCESS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF LEVEL (z=4) - OUTDOOR ROOFTOP
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_ACCESS': {
      name: 'Zeitgeist Building - Roof Access',
      description: `The elevator penthouse rises from the building's roof, a brick structure housing the freight elevator's machinery. The door is propped open with a cinder block, welcoming rather than secured. Someone decided this space belonged to everyone.

A small landing connects the elevator penthouse to the roof proper. A fire escape ladder descends from here to the street—the kind of emergency exit that also serves as an unofficial entrance for those who know.

The freight elevator's call button glows faintly in the penthouse shadow. Above, open sky; around, the rooftops of Pioneer Square; below, the hum of machinery that's kept this building vertical since 1892.`,
      x: -12,
      y: 1,
      z: 4,
      population: 0,
      ambientNoise: 20,
      lighting: 95,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_GARDEN',
        east: '%ROOF_EAST',
        west: '%ROOF_WEST',
        down: '%LOFT_LOBBY',
        'in': '%E',
      },
      sittables: [
        {
          name: 'the penthouse steps',
          capacity: 2,
          emptyMsg: 'Brick steps leading into the penthouse offer casual seating.',
          occupiedMsg: '%s sitting on the penthouse steps',
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
          const floorNumber = 4;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here at rooftop level.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. Far below, the elevator machinery awakens.';
          }

          return 'The button clicks, but nothing responds.';
        `,
      },
      elevatorId: '%E',
    },

    '%ROOF_GARDEN': {
      name: 'Zeitgeist Building - Rooftop Garden',
      description: `The building's residents claimed this rooftop, transforming industrial neglect into urban oasis. Raised beds built from salvaged lumber line the north edge, filled with soil that someone hauled up four flights. The plants growing wild now—tomatoes gone feral, herbs spreading beyond their borders, flowers that seed themselves each year.

A small greenhouse constructed from old windows creates a microclimate for more delicate plants. Inside: seedlings in various stages, tools hung on hooks, the accumulated equipment of people who believed in growing things. The glass is dirty but intact.

A rain barrel system catches water from the small pitched roof of the greenhouse, gravity-feeding to the beds through drip irrigation someone installed with more enthusiasm than expertise. It works, mostly.

The view north shows Pioneer Square's roofscape: water towers, solar panels, the architectural layer cake of a neighborhood that kept building up because it couldn't build out.`,
      x: -12,
      y: 2,
      z: 4,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_ACCESS',
        east: '%ROOF_CORNER',
        southwest: '%ROOF_WEST',
      },
      sittables: [
        {
          name: 'a garden bench',
          capacity: 2,
          emptyMsg: 'A wooden bench sits among the raised beds, weathered silver by exposure.',
          occupiedMsg: '%s sitting in the rooftop garden',
        },
        {
          name: 'the greenhouse floor',
          capacity: 3,
          emptyMsg: 'The greenhouse floor is dry and sun-warmed.',
          occupiedMsg: '%s resting in the greenhouse',
        },
      ],
    },

    '%ROOF_WEST': {
      name: 'Zeitgeist Building - West Roof',
      description: `The western edge of the roof, where a low parapet offers views of 1st Avenue four stories below. The parapet is just high enough to satisfy building codes, just low enough to feel precarious. No one has added railings. Artists aren't known for their safety consciousness.

A collection of mismatched chairs has accumulated here—lawn chairs, office chairs, a car seat bolted to a frame. This was clearly the gathering spot, the place to watch sunsets when Seattle deigned to provide them. Beer bottles in a recycling bin, cigarette butts in a coffee can, the evidence of evenings spent up here.

A tarp stretched between poles creates a shade structure for hot days. Solar lights on stakes provide illumination at night—dim now, their batteries failing, but someone thought about how this space would be used.

The neighboring building's wall rises close on the north side, a mural visible on its surface: a giant eye, watching, rendered in blue and green.`,
      x: -13,
      y: 1,
      z: 4,
      population: 0,
      ambientNoise: 22,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_ACCESS',
        northeast: '%ROOF_GARDEN',
      },
      sittables: [
        {
          name: 'a lawn chair',
          capacity: 1,
          emptyMsg: 'A faded lawn chair faces west toward the sunset.',
          occupiedMsg: '%s lounging in the lawn chair',
        },
        {
          name: 'an office chair',
          capacity: 1,
          emptyMsg: 'A rolling office chair sits incongruously on the roof.',
          occupiedMsg: '%s in the rolling chair',
        },
        {
          name: 'the car seat',
          capacity: 2,
          emptyMsg: 'A car backseat bolted to a wooden frame provides surprisingly comfortable seating.',
          occupiedMsg: '%s in the car seat',
        },
        {
          name: 'floor cushions',
          capacity: 4,
          emptyMsg: 'Weatherproof cushions are scattered under the tarp shade.',
          occupiedMsg: '%s on the rooftop cushions',
        },
      ],
    },

    '%ROOF_EAST': {
      name: 'Zeitgeist Building - East Roof',
      description: `The eastern section of the roof is more utilitarian: HVAC equipment, the building's original water tower (dry now, unused), conduit and piping running to destinations unknown. But even here, someone added human touches—a wind chime made from silverware, a weathervane in the shape of a fish, small sculptures placed on equipment housings.

A fire escape ladder descends the building's east face, the official emergency egress that's been unofficially used for decades. The rungs are worn smooth by hands and feet.

The view east looks over the alley and the backs of buildings—a less glamorous perspective than the front, but honest. Exhaust vents, trash bins, the infrastructure of urban life. Someone painted EVERYTHING IS CONNECTED on the water tower in letters that have faded but not disappeared.`,
      x: -11,
      y: 1,
      z: 4,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_ACCESS',
        north: '%ROOF_CORNER',
      },
      sittables: [
        {
          name: 'a equipment housing',
          capacity: 2,
          emptyMsg: 'A flat-topped HVAC housing provides improvised seating.',
          occupiedMsg: '%s perched on the equipment housing',
        },
      ],
    },

    '%ROOF_CORNER': {
      name: 'Zeitgeist Building - Roof Corner',
      description: `The northeast corner of the roof, where views extend in two directions: north over Washington Street toward downtown, east over the alley toward Elliott Bay. On clear days—rare in Seattle—you can see the Olympics across the water. Most days you see gray, in varying shades.

Someone built a small platform here from shipping pallets, raising a viewing deck a few feet above roof level. A hammock stretches between posts anchored in concrete-filled buckets. The engineering is questionable but has held so far.

The old water tower looms nearby, its wooden staves dried and cracked. It hasn't held water in years, but someone painted constellations on its interior—visible through the gaps—stars and lines and the names of patterns the Greeks named.

A telescope on a tripod points at the sky, its lens clouded. Someone was watching for something. Stars, maybe. Answers, possibly.`,
      x: -11,
      y: 2,
      z: 4,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_EAST',
        west: '%ROOF_GARDEN',
      },
      sittables: [
        {
          name: 'a hammock',
          capacity: 2,
          emptyMsg: 'A canvas hammock sways gently between anchored posts.',
          occupiedMsg: '%s swaying in the hammock',
        },
        {
          name: 'the viewing platform',
          capacity: 4,
          emptyMsg: 'A pallet platform provides elevated seating at the roof corner.',
          occupiedMsg: '%s on the viewing platform',
        },
        {
          name: 'an old crate',
          capacity: 1,
          emptyMsg: 'A wooden crate sits beside the telescope.',
          occupiedMsg: '%s sitting by the telescope',
        },
      ],
    },
  },

  postProcessors: [],
};
