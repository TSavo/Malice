// QuickPrint - Roof (z=2)
// Rooftop access from apartment and fire escape
// Views of Pioneer Square and the city beyond

export const building = {
  name: 'QuickPrint',
  x: -12,
  y: 4,
  width: 2,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF LEVEL (z=2) - ROOFTOP
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Hatch Lock',
      description:
        'A simple padlock securing the roof hatch from below. The key is probably on a hook somewhere in the apartment.',
      difficulty: 3,
    },

    '%ROOF_NORTH': {
      name: 'QuickPrint Roof - North Side',
      description: `The roof of the QuickPrint building offers a modest view of Pioneer Square—two stories isn't much elevation, but it's enough to see over the neighboring buildings to Occidental Park and beyond. The tar paper underfoot is soft from decades of sun, patched in places where leaks developed.

A ladder descends through a hatch to the apartment below, the access point for whoever needed to check the HVAC or clear the drains. The hatch is heavy steel, hinged to swing open, a padlock dangling from the hasp.

Old lawn chairs sit by the parapet, arranged to face west toward Elliott Bay. Someone came up here to watch sunsets, to escape the apartment below, to smoke or drink or just be alone with the sky. The chairs are weathered but still functional, their plastic straps faded from green to grey.`,
      x: -13,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 85,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: {
          description: 'A ladder leads down through the roof hatch to the bedroom below',
          to: '%BEDROOM',
        },
        south: '%ROOF_SOUTH',
      },
      sittables: [
        {
          name: 'the lawn chairs',
          capacity: 2,
          emptyMsg:
            'Weathered lawn chairs face west, positioned for sunset views that no one watches anymore.',
          occupiedMsg: '%s sitting in a lawn chair on the roof',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'roof hatch',
          aliases: ['hatch', 'ladder'],
          description: `A steel hatch set into the roof, hinged on one side, with a ladder bolted to the interior wall below. The hatch is heavy—designed to keep weather out and to discourage casual visitors. A padlock dangles from the hasp, unlocked, the key somewhere in the apartment below. The ladder descends into darkness, into the bedroom of whoever lived here.`,
        },
        {
          prototype: 'furniture',
          name: 'HVAC unit',
          aliases: ['hvac', 'air conditioner', 'ac'],
          description: `An HVAC unit squats on the roof, its housing rusted, its fan blades still. The unit serviced both the shop below and the apartment—a single system for a building that wasn't designed for climate control. The compressor is silent. Whether it still works is a question for someone with electrical knowledge and a reason to care.`,
        },
        {
          prototype: 'describable',
          name: 'tar paper',
          aliases: ['roof', 'roofing'],
          description: `The roof is covered in tar paper, black and soft from years of sun. Patches of newer material mark spots where leaks were repaired—silver reflective coating over the patches, the standard fix for a building that couldn't afford a full re-roofing. The patches tell a story of maintenance, of someone who cared enough to fix things. That care ended.`,
        },
      ],
    },

    '%ROOF_SOUTH': {
      name: 'QuickPrint Roof - South Side',
      description: `The south side of the roof overlooks the alley below, the fire escape a zigzag of iron descending to the dumpster and the spray-painted declaration that PRINTERS NEVER DIE. From up here, the alley looks like a canyon between buildings, narrow and shadowed even when the sun is high.

The parapet on this side is lower, easier to lean against, which someone did often enough to wear the coping smooth. A bucket of sand sits by the edge—the kind used for cigarette butts, its contents long since scattered by wind and rain. An ashtray would have been more practical. Practicality wasn't the point.

The fire escape landing here is a small platform of metal grating, the top of the zigzag path down. The iron is rusted but solid, anchored to the building with bolts that have held for a century. The escape route is still viable, for anyone who needs one.`,
      x: -13,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 85,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: {
          description: 'The fire escape descends to the alley below',
          to: '%ALLEY',
        },
        north: '%ROOF_NORTH',
      },
      sittables: [
        {
          name: 'the parapet',
          capacity: 2,
          emptyMsg:
            'The low parapet offers a place to sit and watch the alley below, or the sky above.',
          occupiedMsg: '%s perched on the roof parapet',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'fire escape landing',
          aliases: ['fire escape', 'landing', 'platform'],
          description: `A small platform of metal grating marks the top of the fire escape, the transition point between roof and the zigzag descent to the alley. The grating is rusted but structurally sound, bolted to the building with anchors that have held for generations. The railing is waist-high, painted black over layers of previous paint. The escape route down is clear.`,
        },
        {
          prototype: 'describable',
          name: 'sand bucket',
          aliases: ['bucket', 'ashtray'],
          description: `A galvanized bucket that once held sand for cigarette disposal, now mostly empty, its contents scattered by weather. A few cigarette butts remain embedded in the residue at the bottom—the last smokes of the last smoker. The bucket is dented from someone kicking it, frustrated or drunk or both.`,
        },
        {
          prototype: 'describable',
          name: 'city view',
          aliases: ['view', 'skyline'],
          description: `From the south side of the roof, you can see the skyline of Seattle rising to the north—the Smith Tower a few blocks away, the modern towers of downtown beyond. To the south, the industrial area stretches toward the stadiums. The view encompasses a city that was alive with commerce and culture. The commerce has ended. The culture persists in different forms.`,
        },
      ],
    },
  },

  postProcessors: [],
};
