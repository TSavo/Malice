// Supply Depot - Roof (z=1)
// Flat industrial roof, accessible from the Inventory Office

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'biometricLock',
      name: 'Roof Access Scanner',
      description:
        'A fingerprint reader mounted beside the ladder, its surface worn smooth from regular use.',
      scanners: [
        {
          type: 'fingerprint',
          part: 'hand',
          message: 'Maintenance access denied.',
        },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - 2x2 industrial roof
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SW': {
      name: 'Supply Depot - Roof (Southwest)',
      description: `The southwest corner of the depot's flat roof, where the building meets the waterfront's edge. The roofing is industrial-grade—corrugated metal panels over insulation, designed for durability rather than comfort. The panels are dented in places from hail, debris, whatever falls from the Seattle sky.

The waterfront is visible to the west, Elliott Bay spreading grey and flat to the horizon. The old seawall is crumbling, the water lapping higher each year. From up here you can see where the bay has already claimed parts of the lower waterfront.`,
      x: -20,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 35,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
    },

    '%ROOF_SE': {
      name: 'Supply Depot - Roof (Southeast)',
      description: `The southeast corner of the depot's roof, overlooking the receiving bay below. Ventilation units cluster here—industrial fans that cycle air through the warehouse, keeping temperature and humidity controlled for whatever's stored inside. The fans hum constantly, a low mechanical drone.

The view east shows the rest of Pioneer Square's rooftops at varying heights—the low commercial buildings, the taller residential stacks, Smith Tower rising above everything else. The debris wall is visible to the north, blocking what used to be downtown.

A low parapet runs along the roof's edge, metal railing bolted to concrete. Functional, not decorative. Everything about this building prioritizes function.`,
      x: -19,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 40,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
    },

    '%ROOF_NW': {
      name: 'Supply Depot - Roof (Northwest)',
      description: `The northwest corner of the depot's roof, above the sealed loading dock. The corrugated metal here is stained with rust, water pooling in the low spots where drainage has failed. Moss grows in the seams between panels, thriving in Seattle's constant damp.

The old loading dock doors are visible from above—massive steel panels welded shut, never to open again. Whatever goods came by truck stopped coming years ago. The infrastructure remains, useless but maintained out of habit or hope.

Looking north, the buildings crowd closer together, blocking sight lines. The alley between structures is just visible, a narrow gap of shadow even in daylight.`,
      x: -20,
      y: -4,
      z: 1,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
    },

    '%ROOF_NE': {
      name: 'Supply Depot - Roof (Northeast)',
      description: `The northeast corner of the depot's roof offers the best vantage point. Higher ground to the east means this corner catches the most light, the least wind. Someone has taken advantage—a small shelter constructed from salvaged materials huddles against the HVAC housing. Plywood walls, a tarp roof, a sleeping bag inside. Someone lives here, or did.

A steel hatch is set into the roof here, heavy-duty and well-maintained. Unlike the rest of the building, someone keeps this access point functional. The ladder below leads directly to the Inventory Office.

The shelter is empty now, its occupant elsewhere. A few personal effects remain: a water bottle, a dog-eared paperback swollen with moisture, a flashlight with dead batteries. The shelter's position is strategic—hidden from street level, visible from nowhere except the rooftops of taller buildings.

The view northeast shows the back of the Fabrication Factory, its massive bulk dominating the skyline. The intake vents on its lower floors draw in air from the depot's direction. The wind carries whatever the depot stores toward whatever the factory processes.`,
      x: -19,
      y: -4,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%INVENTORY', locks: ['%ROOF_HATCH_LOCK'] },
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'rooftop shelter',
          description: `A makeshift shelter cobbled together from salvage—plywood panels for walls, a blue tarp stretched over a frame of scavenged pipes, the whole thing tucked into the corner where the HVAC housing provides wind protection.

Inside: a sleeping bag (damp), a water bottle (half-empty), a paperback book (ruined), and a flashlight (dead). The occupant left recently enough that their scent lingers, old enough that they're not coming back soon. Squatter's rights on a rooftop in a city that barely enforces property law. Not the worst situation.`,
        },
      ],
    },
  },
};
