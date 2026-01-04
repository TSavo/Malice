// Merchant's Cafe - Roof (z=3)
// Flat roof with old HVAC equipment and fire escape access
// 3-story historic building (ground + 2 upper floors + roof)

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=3) - Open 2x2 area atop 3-story building
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NW': {
      name: "Merchant's Cafe - Roof (Northwest)",
      description: `The northwest corner of the roof, three stories above the street. A rusted HVAC unit squats against the parapet like a mechanical gargoyle. The unit hasn't run in months—the fan blades are frozen with corrosion, the condenser coils bent and weathered. It once kept the dining room comfortable. Now it just takes up space.

The tar paper underfoot is soft in places, tacky when the sun heats it, brittle when the cold sets in. Patches overlap patches, each repair a different shade of black. The building is over a century old. The roof has been replaced countless times.

A steel hatch in the floor leads down through the upper floors to the kitchen below, installed decades after the original construction. The hatch is heavy, counterweighted, designed for maintenance access to the rooftop equipment.`,
      x: -16,
      y: -2,
      z: 3,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%HALL_Z2',
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'rusted HVAC unit',
          aliases: ['hvac', 'air conditioner', 'unit'],
          description: `A commercial HVAC unit, the kind that kept restaurant dining rooms comfortable through Seattle's damp winters and rare hot summers. The housing is rusted, the fan blades frozen, the electrical conduit corroded green. It's been silent for months. The kitchen below is whatever temperature the weather provides.`,
        },
        {
          prototype: 'describable',
          name: 'roof hatch',
          aliases: ['hatch', 'access'],
          description: `A steel hatch set into the roof, its frame welded to reinforcing beams below. The hatch is counterweighted for easy opening, though the hinges have begun to seize from lack of use. A hasp allows for padlocking, but no lock is present. Someone wanted to be able to reach the roof. The reason is lost to history.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: "Merchant's Cafe - Roof (Northeast)",
      description: `The northeast corner overlooks the intersection where Main Street meets 1st Avenue, the heart of what was once Pioneer Square's commercial district. From up here you can see the hitching post still bolted to the curb below—cast iron shaped like a horse's head, a relic from when carriages actually stopped here.

The parapet is low brick, capped with concrete that has cracked and spalled over the decades. Initials carved into the concrete date back generations—lovers, vandals, bored workers on smoke breaks. The newest carvings are months old. The oldest are nearly illegible.

The view north shows the debris wall that seals Pioneer Square from downtown, collapsed buildings piled into an impassable barrier.`,
      x: -15,
      y: -2,
      z: 3,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'carved initials',
          aliases: ['initials', 'carvings', 'graffiti'],
          description: `Initials carved into the concrete cap of the parapet, layered over each other like sediment. "JM + KL 1987." "SEATTLE RULES." "R.I.P. COBAIN." The carvings span decades, each one a moment when someone stood here with a knife or key and decided to leave a mark. The marks remain. The people who made them are gone.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: "Merchant's Cafe - Roof (Southwest)",
      description: `The southwest corner of the roof catches wind from the waterfront, salt air mixing with the urban smell of old tar and rusted metal. Elliott Bay is visible to the west, grey water stretching toward the Olympic Mountains—or where the mountains would be, if the clouds ever lifted enough to see them.

A fire escape ladder is bolted to the parapet here, its rungs descending to the alley below. The ladder is rusted but solid, clearly used at some point for more than emergencies. A small platform at the top provides standing room for one.

Pigeon droppings coat the southwest corner in white and grey—the birds have claimed this section, their evidence everywhere. Feathers drift in the wind.`,
      x: -16,
      y: -3,
      z: 3,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire escape ladder',
          aliases: ['ladder', 'fire escape'],
          description: `A steel ladder bolted to the outside of the parapet, descending to the alley below. The rungs are rusted but solid, the mounting brackets still secure. This wasn't just for emergencies—the wear patterns suggest regular use, staff members sneaking up for cigarette breaks, perhaps. Or something less innocent.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: "Merchant's Cafe - Roof (Southeast)",
      description: `The southeast corner of the roof, exposed to crosswinds that make standing here uncomfortable in any weather. The parapet meets at a right angle, creating a corner that catches every gust. The view south shows the stadium district beyond barriers of debris—Lumen Field's distinctive roof, T-Mobile Park's retractable dome frozen half-open.

A vent pipe rises here, exhaust from the kitchen below. The pipe is capped with a rotating turbine that once spun with rising heat from the stoves. The turbine is frozen now, seized with corrosion, pointing whichever direction it pointed when it stopped.

Water pools in a low spot where the tar paper has settled, never quite draining. The puddle reflects grey sky.`,
      x: -15,
      y: -3,
      z: 3,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NE',
        west: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'kitchen vent',
          aliases: ['vent', 'exhaust', 'pipe'],
          description: `A large vent pipe rising from the kitchen below, capped with a turbine that once spun with rising heat from the stoves. The turbine is frozen now, its blades seized with rust and grease. The smell of old cooking oil still rises from the pipe when the wind is right—ghost aromas from a kitchen that no longer cooks.`,
        },
        {
          prototype: 'describable',
          name: 'puddle',
          aliases: ['water', 'pool'],
          description: `A permanent puddle in a low spot of the roof, where the tar paper has settled over time. The water is grey and still, reflecting the sky above. Leaves and debris float on the surface. The puddle never fully drains—it evaporates in summer, refills with rain, a small ecosystem on a forgotten roof.`,
        },
      ],
    },
  },
};
