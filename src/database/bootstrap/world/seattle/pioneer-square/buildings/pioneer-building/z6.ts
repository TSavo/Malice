// Pioneer Building - Roof (z=6)
// Outdoor rooftop with views of Pioneer Square and beyond

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=6) - 4x3 outdoor rooftop
    // ═══════════════════════════════════════════════════════════════════

    // Row y=10 (north edge)
    '%ROOF_NW': {
      name: 'Pioneer Building - Roof (Northwest)',
      description: `The northwest corner of the Pioneer Building's roof, the highest point in this section of Pioneer Square. The view north stretches toward the Smith Tower and the commercial district beyond, the downtown skyline visible on clear days.

The roofing here is flat tar paper, soft underfoot and sticky in summer. A decorative parapet of carved sandstone runs along the edge, matching the Richardsonian Romanesque style of the building's facade. The parapet is weathered, its carvings softened by a century of rain.

An HVAC unit occupies this corner, its fan housing rusted but intact. The unit was a modern addition to a building designed before air conditioning existed. The retrofit is clumsy but functional—or was, when functionality mattered.`,
      x: 1,
      y: 10,
      z: 6,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_N1',
        south: '%ROOF_W1',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'HVAC unit',
          aliases: ['unit', 'air conditioner', 'AC'],
          description: `A rooftop HVAC unit, perhaps six feet on a side, its fan housing rusted and its coils exposed to the weather. The unit was a compromise between comfort and aesthetics—hidden on the roof where it couldn't ruin the building's historic facade. The compressor is silent, the refrigerant long since escaped. The unit cools nothing now.`,
        },
      ],
    },

    '%ROOF_N1': {
      name: 'Pioneer Building - Roof (North Center)',
      description: `The north-center section of the roof, offering unobstructed views of the city's commercial core. From here, the contrast between the old and new Seattle is stark—the Romanesque buildings of Pioneer Square giving way to the glass towers of the modern downtown.

A water tank stands here, a cylindrical wooden structure on steel legs. The tank provided gravity-fed water pressure to the upper floors in the days before municipal water systems were reliable. The wood is weathered gray, the hoops rusted, but the tank remains structurally sound—a monument to the self-sufficiency the building's designers required.

The parapet continues along the north edge, its sandstone carvings depicting oak leaves and acorns, the same pattern as the lobby's iron balusters.`,
      x: 2,
      y: 10,
      z: 6,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        east: '%ROOF_N2',
        south: '%ROOF_C1',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'water tank',
          aliases: ['tank', 'wooden tank', 'tower'],
          description: `A cylindrical wooden water tank, perhaps twelve feet tall and eight feet in diameter, mounted on steel legs that raise it another ten feet above the roof. The tank is made of redwood staves bound by iron hoops, weathered to silver-gray by decades of exposure. It was designed to provide water pressure when municipal systems failed. The tank is empty now, its lid slightly askew, but its engineering remains sound.`,
        },
      ],
    },

    '%ROOF_N2': {
      name: 'Pioneer Building - Roof (North-Center East)',
      description: `The north-center-east section of the roof, where the building's roofline meets the mechanical systems that keep old buildings functioning in modern times. Ventilation pipes cluster here, their galvanized steel dulled by weather, their outlets capped against rain.

The view northeast shows Occidental Park and the buildings that frame it—the Grand Central, the Merchants Cafe, the architectural vocabulary of 1890s Seattle preserved in brick and sandstone. The streets below are visible, their grid pattern clear from this height.

A maintenance walkway runs along the parapet, metal grating that provides access to the rooftop equipment. The walkway is rusted but sound, designed to support workers who no longer come.`,
      x: 3,
      y: 10,
      z: 6,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_N1',
        east: '%ROOF_NE',
        south: '%ROOF_C2',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'ventilation pipes',
          aliases: ['pipes', 'vents', 'exhaust'],
          description: `A cluster of ventilation pipes, galvanized steel weathered to a dull gray. The pipes draw air from the building's interior, venting whatever accumulated in the offices below. Some pipes are capped with rain guards; others are open, their interiors dark. The pipes hum slightly in strong wind, harmonics of hollow metal tubes. The building breathes through these pipes, even now.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Pioneer Building - Roof (Northeast)',
      description: `The northeast corner of the roof, where the building overlooks 2nd Avenue and the buildings to the east. The corner here features a decorative turret—a small tower that rises above the main roofline, its conical cap sheathed in copper that has weathered to verdigris green.

The turret is purely decorative, a flourish of Romanesque architecture that serves no practical purpose but delights nonetheless. A small window in its side offers views from inside, though the turret interior is accessible only from below.

From this corner, the Seattle Underground is invisible—buried beneath the streets that the building's architects raised to protect against floods. The building stands on engineered land, lifted above its origins.`,
      x: 4,
      y: 10,
      z: 6,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_N2',
        south: '%ROOF_E1',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'decorative turret',
          aliases: ['turret', 'tower', 'spire'],
          description: `A small decorative turret rises from the corner of the building, its conical cap sheathed in copper that has weathered to a beautiful verdigris green. The turret is perhaps ten feet tall from the roof surface, its windows narrow slits, its purpose entirely aesthetic. It gives the building a castle-like quality, a fantasy of permanence rendered in stone and copper.`,
        },
      ],
    },

    // Row y=9 (middle row)
    '%ROOF_W1': {
      name: 'Pioneer Building - Roof (West Center)',
      description: `The west-center section of the roof, facing 2nd Avenue and the buildings of Pioneer Square beyond. The view west shows the waterfront in the distance, Elliott Bay visible between the buildings, its gray waters merging with gray sky.

A skylight is set into the roof here, its glass frosted with age and grime. The skylight provided natural illumination to the floor below—the executive floor, where privacy was less important than prestige. The glass is intact but dirty, the light it admits filtered to a dim glow.

The parapet along the west edge is higher than the north—built up at some point to reduce wind exposure on this side of the building.`,
      x: 1,
      y: 9,
      z: 6,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_C1',
        south: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'executive skylight',
          aliases: ['skylight', 'glass', 'window'],
          description: `A large skylight, perhaps six feet square, set into the roof and framed in iron. The glass is thick, frosted with age, its surface obscured by decades of grime and fallen leaves. The skylight illuminates the executive floor below, or did when the glass was cleaner. Now it admits a dim, filtered light that speaks of neglect rather than luxury.`,
        },
      ],
    },

    '%ROOF_C1': {
      name: 'Pioneer Building - Roof (Center West)',
      description: `The center-west section of the roof, a relatively open area that might once have served as a gathering space for rooftop events. The tar paper here shows less wear than at the edges, protected from foot traffic by its position away from access points.

A pigeon roost has developed in one corner—a cluster of nests built from sticks and debris, occupied by birds that have claimed this territory as their own. The pigeons coo and flutter, undisturbed by visitors who rarely come.

The center of the roof offers panoramic views in all directions, the building's height providing perspective on the neighborhood that street level doesn't allow.`,
      x: 2,
      y: 9,
      z: 6,
      population: 0,
      ambientNoise: 35,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_N1',
        west: '%ROOF_W1',
        east: '%ROOF_C2',
        south: '%ROOF_S1',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'pigeon roost',
          aliases: ['roost', 'pigeons', 'nests', 'birds'],
          description: `A cluster of pigeon nests occupies one corner of this section, built from sticks, string, and urban debris. The birds have been here for years, generations of pigeons claiming this corner as territory. They coo and flutter at intrusion, but don't flee—humans are a memory here, not a threat. The droppings are extensive. The pigeons don't care.`,
        },
      ],
    },

    '%ROOF_C2': {
      name: 'Pioneer Building - Roof (Center East)',
      description: `The center-east section of the roof, where a maintenance shed stands against the elements. The shed is a simple structure of wood and corrugated metal, added sometime after the building's construction to shelter rooftop equipment and provide workspace for maintenance crews.

The shed's door hangs slightly open, revealing tools and supplies within—paint cans, brushes, a folded tarpaulin. The maintenance that required these supplies stopped, but the supplies remain, waiting.

From here, the decorative turret at the northeast corner is visible, its copper cap gleaming green against the gray sky.`,
      x: 3,
      y: 9,
      z: 6,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_N2',
        west: '%ROOF_C1',
        east: '%ROOF_E1',
        south: '%ROOF_S2',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'maintenance shed',
          aliases: ['shed', 'shack', 'storage'],
          description: `A simple shed of wood frame and corrugated metal, perhaps eight feet square. The door hangs slightly open, revealing the interior: paint cans stacked on shelves, brushes hardened in their containers, a folded tarpaulin, coils of rope, the accumulated supplies of rooftop maintenance. The shed is cluttered but organized—someone knew where things went. The organization persists.`,
        },
      ],
    },

    '%ROOF_E1': {
      name: 'Pioneer Building - Roof (East Center)',
      description: `The east-center section of the roof, overlooking Occidental Avenue and the buildings beyond. The decorative turret rises from the northeast corner, its copper cap catching light.

A collection of antenna masts stands here, relics of the building's communications history. A television antenna, massive and skeletal. A radio mast from an earlier era. A satellite dish, smaller and more modern, pointed at a sky that may or may not still have satellites to track.

The antennas tell the story of communication technology across decades, each addition mounted beside its predecessors rather than replacing them. The building accumulated receivers. Now none of them receive.`,
      x: 4,
      y: 9,
      z: 6,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NE',
        west: '%ROOF_C2',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'antenna array',
          aliases: ['antennas', 'masts', 'aerials'],
          description: `A forest of antenna masts rises from this section of the roof, the building's communications history preserved in metal. A massive television antenna, its elements spread like wings. A radio mast, perhaps thirty feet tall, guyed with cables. A satellite dish, smaller and more modern, its white surface dulled by weather. Each was cutting-edge once. Each is obsolete now. The signals they sought no longer come.`,
        },
      ],
    },

    // Row y=8 (south edge)
    '%ROOF_SW': {
      name: 'Pioneer Building - Roof (Southwest)',
      description: `The southwest corner of the roof, where the building overlooks S. Washington Street and the arcade below. The parapet here is carved with the building's dedication: PIONEER BUILDING 1892 ELMER FISHER ARCHITECT, the letters weathered but legible.

The view southwest shows the waterfront district and the industrial area beyond—the Fabrication Factory visible in the distance, its bulk dominating the skyline. The city spreads out in all directions, its grid pattern visible from this height.

A flagpole stands at this corner, its rope frayed, its hardware rusted. A flag once flew here—American, presumably, or perhaps the building owner's personal standard. The pole awaits a flag that won't be raised.`,
      x: 1,
      y: 8,
      z: 6,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_W1',
        east: '%ROOF_S1',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'flagpole',
          aliases: ['pole', 'flag pole', 'mast'],
          description: `A flagpole rises from the corner of the building, perhaps twenty feet tall, its aluminum surface oxidized to a dull gray. The rope that once raised and lowered the flag is frayed, its hardware rusted in place. No flag flies now—the pole stands bare against the sky, waiting for colors that won't be raised.`,
        },
        {
          prototype: 'describable',
          name: 'dedication carving',
          aliases: ['carving', 'inscription', 'dedication'],
          description: `Carved into the parapet, the building's dedication: PIONEER BUILDING 1892 ELMER FISHER ARCHITECT. The letters are weathered, their edges softened by a century of rain, but still clearly legible. Fisher designed a third of Pioneer Square's buildings. This was his finest. The building outlived him by a century and shows no sign of stopping.`,
        },
      ],
    },

    '%ROOF_S1': {
      name: 'Pioneer Building - Roof (South Center)',
      description: `The south-center section of the roof, overlooking S. Washington Street and the buildings beyond. The roof here shows the most wear—water pooling in low spots where the tar paper has settled, creating small ponds that attract gulls looking for places to bathe.

A cluster of exhaust vents rises from this section, the building's internal air escaping to the sky. The vents are capped with conical hats that spin in the wind, their bearings squeaking with age.

The sinkhole is visible from here—a gap in the urban fabric to the south where buildings collapsed into the flooded underground. The water catches light, its surface deceptively calm.`,
      x: 2,
      y: 8,
      z: 6,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_C1',
        west: '%ROOF_SW',
        east: '%ROOF_S2',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'roof puddles',
          aliases: ['puddles', 'water', 'pools'],
          description: `Low spots in the roof have collected water, creating shallow pools that never quite drain. The water is gray, reflecting the sky, its surface occasionally rippled by wind or landing birds. Gulls visit these puddles to bathe, their feathers scattering across the tar paper. The drainage has failed. The building holds water now.`,
        },
        {
          prototype: 'describable',
          name: 'spinning vents',
          aliases: ['vents', 'exhaust', 'turbines'],
          description: `A cluster of turbine vents rises from the roof, their conical caps spinning slowly in the breeze. The vents draw air from the building's interior, creating updrafts that escape through rotating housings. The bearings squeak with age, a high-pitched whine that rises and falls with the wind. The building exhales through these vents, its breath visible on cold mornings.`,
        },
      ],
    },

    '%ROOF_S2': {
      name: 'Pioneer Building - Roof (South-Center East)',
      description: `The south-center-east section of the roof, where the building looks out over Pioneer Square's historic heart. The roof hatch is located here, a steel frame set into the tar paper, its hinged cover secured with a padlock.

From this vantage point, the entire neighborhood is visible—the Richardsonian Romanesque buildings that Fisher designed, the later additions that tried to match their style, the streets that form the original core of Seattle.

A low wall surrounds the hatch area, providing a windbreak and safety barrier. Someone could sit here, back against the wall, and watch the city.`,
      x: 3,
      y: 8,
      z: 6,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%STAIR_Z5', locks: ['%ROOF_HATCH_LOCK'] },
        north: '%ROOF_C2',
        west: '%ROOF_S1',
        east: '%ROOF_SE',
      },
      sittables: [
        {
          name: 'the hatch wall',
          capacity: 3,
          emptyMsg:
            'A low wall surrounds the roof hatch, providing a windbreak and a place to sit.',
          occupiedMsg: '%s sitting against the wall by the roof hatch',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'roof hatch',
          aliases: ['hatch', 'access hatch', 'door'],
          description: `A steel hatch set into the roof, its frame flush with the tar paper surface. The hatch cover is heavy, hinged on one side, secured with a padlock. A sign warns: ROOF ACCESS - AUTHORIZED PERSONNEL ONLY. The authorization is unclear. The hatch leads down to the sixth-floor stairwell, the last step of the building's vertical journey.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Pioneer Building - Roof (Southeast)',
      description: `The southeast corner of the roof, where the building overlooks the intersection of 2nd Avenue and S. Washington Street. This corner offers perhaps the most complete view of Pioneer Square—the totem pole visible in the plaza below, the pergola still standing, the historic district spreading in all directions.

A second decorative turret rises from this corner, matching the one at the northeast. The paired turrets give the building a castle-like silhouette, a fantasy of permanence rendered in stone. The copper caps have weathered to the same verdigris green, siblings in oxidation.

The building's cornerstone is visible from here, set into the parapet facing the intersection—the building's credentials displayed for the city to see.`,
      x: 4,
      y: 8,
      z: 6,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_E1',
        west: '%ROOF_S2',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'southeast turret',
          aliases: ['turret', 'tower', 'spire'],
          description: `A decorative turret matching the one at the northeast corner, its copper cap weathered to verdigris green. The turret rises perhaps ten feet above the main roofline, its windows narrow slits, its stonework carved with the same oak-leaf patterns as the lobby's ironwork. The paired turrets give the building symmetry and gravitas, architectural punctuation marks at its corners.`,
        },
        {
          prototype: 'describable',
          name: 'visible cornerstone',
          aliases: ['cornerstone', 'stone', 'plaque'],
          description: `From this corner, the building's cornerstone is visible, set into the parapet facing the intersection. PIONEER BUILDING, it reads, the letters carved deep into sandstone. 1892. The stone has weathered, its edges softened, but the words remain clear. The building announced itself to the city from the moment it was completed. It still announces itself now.`,
        },
      ],
    },
  },
};
