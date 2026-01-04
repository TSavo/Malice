// Pioneer Antiques - Roof (z=2)
// Flat roof with storage and a view of Pioneer Square
// Pigeons nested here before they too disappeared

export const building = {
  name: 'Pioneer Antiques',
  x: -3,
  y: 7,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF': {
      name: 'Pioneer Antiques - Roof',
      description: `The flat roof of the antique store has accumulated fifty-five years of Seattle weather and urban debris. The tar paper is cracked and peeling in places, patched in others with materials that didn't quite match—the ongoing battle against Seattle rain that the building eventually lost. Water stains on the ceiling below testify to leaks that were never fixed.

Pigeon guano covers significant portions of the roof, the accumulated deposits of decades of nesting—though no pigeons remain. The birds that once infested urban rooftops are gone now, their population collapsed along with the humans who fed them inadvertently. The guano has hardened to white stone, a monument to species that shared the city with humans.

A rooftop storage shed contains furniture too damaged to sell, too valuable to discard—pieces awaiting restoration that never came. The shed door hangs open, revealing shapes under dust-covered tarps.

From here, the Pioneer Building is visible to the east, its distinctive roofline marking it as one of the neighborhood's landmarks. Other brick buildings of Pioneer Square spread in all directions, their uniform cornices creating a coherent skyline of decay.`,
      x: -4,
      y: 6,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z1.ts#BOOK_ROOM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'pigeon guano',
          aliases: ['guano', 'droppings', 'bird'],
          description: `White deposits of pigeon guano hardened to stone, covering significant portions of the roof surface. The pigeons nested here for decades, generations of birds that never knew they were living on borrowed time. The birds are gone now—their population collapsed when the humans who fed them disappeared. The guano remains, a geological record of cohabitation.`,
        },
        {
          prototype: 'cabinet',
          name: 'storage shed',
          aliases: ['shed', 'storage'],
          description: `A rooftop storage shed, its door hanging open, its interior visible: furniture shapes under dust-covered tarps, pieces too damaged to sell but too valuable to discard. A rocking chair with a broken runner, a table with water damage, a mirror with a cracked frame. The furniture was waiting for restoration. The restorer never came.`,
        },
        {
          prototype: 'describable',
          name: 'patched roof',
          aliases: ['patches', 'tar', 'repairs'],
          description: `The roof surface shows decades of repairs: tar patches of different colors and ages, attempts to stop leaks that kept appearing. The battle against Seattle rain was never-ending. The building lost eventually—water stains on the ceiling below testify to defeats. The patches remain, a history of maintenance that ended mid-effort.`,
        },
        {
          prototype: 'describable',
          name: 'pioneer square view',
          aliases: ['view', 'skyline', 'buildings'],
          description: `From here, Pioneer Square spreads in all directions: brick buildings with uniform cornices, the architectural coherence enforced after the Great Fire of 1889. The Pioneer Building is visible to the east, its distinctive roofline marking it as a landmark. Smith Tower rises in the middle distance. The buildings stand, their contents empty, their purpose obsolete.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop debris',
          aliases: ['debris', 'litter'],
          description: `Urban debris accumulated over decades: a deflated basketball, plastic bags fused to the tar paper, shards of glass from something thrown from above. A faded newspaper from before The Burning, its headlines about events that seemed important at the time. The roof collected what the wind brought. No one cleaned it.`,
        },
      ],
    },
  },

  postProcessors: [],
};
