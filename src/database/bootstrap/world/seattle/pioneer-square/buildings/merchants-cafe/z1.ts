// Merchant's Cafe - Second Floor (z=1)
// Former hotel rooms, now abandoned

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOM_101_LOCK': {
      prototype: 'rentableLock',
      name: 'Room 101 Lock',
      description:
        'An antique mortise lock on the door of Room 101. The brass is tarnished but the mechanism still works.',
      price: 400,
      duration: 2678400000, // 1 month
    },
    '%ROOM_101_DOOR': {
      prototype: 'door',
      name: 'Room 101 Door',
      description:
        'A solid oak door with a brass number plate reading 101. Paint peels around the frame.',
      locked: true,
      open: false,
      locks: ['%ROOM_101_LOCK'],
    },

    '%ROOM_102_LOCK': {
      prototype: 'rentableLock',
      name: 'Room 102 Lock',
      description:
        'A brass mortise lock on Room 102, well-worn from decades of use.',
      price: 400,
      duration: 2678400000,
    },
    '%ROOM_102_DOOR': {
      prototype: 'door',
      name: 'Room 102 Door',
      description: 'An oak door with 102 painted in faded gilt numerals.',
      locked: true,
      open: false,
      locks: ['%ROOM_102_LOCK'],
    },

    '%ROOM_103_LOCK': {
      prototype: 'rentableLock',
      name: 'Room 103 Lock',
      description:
        'The lock on Room 103, its keyhole worn smooth by countless keys.',
      price: 450,
      duration: 2678400000,
    },
    '%ROOM_103_DOOR': {
      prototype: 'door',
      name: 'Room 103 Door',
      description:
        'A corner room door, slightly larger than the others, marked 103.',
      locked: true,
      open: false,
      locks: ['%ROOM_103_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - FORMER HOTEL ROOMS
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_Z1': {
      name: "Merchant's Cafe - Second Floor Hall",
      description: `A narrow hallway runs the length of the second floor, connecting the rooms that once served as hotel accommodations above the restaurant. The wallpaper is a faded floral pattern—roses on cream—peeling in strips where water damage has weakened the paste.

The floor creaks with every step, the boards beneath the threadbare carpet runner announcing any movement. Gas light fixtures converted to electric line the walls, most bulbs dead, the few that remain casting pools of sickly yellow light.

A stairwell at the north end leads down to the kitchen and up to the third floor. The smell of the restaurant below has soaked into every surface—decades of cooking, seeping up through the floorboards.`,
      x: -15,
      y: -2,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%KITCHEN',
        up: '%HALL_Z2',
        west: { room: '%ROOM_101', door: '%ROOM_101_DOOR', locks: ['%ROOM_101_LOCK'] },
        south: '%BATH_Z1',
      },
    },

    '%ROOM_101': {
      name: "Merchant's Cafe - Room 101",
      description: `A small hotel room on the building's west side, its single window looking out onto the alley. The room contains the remnants of a century ago: an iron bed frame with a rotted mattress, a washstand with a cracked porcelain basin, a wardrobe missing its doors.

The wallpaper matches the hallway's faded roses, though more intact here, protected from the hallway's foot traffic. A framed print hangs crooked on one wall—a sailing ship on rough seas, the kind of generic art that decorated every hotel room in the era.

The smell of the kitchen below is strongest here, rising through gaps in the floorboards. Someone once slept above the smells of frying fish and roasting meat. The food is gone. The smell remains.`,
      x: -16,
      y: -2,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%HALL_Z1', door: '%ROOM_101_DOOR', locks: ['%ROOM_101_LOCK'] },
      },
      objects: [
        {
          prototype: 'bed',
          name: 'an iron bed frame',
          description:
            'An iron bed frame with ornate scrollwork, its mattress rotted to springs and stuffing.',
          quality: 'cheap',
        },
      ],
      sittables: [
        {
          name: 'a wooden chair',
          capacity: 1,
          emptyMsg: 'A simple wooden chair sits by the window, its cane seat partially broken through.',
          occupiedMsg: '%s sitting carefully on the broken chair',
        },
      ],
    },

    '%BATH_Z1': {
      name: "Merchant's Cafe - Second Floor Bathroom",
      description: `A shared bathroom serving the second floor rooms, its fixtures dating to the building's original construction. A claw-foot tub dominates the space, its porcelain stained in rings that document water levels over the years. The brass fixtures are green with verdigris.

A pedestal sink stands against one wall, its mirror cracked diagonally. The crack splits every reflection into two misaligned halves. A toilet with a high tank and pull chain occupies the corner, its wooden seat warped but intact.

The tile floor is hexagonal—black and white in an alternating pattern—several tiles cracked or missing entirely. A small window, frosted for privacy, lets in diffused grey light.`,
      x: -15,
      y: -3,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%HALL_Z1',
        west: { room: '%ROOM_102', door: '%ROOM_102_DOOR', locks: ['%ROOM_102_LOCK'] },
        south: { room: '%ROOM_103', door: '%ROOM_103_DOOR', locks: ['%ROOM_103_LOCK'] },
      },
      sittables: [
        {
          name: 'the bathtub',
          capacity: 1,
          emptyMsg: 'A claw-foot bathtub, stained and dry, large enough to sit in.',
          occupiedMsg: '%s sitting in the empty tub',
        },
      ],
    },

    '%ROOM_102': {
      name: "Merchant's Cafe - Room 102",
      description: `A corner room at the building's southwest, slightly larger than Room 101 with two windows—one facing west toward the waterfront, one south toward S. Main Street. The extra light made this a premium room once. Now it just means more ways for the cold to get in.

The furniture is more substantial here: a larger bed frame, a proper dresser with a mirror, a writing desk under the south window. The desk still holds writing supplies—a dried inkwell, a pen stand, blotting paper yellowed with age. Someone wrote letters here. The letters are long since mailed or burned.

A radiator beneath the west window is cold and silent, its cast iron decorated with embossed patterns. The heating system died with the rest of the building's utilities.`,
      x: -16,
      y: -3,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%BATH_Z1', door: '%ROOM_102_DOOR', locks: ['%ROOM_102_LOCK'] },
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a brass bed',
          description:
            'A brass bed frame, larger than the standard hotel issue, its posts tarnished to brown.',
          quality: 'standard',
        },
        {
          prototype: 'desk',
          name: 'a writing desk',
          description:
            'A small writing desk positioned under the south window, its surface scarred by decades of correspondence.',
        },
      ],
      sittables: [
        {
          name: 'a cushioned chair',
          capacity: 1,
          emptyMsg: 'A cushioned chair sits before the writing desk, its upholstery faded and worn.',
          occupiedMsg: '%s sitting at the writing desk',
        },
      ],
    },

    '%ROOM_103': {
      name: "Merchant's Cafe - Room 103",
      description: `A room accessible only through the bathroom—an odd arrangement that suggests either later construction or repurposed space. The room is narrow, squeezed into whatever area remained after the plumbing was installed.

Despite its awkward access, the room shows signs of more recent occupation than the others. The bed has a mattress that isn't completely rotted. A camping lantern sits on the nightstand. Empty food tins are stacked in one corner—someone lived here, after the hotel closed but before the city fell.

A fire escape landing is visible through the window, the rusted grating providing both an exit and an entrance for anyone who knew to look.`,
      x: -16,
      y: -3,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%BATH_Z1', door: '%ROOM_103_DOOR', locks: ['%ROOM_103_LOCK'] },
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a camp bed',
          description:
            'A narrow bed with a salvaged mattress, cleaner than anything else in the building.',
          quality: 'standard',
        },
      ],
    },
  },
};
