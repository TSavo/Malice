// Immigration Services - Ground Floor (z=0)
// Repurposed federal immigration station, early 1900s construction

export const building = {
  name: 'Immigration Services',
  x: -16,
  y: 10,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%STAFF_LOCK': {
      prototype: 'biometricLock',
      name: 'Staff Door Scanner',
      description:
        'A fingerprint scanner mounted beside the door, newer than everything else in the room.',
      scanners: [
        {
          type: 'fingerprint',
          part: 'hand',
          message: 'Access denied - not authorized.',
        },
      ],
      authorizedUsers: {},
    },

    '%HATCH_LOCK': {
      prototype: 'biometricLock',
      name: 'Roof Hatch Scanner',
      description:
        'A palm scanner bolted to the wall beside the ladder, its LED glowing amber.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Roof access denied.' },
      ],
      authorizedUsers: {},
    },

    '%ALLEY_LOCK': {
      prototype: 'biometricLock',
      name: 'Back Exit Scanner',
      description:
        'A palm scanner beside a fire door, its paint chipped and peeling.',
      scanners: [{ type: 'palm', part: 'hand', message: 'Staff access only.' }],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0)
    // ═══════════════════════════════════════════════════════════════════

    '%ENTRY': {
      alias: 'immigrationServices', // Register as $immigrationServices for chargen spawn point
      name: 'Immigration Services - Entry Hall',
      description: `The entry hall retains the bones of federal architecture—high ceilings, terrazzo floors worn smooth by a century of footsteps, brass fixtures tarnished to brown. The building served as Seattle's immigration processing station in the early 1900s, funneling arrivals from Pacific crossings into the bureaucratic machinery of citizenship and exclusion.

The original intake counter dominates the space, heavy oak darkened by time, its brass grillework dented and patched. Behind it, empty cubbyholes built into the wall. A faded mural depicts ships entering Elliott Bay, the paint cracked and peeling but the image still visible—a promise of arrival that the building's history complicated.

The federal seal above the entrance has been painted over, but you can still trace its outline beneath the newer coat. Someone repurposed this place. The bones remain federal. The flesh is something else.`,
      x: -15,
      y: 10,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y10.ts',
          description: 'Heavy wooden doors open onto 1st Ave S',
        },
        north: '%COFFINS',
        west: '%SERVICES',
      },
      sittables: [
        {
          name: 'a wooden bench',
          capacity: 3,
          emptyMsg:
            'A worn wooden bench sits against the wall, its surface smoothed by decades of waiting.',
          occupiedMsg: '%s waiting on the bench.',
        },
      ],
    },

    '%COFFINS': {
      name: 'Immigration Services - Public Coffins',
      description: `The room that once served as a waiting area for immigrants awaiting processing has been converted to something grimmer. Metal frames line the walls floor to ceiling, sized to hold coffin-shaped pods—rental sleeping compartments, each just large enough for a human body lying flat. The frames are bolted directly into the original plaster, leaving no wall space unclaimed.

The air carries the institutional smell of disinfectant layered over older odors it can't quite mask. Fluorescent tubes overhead cast flat, shadowless light. The floor is the same terrazzo as the entry hall, easier to clean than carpet would be.

The original benches where families once waited for names to be called are long gone. In their place, this architecture of stacked human storage. The irony probably isn't lost on anyone who knows the building's history.`,
      x: -15,
      y: 11,
      z: 0,
      population: 0,
      ambientNoise: 15,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ENTRY',
      },
    },

    '%SERVICES': {
      name: 'Immigration Services - Processing Hall',
      description: `The main processing hall where immigration officers once decided fates. The room is long and narrow, built to funnel people through bureaucratic stations in sequence. Original wooden partitions divide the space into interview areas, the oak darkened by decades of nervous hands gripping armrests.

The architecture of processing hasn't changed much—stations in rows, low barriers between them, sight lines designed for supervision. Whatever services operate here now use the same spatial logic the immigration bureau established a century ago. The bureaucracy changes. The architecture doesn't.

Fluorescent lights flicker overhead, retrofitted into fixtures meant for incandescent bulbs. The wiring is visible in places, jury-rigged by someone who prioritized function over code compliance. A door marked STAFF ONLY leads north, its lock newer than everything else in the room.`,
      x: -16,
      y: 10,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ENTRY',
        north: { room: '%STAFF', locks: ['%STAFF_LOCK'] },
        down: {
          to: 'z-1.ts#%RECORDS',
          description: 'A reinforced door leads down to the basement',
          door: 'z-1.ts#%BASEMENT_DOOR',
          locks: ['z-1.ts#%BASEMENT_LOCK'],
        },
      },
    },

    '%STAFF': {
      name: 'Immigration Services - Staff Area',
      description: `Behind the public-facing bureaucracy, the space where employees retreated. A cramped back room with a kitchenette alcove along one wall—countertop, sink basin, the plumbing connections for appliances. The linoleum floor is cracked and lifting at the edges, revealing older flooring beneath.

A metal ladder is bolted to one wall, leading up through a hatch in the ceiling. The hatch is newer than the building—cut through the original plaster and reinforced with steel framing. Roof access, added by whoever repurposed this place.

The room smells of old coffee and mildew. Whatever authority once operated from here left traces but no explanations.`,
      x: -16,
      y: 11,
      z: 0,
      population: 0,
      ambientNoise: 12,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SERVICES',
        up: { room: '%ROOF_NW', locks: ['%HATCH_LOCK'] },
        west: {
          to: 'alley/y11.ts',
          locks: ['%ALLEY_LOCK'],
          description: 'A fire door leads to the alley',
        },
      },
    },
  },
};
