// Factory Row - Ground Floor (z=0)
// Strip mall south of the Fabrication Factory

export const building = {
  name: 'Factory Row',
  x: -20,
  y: 7,
  width: 3,
  height: 1,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%NUTRIENT_LOCK': {
      prototype: 'biometricLock',
      name: 'Dispensary Door Scanner',
      description: 'A palm scanner mounted beside the reinforced door, its surface worn smooth by thousands of desperate hands.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Scanning... access granted.' },
      ],
      authorizedUsers: {},
      defaultOpen: true,
    },

    '%PAWN_LOCK': {
      prototype: 'biometricLock',
      name: 'Pawn Shop Door Scanner',
      description: 'A fingerprint reader beside a steel security door. A handwritten sign is taped over the scanner.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'CLOSED - Come back later.' },
      ],
      authorizedUsers: {},
    },

    '%BAR_LOCK': {
      prototype: 'biometricLock',
      name: 'Bar Door Scanner',
      description: 'A retinal scanner beside a heavy door, its indicator light dark.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Establishment closed.' },
      ],
      authorizedUsers: {},
    },

    '%BAR_BACK_LOCK': {
      prototype: 'biometricLock',
      name: 'Back Door Scanner',
      description: 'A palm scanner beside a dented steel door, mounted at an angle where the frame has warped.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Staff access only.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // SHOPS (y=7)
    // ═══════════════════════════════════════════════════════════════════

    '%NUTRIENT': {
      name: 'Factory Row - Nutrient Dispensary',
      description: `A sterile retail space converted from whatever occupied this storefront before The Burning. The walls are bare concrete, the floor poured epoxy over cracked tile. Fluorescent tubes buzz overhead, some flickering, most functional. The AI maintains what matters.

Dispensing stations line the back wall—automated kiosks that accept credits and dispense nutrition in standardized doses. Pills in blister packs, water in sealed pouches, everything measured and rationed. The prices scroll on mounted screens, adjusting in real-time based on supply algorithms no human wrote.

The space smells of nothing. The air is filtered, the surfaces sanitized. The factory that produces this food is directly north, separated by a single wall. From raw waste to retail in four floors of processing. The customers try not to think about it. The pills don't taste like thinking.`,
      x: -20,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 25,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { to: 's-washington/x-20.ts', locks: ['%NUTRIENT_LOCK'], description: 'A reinforced door opens onto S. Washington St' },
      },
    },

    '%PAWN': {
      name: 'Factory Row - Pawn Shop',
      description: `Steel shutters cover the windows, pulled down and locked from inside. Through gaps in the metal, you can see display cases that once held pre-war salvage—electronics, jewelry, weapons, anything with trade value. The cases are empty now, cleared out or never restocked.

A hand-painted sign hangs crooked on the shutter: CLOSED UNTIL FURTHER NOTICE. The paint is faded, the notice old. Whatever happened here, it happened months ago. The lock on the door still works, the security system still armed. Someone expects to return, or someone wants to keep others out.

The space between the shutters smells of dust and old metal, the scent of inventory that sat too long without buyers. In a city where everything has value, a closed pawn shop is either a tragedy or a warning.`,
      x: -19,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { to: 's-washington/x-19.ts', locks: ['%PAWN_LOCK'], description: 'A steel security door, shuttered and locked' },
      },
    },

    '%BAR': {
      name: 'Factory Row - The Grinder',
      description: `The bar's interior is visible through grimy windows—stools overturned, bottles still on shelves, a layer of dust on every surface. THE GRINDER reads the neon sign above the door, though the neon hasn't glowed in months. Someone cut the power or stopped paying for it.

The space has the bones of a functional watering hole: a long bar, booth seating along the walls, a back room that probably held storage or worse. The decorations are industrial-themed, playing off the factory next door—gear motifs, pipe fixtures, sheet metal wainscoting. Ironic or earnest, hard to tell.

A notice on the door claims temporary closure for "renovation." The dust suggests the renovation has been indefinitely postponed. The lock still works. The owner, wherever they are, hasn't given up the lease.`,
      x: -18,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { to: 's-washington/x-18.ts', locks: ['%BAR_LOCK'], description: 'A heavy door beneath a dead neon sign' },
        northeast: { to: 'alley/y8.ts', locks: ['%BAR_BACK_LOCK'], description: 'A dented steel door leads to the alley' },
      },
    },
  },

  postProcessors: [],
};
