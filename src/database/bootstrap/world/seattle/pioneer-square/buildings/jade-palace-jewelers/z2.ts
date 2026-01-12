// Jade Palace Jewelers - Roof Level (z=2)
// A typical International District rooftop
// Fire escapes, HVAC equipment, and the view of a neighborhood that no longer bustles

export const floor = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_ACCESS': {
      name: 'Roof Access Stairwell',
      description: `The stairwell narrows as it approaches the roof, the final flight less finished than the floors below—bare concrete steps, exposed pipes, the infrastructure that residents weren't meant to see. A metal door at the top opens to the roof, its crash bar corroded but functional.

A sign on the door reads: ROOF ACCESS - AUTHORIZED PERSONNEL ONLY. The authorization no longer matters. The personnel are gone. The door opens for anyone now.

The stairwell is darker here, no windows, the only light filtering up from the floors below. Graffiti on the walls suggests the roof was accessed recreationally at some point—maybe before the building fell silent, maybe after. The tags are faded, the artists unknown, their messages unreadable.`,
      x: 11,
      y: -6,
      z: 2,
      population: 0,
      ambientNoise: 0,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: {
          to: 'z1.ts#STAIRWELL',
          description: 'Stairs lead down to the residential floor',
        },
        up: '%ROOF',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'roof door',
          aliases: ['door', 'exit'],
          description: `A metal fire door with a push bar, the kind designed for emergency egress to the roof. The door is rusted but opens with effort. A sign warns: ALARM WILL SOUND. The alarm hasn't had power in fifty-five years. The warning is hollow.`,
        },
        {
          prototype: 'describable',
          name: 'stairwell graffiti',
          aliases: ['graffiti', 'tags'],
          description: `Graffiti covers the walls of the upper stairwell—the territorial markings of people who used this building after it emptied. Tags in languages and scripts, symbols that meant something to someone. Some are dates: years in the first decade after the Burning. Someone kept coming here. Then they stopped.`,
        },
      ],
    },

    '%ROOF': {
      name: 'Rooftop',
      description: `The roof is flat tar and gravel, typical of commercial buildings from the last century. HVAC equipment clusters near the stairwell exit, its compressors silent, its fans frozen. The equipment kept the building livable—heating the apartments in winter, cooling them in summer. It's been inert for fifty-five years, weathering in place.

From here, the International District spreads in every direction: narrow buildings packed close, fire escapes climbing walls, the density that made this neighborhood feel like Hong Kong or Taipei transplanted to Seattle. The buildings are dark now, their windows reflecting sky that has no one to look back at it.

The edge of the roof is bounded by a low parapet, capped with sheet metal that has rusted to orange-brown. Fire escapes descend from this level, the emergency exits that connected roof to street in case of fire. The fire never came to this building. The residents left by other means.

A small utility shed occupies one corner, its door hanging open, whatever tools it held long since taken. Pigeon guano covers surfaces in white patches—the birds that colonized the city after humans left, nesting where they please.`,
      x: 11,
      y: -5,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%ROOF_ACCESS',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'hvac equipment',
          aliases: ['hvac', 'ac', 'equipment', 'compressor'],
          description: `A cluster of HVAC equipment—compressors, condensers, the machinery that made indoor climate control possible. The units are rusted, their fans frozen with corrosion, their electrical connections long since degraded. They're monuments to comfort that no longer exists. Birds have nested in the housing of the largest unit, adding their debris to the general decay.`,
        },
        {
          prototype: 'describable',
          name: 'neighborhood view',
          aliases: ['view', 'district', 'buildings'],
          description: `From the roof, the International District is visible in its entirety: narrow buildings packed together, fire escapes zigzagging up exterior walls, the signs in Chinese and Vietnamese and Korean that gave the neighborhood its character. The signs are faded now, many fallen. The buildings are dark, their purposes ended. But the density remains—the physical infrastructure of a community that no longer exists.`,
        },
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'stairs', 'ladder'],
          description: `A fire escape descends from the roof's edge, its iron structure rusted to orange-brown but still structurally sound. The stairs zigzag down the building's exterior, ending at a ladder that once dropped to street level. Fire escapes were the International District's informal social spaces—residents sat on landings on hot nights, children played on the platforms, laundry hung from rails. The fire escapes are silent now, but they still connect roof to street for anyone willing to trust rusted iron.`,
        },
        {
          prototype: 'describable',
          name: 'utility shed',
          aliases: ['shed', 'storage'],
          description: `A small utility shed in one corner, its door hanging from one hinge. The shed once held tools for roof maintenance—probably tar and patching materials, a ladder, the equipment that kept the roof watertight. The tools are gone, taken or rusted to uselessness. The shed is empty except for debris and pigeon droppings.`,
        },
        {
          prototype: 'describable',
          name: 'pigeon droppings',
          aliases: ['guano', 'bird', 'droppings', 'pigeons'],
          description: `White patches of pigeon guano cover surfaces across the roof—the HVAC equipment, the parapet, the shed. Pigeons colonized the city after humans left, nesting in buildings that no longer keep them out. The droppings layer over time, creating stratigraphy of occupation. The birds are probably nearby, watching from other rooftops. This is their city now.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop parapet',
          aliases: ['parapet', 'edge', 'wall'],
          description: `A low parapet walls the roof's edge, capped with sheet metal that has rusted through in places. The parapet is about waist-high—enough to prevent accidental falls, not enough to prevent intentional ones. The International District lies beyond the edge: the streets that held its commerce, the buildings that held its people, the neighborhood that held its identity. All of it visible, all of it empty.`,
        },
      ],
    },
  },
};
