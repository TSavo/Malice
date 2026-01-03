// Terra Nova Gallery - Roof (z=1)
// Flat roof above the art gallery

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A modern combination lock on the roof hatch, its dial still functional.',
      difficulty: 4,
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - 2x2 flat roof
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NE': {
      name: 'Terra Nova - Roof (Northeast)',
      description: `The northeast corner of the gallery's roof, a minimalist space that matches the aesthetic below. The roofing is white membrane rather than tar paper—expensive, reflective, designed to reduce cooling costs in summer. The investment persists. The air conditioning doesn't.

The view northeast shows the industrial district, warehouses and workshops that once supplied the city's needs. The Supply Depot is visible, its bulk promising resources that no one distributes anymore.`,
      x: -15,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
    },

    '%ROOF_NW': {
      name: 'Terra Nova - Roof (Northwest)',
      description: `The northwest corner of the roof offers the best view of the waterfront and Elliott Bay beyond. The gallery's owners chose this location for the natural light that floods through the eastern windows. They probably appreciated the view too.

The white membrane roofing shows dirt here—footprints, bird droppings, the accumulated grime that white surfaces reveal so unforgivingly. Someone walked up here regularly once. The path they traced is visible in the dirt.

A sculpture base sits on the roof—a white pedestal with mounting bolts but no sculpture. Either the piece was moved, or it was never installed, or it walked away on its own. In an art gallery, any explanation is possible.`,
      x: -16,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'empty pedestal',
          aliases: ['pedestal', 'sculpture base', 'base'],
          description: `A white concrete pedestal, perhaps three feet tall, with four mounting bolts protruding from its top. Whatever sculpture was meant to stand here is gone—removed for protection, stolen for value, or simply never installed. The bolt holes are rusted. The pedestal waits. The art never came or never stayed.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'Terra Nova - Roof (Southwest)',
      description: `The southwest corner, looking toward S. Jackson Street and the neighborhood beyond. The sinkhole is visible from here—a gap in the urban fabric where buildings collapsed into flooded darkness. The view is unsettling. The water catches light.

A steel hatch is set into the roof here, leading down into the back office. The hatch is painted white to match the membrane roofing—attention to aesthetic detail that persists even on the roof.

The parapet on this side is higher than the rest, built up with cinder blocks that don't match the original construction. Someone added the height after the building was completed. Privacy, maybe. Or safety. Or just a desire not to see what lies below.`,
      x: -16,
      y: -6,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%OFFICE', locks: ['%ROOF_HATCH_LOCK'] },
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
    },

    '%ROOF_SE': {
      name: 'Terra Nova - Roof (Southeast)',
      description: `The southeast corner of the roof, facing 1st Avenue and the commercial district. The gallery was positioned to catch foot traffic from the avenue—collectors and tourists and curious passersby who might wander in and spend thousands. The foot traffic stopped. The gallery's position remains.

A drainage pipe runs along this edge, carrying rainwater from the roof to the street below. The pipe is copper, green with verdigris, valuable enough to strip but awkward to remove. The copper persists.

From here you can see other rooftops at similar heights—a landscape of tar paper and HVAC units and the occasional forgotten lawn chair. The rooftops form a second city, invisible from street level.`,
      x: -15,
      y: -6,
      z: 1,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NE',
        west: '%ROOF_SW',
      },
    },
  },
};
