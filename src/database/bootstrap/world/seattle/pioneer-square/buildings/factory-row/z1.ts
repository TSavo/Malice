// Factory Row - Roof (z=1)
// Flat roof over the strip mall, accessible from The Grinder's back room

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'biometricLock',
      name: 'Roof Hatch Scanner',
      description:
        'A palm scanner mounted beside the ladder, caked with dust and grease.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Roof access denied.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - 3x1 strip over the shops
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_W': {
      name: 'Factory Row - Roof (West)',
      description: `The western end of Factory Row's flat roof, directly above the Nutrient Dispensary. The tar paper is heat-softened and sticky underfoot, bubbling where moisture has worked beneath the surface. Industrial vents protrude from the roofline—exhaust from the refrigeration units below, cycling air that smells faintly of preservatives and nothing organic.

The Fabrication Factory looms to the north, its bulk blocking most of the skyline. From up here you can see the intake vents on its lower floors, drawing in whatever the city provides. The factory's presence dominates everything in this corner of Pioneer Square.

A low parapet marks the roof's edge, barely knee-height. The view west shows the waterfront and Elliott Bay beyond, grey water merging with grey sky.`,
      x: -20,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_C',
      },
    },

    '%ROOF_C': {
      name: 'Factory Row - Roof (Center)',
      description: `The center section of Factory Row's roof, above the shuttered pawn shop. The tar paper here is in worse shape than either end—patched repeatedly, the patches themselves patched, layers of repair dating back decades. Someone gave up on proper maintenance long ago.

A metal hatch is set into the roof surface, its edges sealed with weatherstripping that's cracked and peeling. The hatch leads down into The Grinder, the bar at the eastern end. Roof access through a bar—either convenient or concerning, depending on your perspective.

An old TV antenna still stands here, its elements bent and corroded. Whatever signal it once received stopped broadcasting years ago. Now it serves as a perch for the gulls that circle overhead, watching for anything edible.`,
      x: -19,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_W',
        east: '%ROOF_E',
        down: { room: '%BAR', locks: ['%ROOF_HATCH_LOCK'] },
      },
    },

    '%ROOF_E': {
      name: 'Factory Row - Roof (East)',
      description: `The eastern end of Factory Row's roof, above The Grinder. The tar paper is stained here—old spills, bird droppings, the accumulated grime of a roof no one maintains. A few lawn chairs sit rusted near the parapet, remnants of someone's break spot before whatever drove them away.

The alley is visible below to the north, a narrow gap between Factory Row and the buildings beyond. From up here you can see how the strip mall was wedged into whatever space remained after the larger structures claimed their ground.

S. Washington Street runs along the southern edge, the traffic—what little there is—visible as movement more than detail. The city feels different from a rooftop. Smaller. Quieter. More survivable.`,
      x: -18,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'rusted lawn chairs',
          description: `Three lawn chairs arranged near the parapet, their aluminum frames corroded and their webbing rotted through. Someone used to sit up here, maybe on breaks, maybe after hours. The chairs face west toward the water, positioned for sunset views that the clouds usually block.

One chair has a cup holder with a faded beer can still in it, crushed and sun-bleached. A memorial to someone's last good day up here.`,
        },
      ],
    },
  },
};
