// Trinity Nightclub - Street Level (z=0)
// The entrance - a black steel door and nothing more

export const building = {
  name: 'Trinity Nightclub',
  x: -13,
  y: 2,
  width: 2,
  height: 2,
  floors: 3, // z0, z-1, z-2

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_LOCK': {
      prototype: 'biometricLock',
      name: 'Trinity Entry Scanner',
      description: 'A matte black panel beside the door, nearly invisible against the steel. No instructions—you either know or you don\'t.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'The panel pulses red once. Nothing happens.' },
      ],
      authorizedUsers: {},
    },

    '%VIP_LOCK': {
      prototype: 'biometricLock',
      name: 'VIP Access',
      description: 'A sleek scanner beside a velvet curtain.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'VIP access required.' },
      ],
      authorizedUsers: {},
    },

    '%OFFICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Office Lock',
      description: 'A heavy-duty lock on a reinforced door.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'Staff only.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_DOOR': {
      prototype: 'door',
      name: 'Black Steel Door',
      description: 'A featureless black steel door, no handle visible from outside. Those who belong know how to open it.',
      locked: false,
      open: false,
      locks: ['%MAIN_LOCK'],
    },

    '%VIP_DOOR': {
      prototype: 'door',
      name: 'VIP Curtain',
      description: 'Heavy velvet curtains concealing the VIP area.',
      locked: true,
      open: false,
      locks: ['%VIP_LOCK'],
    },

    '%OFFICE_DOOR': {
      prototype: 'door',
      name: 'Office Door',
      description: 'A reinforced door marked PRIVATE.',
      locked: true,
      open: false,
      locks: ['%OFFICE_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // STREET LEVEL (z=0)
    // ═══════════════════════════════════════════════════════════════════

    '%ENTRANCE': {
      name: 'Trinity - Entrance',
      description: `A narrow vestibule between the street and the stairs down. The walls are painted black, absorbing what little light enters when the door opens. A coat check window is built into one wall, its counter dusty, hangers still visible in the darkness behind the glass.

The bouncer's post is obvious even empty—a spot by the door worn smooth by years of standing, a small shelf for checking IDs, a panic button that probably still works. The velvet rope stanchions remain, though the rope itself is gone.

Iron stairs descend into darkness. The treads are diamond plate, industrial, chosen for durability rather than aesthetics. A faint smell rises from below—stale beer, old smoke, the residue of a thousand nights that ended at dawn.

A sign on the wall, hand-painted in white on black: NO PHOTOS. NO PHONES. NO BULLSHIT.`,
      x: -13,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: { to: '1st-ave-s/y2.ts', door: '%MAIN_DOOR', description: 'The black steel door leads east to 1st Ave S' },
        down: '%LANDING',
      },
      sittables: [
        {
          name: 'the bouncer\'s stool',
          capacity: 1,
          emptyMsg: 'A metal stool stands by the door, positioned for watching who enters.',
          occupiedMsg: '%s on the bouncer\'s stool',
        },
      ],
    },

    '%LANDING': {
      name: 'Trinity - Stairwell Landing',
      description: `A landing halfway down the stairs, where the descent turns back on itself. The walls here are exposed brick, original to the 1890s building, blackened by decades of smoke from before the smoking ban and after the world stopped enforcing such things.

Posters paper the walls—band flyers, DJ nights, events that happened years ago. The layers go deep, each poster covering older ones, an archaeological record of the Seattle underground scene. Names you might recognize, names no one remembers, names that meant everything for one summer.

Emergency lighting casts a red glow, the only illumination. The batteries should have died years ago. They haven't. No one knows why.

The stairs continue down into bass-heavy darkness. Even now, silent, you can imagine the sound that once shook these walls.`,
      x: -13,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%ENTRANCE',
        down: '%LOBBY',
      },
    },
  },

  postProcessors: [],
};
