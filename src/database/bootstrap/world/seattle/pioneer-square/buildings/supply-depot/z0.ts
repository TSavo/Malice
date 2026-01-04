// Supply Depot - Ground Floor (z=0)
// Automated distribution of sealed tamper-proof boxes

export const building = {
  name: 'Supply Depot',
  x: -20,
  y: -5,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // RECEIVING BAY - Main entrance and package handling
    // ═══════════════════════════════════════════════════════════════════

    '%RECEIVING': {
      name: 'Supply Depot - Receiving Bay',
      description: `A loading dock converted to a distribution point. The original bay doors have been replaced with reinforced steel, leaving only a single personnel entrance from the waterfront. Fluorescent lights buzz overhead, casting flat white light across concrete floors worn smooth by decades of foot traffic.

A counter runs along the north wall, its surface scuffed and dented from countless packages. Behind it, an automated dispensing system hums quietly—a wall of numbered compartments, each containing sealed boxes awaiting pickup. A status display shows queue numbers and destinations in amber text.

Signs are posted everywhere: VERIFY CONTENTS BEFORE LEAVING. TAMPER SEALS ARE MONITORED. UNAUTHORIZED ACCESS WILL BE PROSECUTED. The Continuum takes its logistics seriously.

To the east, the warehouse proper holds row after row of shelving. The scale of stored goods suggests this depot services more than just Pioneer Square.`,
      x: -20,
      y: -5,
      z: 0,
      population: 0,
      ambientNoise: 15,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'waterfront/y-5.ts',
          description: 'A steel door leads to the waterfront',
        },
        east: '%WAREHOUSE',
        north: '%LOADING',
        down: {
          to: 'z-1.ts#%SORTING',
          description: 'A reinforced door leads down to the basement',
          door: 'z-1.ts#%BASEMENT_DOOR',
          locks: ['z-1.ts#%BASEMENT_LOCK'],
        },
      },
      objects: [
        {
          prototype: 'sign',
          name: 'depot rules',
          description: `A laminated sign mounted to the wall:

SUPPLY DEPOT PROTOCOLS
━━━━━━━━━━━━━━━━━━━━━━
1. Verify package destination before departure
2. Tamper seals are electronically monitored
3. Delivery confirmation required at destination
4. Report damaged seals immediately
5. Unauthorized opening = immediate termination

PACKAGES ARE TRACKED. YOU ARE TRACKED.`,
        },
        {
          prototype: 'describable',
          name: 'package dispenser',
          description: `An automated dispensing system built into the wall—a grid of numbered compartments behind reinforced glass doors. Each compartment is sized for a standard supply box. A touchscreen interface glows beside it, showing available pickups.

The system cross-references citizen work assignments with package availability. No assignment, no package. The Continuum doesn't waste resources on speculation.`,
        },
        {
          prototype: 'describable',
          name: 'delivery intake chute',
          description: `A metal chute built into the counter, angled down into the processing area below. Packages deposited here slide into the sorting system. A scanner above the opening reads package codes as they pass.

A sign reads: INCOMING DELIVERIES ONLY. The chute is sized for standard supply boxes—nothing larger would fit.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // WAREHOUSE - Storage area
    // ═══════════════════════════════════════════════════════════════════

    '%WAREHOUSE': {
      name: 'Supply Depot - Warehouse',
      description: `Industrial shelving stretches from floor to ceiling, arranged in tight rows that maximize storage density. Each shelf holds identical sealed boxes—white plastic cases with black tamper strips and barcode labels. Thousands of them, organized by destination codes that mean nothing to the uninitiated.

The air is cool and dry, climate-controlled to preserve contents. Ventilation fans hum in the ceiling. The lighting is motion-activated—sections illuminate as you move through, darkening behind you. Energy efficiency.

Forklifts sit idle in charging stations along the wall. The heavy lifting is done by machines now, or not done at all. The shelves within reach have been picked clean. The higher ones remain stocked, inaccessible without equipment.

This was once a distribution hub for the entire Pacific Northwest. Now it services what remains of Seattle's population. The infrastructure outlived the demand.`,
      x: -19,
      y: -5,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%RECEIVING',
        north: '%INVENTORY',
        down: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%SOUTH_TUNNEL',
          description: 'A floor hatch opens into the underground tunnels',
          hidden: true,
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'a floor hatch',
          description: `A heavy steel hatch set into the concrete floor, partially concealed by a stack of pallets. The hatch is not on any official plans. Those who know about it don't discuss it.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // LOADING DOCK - Rear access
    // ═══════════════════════════════════════════════════════════════════

    '%LOADING': {
      name: 'Supply Depot - Loading Dock',
      description: `A loading dock designed for trucks that no longer run. The bay doors are sealed shut, welded from the outside. Whatever came in by vehicle stays in memory only. Now goods move by hand, by cart, by whatever means remain.

A manual loading platform sits against the sealed doors, its hydraulics long since failed. Pallets are stacked nearby, some empty, some holding goods that haven't moved in years. The manifest boards on the wall show deliveries from before the Event—dated, irrelevant, preserved by inertia.

The dock connects to the receiving bay to the south and the inventory office to the east. The smell of old cardboard and machine oil lingers. Some spaces remember what they were built for.`,
      x: -20,
      y: -4,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%RECEIVING',
        east: '%INVENTORY',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // INVENTORY OFFICE - Records and tracking
    // ═══════════════════════════════════════════════════════════════════

    '%INVENTORY': {
      name: 'Supply Depot - Inventory Office',
      description: `A small office overlooking the warehouse floor through a grimy window. Desks are cluttered with manifests, inventory sheets, and tracking logs—the paper trail of distribution. The computer terminals still work, connected to whatever network the Continuum maintains, but most of the work happens on paper now. Easier to control, harder to hack.

Filing cabinets line one wall, drawers labeled by date and destination. The system is old but functional. Inventory in, inventory out, everything tracked, everything accounted for. The Continuum knows exactly what it has and where it went.

A metal ladder is bolted to the wall in the corner, leading up through a hatch to the roof. Maintenance access, according to the faded signage. The hatch looks well-used.

A corkboard displays routes, delivery schedules, and worker assignments. Some pins mark active routes, others mark areas no longer serviced. The map of what remains.`,
      x: -19,
      y: -4,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%WAREHOUSE',
        west: '%LOADING',
        up: { room: '%ROOF_NE', locks: ['%ROOF_HATCH_LOCK'] },
      },
      objects: [
        {
          prototype: 'sign',
          name: 'delivery routes map',
          description: `A map of Pioneer Square with delivery routes marked in different colors. Active routes are in blue, suspended routes in red. Most of the map is red now.

Active destinations include:
- Smith Tower (administrative supplies)
- City Services (sanitation equipment)
- Fabrication Factory (raw materials)
- Nutrient Dispensary (consumables)

The map is updated regularly. Someone is paying attention.`,
        },
      ],
    },
  },
};
