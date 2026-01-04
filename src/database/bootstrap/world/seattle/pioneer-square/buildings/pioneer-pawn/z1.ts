// Pioneer Pawn & Loan - Second Floor (z=1)
// Owner's apartment above the shop - abandoned 55 years
// The pawnbroker died in The Burning or its aftermath

export const building = {
  name: 'Pioneer Pawn & Loan',
  x: 5,
  y: 14,
  width: 2,
  height: 3,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%APT_LOCK': {
      prototype: 'lock',
      name: 'Apartment Lock',
      description:
        'A residential deadbolt, simpler than the commercial locks downstairs.',
      difficulty: 3,
    },
    '%APT_DOOR': {
      prototype: 'door',
      name: 'Apartment Door',
      description:
        'A solid wooden door separating the stairwell from the apartment. The door has three locks—paranoia was professional for a pawn shop owner.',
      locked: true,
      open: false,
      locks: ['%APT_LOCK'],
      material: 'wood',
      durability: 70,
    },

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Hatch Lock',
      description: 'A simple padlock on the roof hatch.',
      difficulty: 2,
    },
    '%ROOF_HATCH': {
      prototype: 'door',
      name: 'Roof Hatch',
      description:
        'A metal hatch leading to the flat roof, its hinges stiff from disuse.',
      locked: false,
      open: false,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 65,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - OWNER'S APARTMENT
    // ═══════════════════════════════════════════════════════════════════

    '%UPSTAIRS_LANDING': {
      name: 'Pioneer Pawn - Upstairs Landing',
      description: `The stairs from the back room emerge into a small landing, the transition from commercial to residential marked by a change in flooring—linoleum gives way to worn hardwood. The owner lived here, above his inventory, always within earshot of the alarm system that protected his livelihood.

The apartment door has three locks—deadbolt, chain, and a secondary bolt—the paranoia of someone who dealt in other people's desperation. A small window on the landing looks down on the back alley, the view a pawn shop owner might check before opening the back door.

A narrow staircase continues up to a roof hatch, the emergency egress for a building designed with security in mind.`,
      x: 5,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#BACK_ROOM',
        west: {
          description: 'The apartment door has multiple locks',
          door: '%APT_DOOR',
          to: '%LIVING_ROOM',
        },
        up: {
          description: 'A narrow staircase leads to the roof hatch',
          door: '%ROOF_HATCH',
          to: '%ROOF',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'alley window',
          aliases: ['window', 'view'],
          description: `A small window looking down on the back alley, positioned for checking who's at the back door before opening it. The glass is reinforced—not bulletproof, but resistant. The view shows dumpsters, fire escapes, the utilitarian backside of Pioneer Square.`,
        },
      ],
    },

    '%LIVING_ROOM': {
      name: 'Pawnbroker\'s Apartment - Living Room',
      description: `The living room of someone who spent their life surrounded by other people's possessions but kept few of their own. What furniture remains has rotted or been picked over by fifty-five years of scavengers: a recliner reduced to springs and frame, a television screen shattered and scavenged for components, a coffee table warped by decades of humidity.

The walls show rectangles of less-faded paint where photographs once hung—taken, probably, by someone who thought family photos might still matter. The pawnbroker saw too many collections sold for cash to start one of his own. Whoever cleaned out this apartment agreed.

A window overlooks Yesler Way, its glass cracked, a decorative iron grating on the inside now serving as a frame for cobwebs. Through the grime, you can see the tarnished golden balls of the pawn shop sign below.`,
      x: 4,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%UPSTAIRS_LANDING',
        south: '%BEDROOM',
        north: '%KITCHEN',
      },
      sittables: [
        {
          name: 'recliner frame',
          capacity: 1,
          emptyMsg:
            'The metal frame of a recliner, its leather rotted away, its springs exposed.',
          occupiedMsg: '%s on the recliner frame',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'gutted television',
          aliases: ['tv', 'television', 'screen'],
          description: `The remains of a flat-screen TV, its screen shattered, its back panel removed by scavengers who took the valuable components. The wall mount remains, a bracket holding nothing. Someone thought the TV was worth something once. They were right—it was scavenged for parts decades ago.`,
        },
        {
          prototype: 'describable',
          name: 'photo rectangles',
          aliases: ['photos', 'pictures', 'wall'],
          description: `Rectangles of less-faded paint on the wall, the outlines of frames that once held photographs. The photos were taken—by family, by scavengers, by someone who thought memories were worth preserving. The frames themselves might have been worth something. The wall remembers what hung there. Nothing else does.`,
        },
        {
          prototype: 'describable',
          name: 'window grating',
          aliases: ['bars', 'grating', 'window'],
          description: `Decorative iron grating on the inside of the window, rusted to a deep brown but still solid. The grating was meant to suggest security while admitting light. Now it frames a view of abandonment through cracked glass and decades of accumulated grime.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Pawnbroker\'s Apartment - Kitchen',
      description: `A small galley kitchen, stripped by decades of scavengers. The refrigerator stands open and empty, its door hanging crooked, whatever was inside long since rotted and desiccated. The stove remains—cast iron survives neglect—but the oven door hangs open, mice having made nests inside years ago.

Cabinets hang open or missing doors entirely, their contents looted or broken. Shards of ceramic on the floor suggest plates that didn't survive the Long Dark. A coffee maker sits on the counter, its carafe shattered, its heating element scavenged.

A small table by the window has collapsed on one leg, the wood warped by humidity. The window looks out on an air shaft, the view of brick and pipes unchanged by fifty-five years.`,
      x: 4,
      y: 14,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LIVING_ROOM',
      },
      sittables: [
        {
          name: 'broken chair',
          capacity: 1,
          emptyMsg:
            'A wooden chair with one leg shorter than the others, wobbling but functional.',
          occupiedMsg: '%s on the broken chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'dead refrigerator',
          aliases: ['fridge', 'icebox', 'refrigerator'],
          description: `A white refrigerator, its door hanging open, its interior empty and stained with decades of mold that has since dried to dust. The rubber seal has crumbled away. Whatever was inside was consumed or rotted long ago—the refrigerator is just a metal box now.`,
        },
        {
          prototype: 'describable',
          name: 'broken coffee maker',
          aliases: ['coffee', 'pot', 'coffee maker'],
          description: `The plastic housing of a coffee maker, its carafe shattered on the counter, its heating element removed by someone who knew its value. The filter basket contains something that might once have been coffee grounds, now indistinguishable from dust.`,
        },
        {
          prototype: 'cabinet',
          name: 'ransacked cabinets',
          aliases: ['cabinets', 'dishes'],
          description: `Cabinets with doors missing or hanging open, their contents long since looted. Ceramic shards on the floor, a single chipped mug that no one wanted. The cabinet under the sink is empty. The cabinet above the fridge holds a bourbon bottle, miraculously intact, its contents evaporated to a sticky residue at the bottom.`,
        },
      ],
    },

    '%BEDROOM': {
      name: 'Pawnbroker\'s Apartment - Bedroom',
      description: `The bedroom has been stripped over fifty-five years of scavenging. The bed frame remains—metal, not worth carrying—but the mattress is a nest of rotted fabric and springs. A dresser with drawers hanging open, emptied long ago. The nightstand is overturned, its lamp missing.

A small safe sits in the corner, its door standing open, its contents taken during the Long Dark when people still thought cash might matter. Whoever opened it was disappointed or dead before they could spend what they found.

A window overlooks Yesler Way, its glass cracked, curtains rotted to rags. Through the gaps, the pawnbroker's sign is visible—three balls that were gold once, green now with decades of verdigris.`,
      x: 4,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LIVING_ROOM',
      },
      sittables: [
        {
          name: 'ruined bed',
          capacity: 2,
          emptyMsg:
            'A metal bed frame with the remains of a mattress—springs exposed, fabric rotted.',
          occupiedMsg: '%s on the bed frame',
        },
      ],
      objects: [
        {
          prototype: 'safe',
          name: 'empty safe',
          aliases: ['safe', 'lockbox'],
          description: `A small residential safe, its door hanging open, its interior empty except for dust. Someone cracked it during the Long Dark—the dial is frozen, the mechanism forced. Whatever the pawnbroker kept secure is long gone, spent or traded or buried with whoever took it.`,
        },
        {
          prototype: 'cabinet',
          name: 'ransacked dresser',
          aliases: ['drawers', 'clothes', 'dresser'],
          description: `A wooden dresser with drawers pulled out and overturned, emptied by scavengers who took anything useful. Clothing rots slowly, but fifty-five years is enough—whatever remained has been eaten by moths and mice, reduced to fiber and stain.`,
        },
        {
          prototype: 'describable',
          name: 'storefront view',
          aliases: ['window', 'view'],
          description: `The bedroom window overlooks Yesler Way through cracked glass and rotted curtains. The pawnbroker's sign is visible below—three balls that were gold once, now green with verdigris. The vigilance that watched this view ended fifty-five years ago.`,
        },
      ],
    },

    '%ROOF': {
      name: 'Pioneer Pawn - Roof',
      description: `The flat roof of Pioneer Pawn has weathered fifty-five years of Seattle rain. The tar paper has cracked and peeled, exposing the underlayment in places. HVAC equipment rusts in one corner, its fan blades frozen, its function ended when the power grid died.

The remains of a lawn chair—aluminum frame, fabric long since rotted away—sits near the edge, facing the debris wall to the north. A bucket rusted through at the bottom once held cigarette butts. The pawnbroker came up here to smoke once. The smoking ended with The Burning.

From here, you can see the tarnished golden balls below the roofline—the symbol of a trade that dates back centuries. The balls are green with verdigris now, their gold forgotten, their meaning obscure to anyone born after the collapse.`,
      x: 5,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%UPSTAIRS_LANDING',
      },
      sittables: [
        {
          name: 'chair frame',
          capacity: 1,
          emptyMsg:
            'The aluminum frame of a lawn chair, its fabric long since rotted away.',
          occupiedMsg: '%s perched on the chair frame',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'rusted bucket',
          aliases: ['bucket', 'ashtray'],
          description: `A metal bucket rusted through at the bottom, sitting where someone left it fifty-five years ago. Whatever it contained—sand, cigarette butts, the detritus of rooftop smoking—has spilled through the hole and been washed away by decades of rain. The bucket is a shell, a rust-colored memory of a habit that ended with The Burning.`,
        },
        {
          prototype: 'describable',
          name: 'dead HVAC',
          aliases: ['hvac', 'air conditioning'],
          description: `A rooftop HVAC unit, its casing rusted, its fan blades frozen by corrosion. The unit protected the inventory below from Seattle's humidity once. The protection ended when the power died. Fifty-five years of uncontrolled climate has done what the unit was designed to prevent.`,
        },
        {
          prototype: 'describable',
          name: 'pawnbroker balls',
          aliases: ['balls', 'sign', 'golden balls'],
          description: `From the roof edge, you can look down at the three balls hanging above the shop entrance—the traditional symbol of the pawnbroker's trade. They were gold once. Fifty-five years of rain and neglect have turned them green with verdigris. The symbol dates back to the Medici, allegedly. No one alive in Pioneer Square knows the Medici. The symbol persists anyway.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop view',
          aliases: ['view', 'panorama'],
          description: `The roof offers a view of Yesler Way and the debris wall to the north—collapsed buildings that have become topography, blocking all routes to downtown. Other rooftops are visible at various heights, some collapsed, some intact. The waterfront is somewhere to the west. The view is comprehensive. It shows a ruined city that has been ruined for fifty-five years.`,
        },
      ],
    },
  },

  postProcessors: [],
};
