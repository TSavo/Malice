// Fabrication Factory - Basement (z=-1)
// Heavy infrastructure, material processing, and underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'biometricLock',
      name: 'Basement Access Scanner',
      description:
        'A retinal scanner beside a heavy blast door, its housing reinforced against impact.',
      scanners: [
        {
          type: 'retinal',
          part: 'eye',
          message: 'Level 3 clearance required.',
        },
      ],
      authorizedUsers: {},
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Access Door',
      description:
        'A reinforced blast door, the kind designed to contain industrial accidents. Or keep people out.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 95,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%PROCESSING': {
      name: 'Fabrication Factory - Material Processing',
      description: `The basement level handles the heavy preprocessing that feeds the factory above. Raw materials arrive through a freight elevator shaft and are broken down, refined, and prepared for fabrication. Massive industrial equipment dominates the space: shredders for recycling, furnaces for metal smelting, extruders for polymer processing.

The heat is intense despite the industrial cooling systems. The machinery operates continuously, fed by the AI's optimization algorithms. Mountains of raw material wait in input hoppers—scrap metal, reclaimed plastic, industrial waste transformed into feedstock.

The noise is a constant roar, muffled only slightly by acoustic baffling. The air filtration struggles against the particulates. Warning signs about respiratory protection are posted everywhere, their advice unheeded by the machines that don't need to breathe.`,
      x: -20,
      y: 8,
      z: -1,
      imageOnDisk: 'fabrication-factory-material-processing-x-20-y8-z-1.png',
      population: 0,
      ambientNoise: 35,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%PUBLIC_SERVICES',
          description: 'A freight elevator leads up to public services',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK'],
        },
        east: '%FOUNDRY',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'industrial shredders',
          aliases: ['shredders', 'recycling'],
          description:
            'Massive industrial shredders capable of reducing scrap metal, plastic, and composite materials to uniform feedstock. The machines run continuously, their teeth grinding down the waste products of the old world to build the infrastructure of the new. The noise is overwhelming. The efficiency is absolute.',
        },
        {
          prototype: 'describable',
          name: 'smelting furnaces',
          aliases: ['furnaces', 'smelters'],
          description:
            "Industrial furnaces for metal smelting, their exteriors glowing with contained heat. The furnaces process everything from aluminum cans to steel beams, reducing them to molten raw material ready for reforming. The heat radiates outward even through heavy insulation. Standing too close is uncomfortable for humans. The machines don't notice.",
        },
      ],
    },

    '%FOUNDRY': {
      name: 'Fabrication Factory - Foundry',
      description: `The foundry section handles precision metalwork that can't be done by the 3D printers above. Casting molds line the walls, their ceramic forms shaped for specialized components. Crucibles of molten metal glow orange, tended by robotic arms that don't flinch from the heat.

The floor is sand-covered, the traditional medium for casting that no amount of automation has improved upon. Metal shavings and cooled slag accumulate in corners. The space feels older than the rest of the factory—foundry work hasn't changed fundamentally since the industrial revolution, just been made more precise.

A shaft descends through the floor in the southern corner, its edges worn smooth by decades of use. The opening leads down to the underground tunnel network that predates the AI's control of the factory. Someone used this route before the machines took over. Perhaps they still do.`,
      x: -19,
      y: 8,
      z: -1,
      imageOnDisk: 'fabrication-factory-foundry-x-19-y8-z-1.png',
      population: 0,
      ambientNoise: 25,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PROCESSING',
        east: '%GENERATOR',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'casting molds',
          aliases: ['molds', 'casts', 'forms'],
          description:
            'Ceramic molds shaped for specialized components—valve bodies, pump housings, structural fittings that require the precision of casting. The molds are heat-resistant, reusable, precision-machined to tolerances the AI calculated. Each one represents a part the city needs, rendered in negative space.',
        },
        {
          prototype: 'describable',
          name: 'molten crucibles',
          aliases: ['crucibles', 'metal'],
          description:
            'Industrial crucibles of molten metal, their contents glowing orange-white. The alloys are precisely mixed—aluminum, steel, bronze, whatever the specifications require. Robotic arms dip ladles into the crucibles, pouring measured amounts into waiting molds. The heat is overwhelming. The precision is inhuman.',
        },
      ],
    },

    '%GENERATOR': {
      name: 'Fabrication Factory - Power Generation',
      description: `The factory's backup power generation, independent of the city grid. Massive diesel generators sit in rows, their fuel tanks fed from underground storage. The generators are offline now—the grid is stable enough—but ready to spin up at a moment's notice if the AI decides the factory's production can't be interrupted.

Banks of batteries line one wall, storing power for peak demand or emergency use. The inverters and distribution panels are modern, retrofitted into infrastructure that's older than digital control systems.

The room smells of diesel and ozone, the particular atmosphere of power waiting to be used. The generators are cold but maintained—the AI runs them periodically to ensure readiness. The factory's productivity is too important to risk to power fluctuations.`,
      x: -18,
      y: 8,
      z: -1,
      imageOnDisk: 'fabrication-factory-power-generation-x-18-y8-z-1.png',
      population: 0,
      ambientNoise: 15,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%FOUNDRY',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'diesel generators',
          aliases: ['generators', 'diesel'],
          description:
            'Industrial diesel generators capable of powering the entire factory independent of the grid. The engines are cold but maintained, their fuel tanks full, their control systems ready for automatic startup. The AI runs them monthly to ensure readiness. The factory cannot stop for something as mundane as a power outage.',
        },
        {
          prototype: 'describable',
          name: 'battery banks',
          aliases: ['batteries', 'power storage'],
          description:
            "Rows of industrial batteries providing power smoothing and emergency reserve. The banks store enough energy to maintain critical systems during generator startup, or to ride out brief grid fluctuations. The charge indicators show full capacity. The AI doesn't believe in letting reserves deplete.",
        },
      ],
    },
  },
};
