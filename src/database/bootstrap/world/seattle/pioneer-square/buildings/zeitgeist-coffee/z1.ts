// Zeitgeist Coffee - Roof (z=1)
// Flat roof above the art crowd coffee shop

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Hatch Lock',
      description:
        'A basic padlock on the roof hatch, the same kind used on storage units.',
      difficulty: 3,
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - 2x2 flat roof
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SW': {
      name: 'Zeitgeist - Roof (Southwest)',
      description: `The southwest corner of the coffee shop's roof, a flat expanse of aging tar paper with the characteristic smell of a roof that's been baking in summer sun for decades. The smell persists even now, a ghost of heat trapped in the tar.

A steel hatch is set into the roof here, its frame dented where someone once dropped something heavy on it. The ladder below leads into the back room of the coffee shop. Employees probably came up here for smoke breaks. The cigarette butts scattered nearby confirm it.

The view southwest shows other rooftops stretching toward the waterfront—a landscape of HVAC units and antenna masts and the occasional forgotten piece of furniture.`,
      x: -16,
      y: 0,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%BACK', locks: ['%ROOF_HATCH_LOCK'] },
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'cigarette butts',
          aliases: ['butts', 'cigarettes'],
          description: `Dozens of cigarette butts scattered across the tar paper, accumulated over years of smoke breaks. The filters are brown with age, the brands unidentifiable, the nicotine long since leached away. Someone stood here regularly, staring at the city, thinking about whatever baristas think about. The thoughts are gone. The evidence remains.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Zeitgeist - Roof (Southeast)',
      description: `The southeast corner of the roof, facing 1st Avenue and the street life that once flowed past the coffee shop's windows. The street is quiet now, the foot traffic that kept Zeitgeist profitable reduced to occasional movement.

A large ventilation fan is mounted here, its blades rusted still. The fan once drew the smell of espresso and baking up through the building, venting it over the rooftops. The smell is gone now. The machinery remains, a monument to coffee that no one brews.

From here you can see Occidental Park to the east—the dead trees, the empty benches, the plaza that once hosted farmers markets and art walks. The park waits for crowds that don't come.`,
      x: -15,
      y: 0,
      z: 1,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'ventilation fan',
          aliases: ['fan', 'exhaust fan', 'vent'],
          description: `A large exhaust fan, perhaps three feet across, its blades frozen in rust. The fan once drew the smell of coffee and pastries up through the building, dispersing them over the rooftops. The motor has seized. The smell has faded. The fan remains, pointing at a sky that no longer cares about espresso.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Zeitgeist - Roof (Northwest)',
      description: `The northwest corner offers views toward the waterfront and the industrial district beyond. The Fabrication Factory is visible in the distance, its bulk dominating the skyline. Closer, the rooftops of Pioneer Square spread in all directions—a patchwork of eras and conditions, some maintained, most neglected.

The roofing here shows more wear than the rest—water pooling in low spots, the tar paper soft underfoot. The drainage has failed. The puddles are permanent, growing algae that no one scrubs away.

Someone left a coffee mug up here, a white ceramic cup with the Zeitgeist logo faded by sun and rain. The cup is empty now, its contents long since evaporated. A final pour that no one finished.`,
      x: -16,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'abandoned coffee mug',
          aliases: ['mug', 'cup', 'coffee cup'],
          description: `A white ceramic coffee mug with the Zeitgeist logo—a stylized Z in faded blue. The mug sits on the parapet, its contents long since evaporated, leaving a brown ring at the bottom. Someone set it down and never came back for it. The mug has weathered sun and rain, its glaze crazed with fine cracks. It waits to be reclaimed. No one reclaims it.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Zeitgeist - Roof (Northeast)',
      description: `The northeast corner of the roof, the highest point of the building where the parapet rises to meet a decorative cornice. The view here encompasses most of Pioneer Square—the Grand Central Building to the north, the Pioneer Building to the east, the maze of streets and alleys that once bustled with commerce.

The cornice is cast iron, decorative scrollwork that speaks to an era when even commercial buildings aspired to beauty. The iron is rusted now, the scrollwork crumbling in places, but the intention remains visible. Someone cared about this corner. The caring shows.

A nest of some kind—pigeons, probably—has accumulated in the gap between cornice and roof. Feathers and droppings and bits of debris form a mass that no one has disturbed. The birds have claimed their territory.`,
      x: -15,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'pigeon nest',
          aliases: ['nest', 'birds nest'],
          description: `A messy accumulation of twigs, feathers, and debris wedged into the gap between cornice and roof. Pigeons have claimed this corner, building generation after generation of nests atop the remains of previous occupants. The cooing is constant. The droppings are extensive. The birds have been here longer than the coffee shop was in business. They'll be here longer still.`,
        },
      ],
    },
  },
};
