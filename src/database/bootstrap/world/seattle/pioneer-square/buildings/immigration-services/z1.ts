// Immigration Services - Roof (z=1)
// Flat roof with makeshift additions, 2x2 open area

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - Open 2x2 area
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NW': {
      name: 'Immigration Services - Roof (Northwest)',
      description: `The northwest corner of the roof, where the parapet meets at a right angle and creates a sheltered nook against the wind off Elliott Bay. The tar paper underfoot has been patched a hundred times, each repair a different shade of black, a topographic map of decades of Seattle rain.

A steel hatch in the floor leads down to the staff area below. Heavy-duty, retrofitted with hinges and a hasp that don't match the building's age. Someone added roof access after the original construction.

The roof stretches open to the south and east, flat and exposed. The parapet is low—knee height—more suggestion than barrier.`,
      x: -16,
      y: 11,
      z: 1,
      imageOnDisk: 'immigration-services-roof-northwest-x-16-y11-z1.png',
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%STAFF', locks: ['%HATCH_LOCK'] },
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
    },

    '%ROOF_NE': {
      name: 'Immigration Services - Roof (Northeast)',
      description: `The northeast corner offers the best view of Smith Tower, rising thirty-eight stories just across 1st Avenue. The white terra cotta is stained grey now, weathered by decades of Seattle rain, but the building still dominates the skyline. The Chinese guardian figures at each corner are just visible from here, still watching over a city that's mostly empty.

The debris wall is visible to the north—the collapsed buildings that seal Pioneer Square from downtown. From up here you can see where the Merrill Building pancaked, each floor compressed into the one below. The destruction looks almost deliberate from this angle, like someone folded the city in on itself.

Water pools in a low spot here where the tar paper has settled unevenly. The puddle never quite drains, reflecting grey sky.`,
      x: -15,
      y: 11,
      z: 1,
      imageOnDisk: 'immigration-services-roof-northeast-x-15-y11-z1.png',
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
    },

    '%ROOF_SW': {
      name: 'Immigration Services - Roof (Southwest)',
      description: `The southwest corner faces the waterfront, Elliott Bay spreading grey and cold beyond the crumbling seawall. On clear days you can see the Olympic Mountains across the water. Today is not a clear day. Today the horizon dissolves into mist and low clouds, water and sky blurring together into uniform grey.

The tar paper is particularly worn in this corner, soft spots where water has worked its way beneath the surface. The building's bones show through in places—original decking boards, swollen and split with age. Step carefully.

Wind comes steady off the bay here, salt-smell and cold. Nothing blocks it.`,
      x: -16,
      y: 10,
      z: 1,
      imageOnDisk: 'immigration-services-roof-southwest-x-16-y10-z1.png',
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
    },

    '%ROOF_SE': {
      name: 'Immigration Services - Roof (Southeast)',
      description: `The southeast corner of the roof, exposed and windswept. The parapet meets at a corner here, concrete worn smooth by weather and time. Generations of initials have been scratched into the surface, layered over each other, the oldest nearly illegible.

The view south shows the stadium district beyond the debris that blocks all passage. The sports complexes are visible but unreachable, their massive forms unchanged by whatever ended everything else. Lumen Field's distinctive roof. T-Mobile Park's retractable dome, frozen half-open.

This corner catches crosswinds from the bay and the city grid. It's never still up here.`,
      x: -15,
      y: 10,
      z: 1,
      imageOnDisk: 'immigration-services-roof-southeast-x-15-y10-z1.png',
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
