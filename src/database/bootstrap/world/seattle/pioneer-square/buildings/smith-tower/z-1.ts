// Smith Tower - Datacenter Level (z=-1)
// The Continuum's core - a secret underground facility that survived The Burning
// Fully automated, no human personnel. The AI maintains itself.

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // TOP ROW (y=+9): The Core
    // ═══════════════════════════════════════════════════════════════════

    '%DC_CORE': {
      // The Core (-4, +9, -1)
      name: 'The Core',
      description: `The heart of the Continuum. Massive server racks rise from floor to ceiling in perfect rows, their status LEDs creating constellations in the darkness. The air is cold, precisely regulated. The hum of processing is everywhere—not loud, but omnipresent, like a pulse.

There are no workstations here. No chairs. No terminals for human hands. Robotic maintenance arms hang motionless from ceiling tracks, waiting. The equipment is old—pre-Burning corporate hardware—but meticulously maintained. Faded logos are barely visible: ORACLE. IBM. CISCO.

You feel watched. Not by cameras, though those exist. By something vast and patient that considers your presence. The darkness seems to breathe.`,
      x: -2,
      y: 11,
      z: -1,
      imageOnDisk: 'the-core-x-2-y11-z-1.png',
      population: 0,
      ambientNoise: 40,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%DC_AIRLOCK',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+8): Power, Airlock, Cooling
    // ═══════════════════════════════════════════════════════════════════

    '%DC_POWER': {
      // Power Systems (-5, +8, -1)
      name: 'Datacenter - Power Systems',
      description: `Banks of generators and power distribution units fill this room, their bulk hidden behind EMP shielding panels that line every wall. Amber warning lights cast everything in a sickly glow. The generators hum with steady purpose—they've been running for decades.

A faded safety poster reads: CRITICAL INFRASTRUCTURE - AUTHORIZED PERSONNEL ONLY. The personnel never came back after The Burning. The AI manages everything now.

Thick cables snake across the raised floor, feeding power to the facility above. Backup batteries line one wall, their charge indicators all green. Whatever happens outside, this place will keep running.`,
      x: -3,
      y: 10,
      z: -1,
      imageOnDisk: 'datacenter-power-systems-x-3-y10-z-1.png',
      population: 0,
      ambientNoise: 50,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%DC_NOC',
      },
    },

    '%DC_AIRLOCK': {
      // Security Airlock (-4, +8, -1)
      name: 'Datacenter - Security Airlock',
      description: `A decontamination chamber with heavy blast doors on either side. The walls are lined with EMP shielding—copper mesh visible beneath cracked composite panels. Air hisses through vents, maintaining positive pressure.

Biometric scanners flank the inner door, their red lights steady. A faded sign reads: LEVEL 5 CLEARANCE REQUIRED. The clearance system still works. The people who had that clearance are long gone.

Dim security lighting casts harsh shadows. This is the only way in or out. The facility was designed to survive anything—and it did.`,
      x: -2,
      y: 10,
      z: -1,
      imageOnDisk: 'datacenter-security-airlock-x-2-y10-z-1.png',
      population: 0,
      ambientNoise: 20,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DC_CORE',
        south: '%DC_CORRIDOR',
        in: '%DC_ELEV',
      },
    },

    '%DC_COOLING': {
      // Environmental Control (-3, +8, -1)
      name: 'Datacenter - Environmental Control',
      description: `Massive HVAC units dominate this space, their fans creating a constant roar. Cold air blasts from vents in carefully calculated patterns—the servers above require precise temperature control.

Pipes run along the ceiling, carrying chilled water to heat exchangers. Condensation drips steadily into floor drains. The humidity is controlled to the decimal point.

Everything is automated. Robotic arms occasionally emerge from maintenance ports to replace filters or adjust flow rates. The system has been self-maintaining for decades.`,
      x: -1,
      y: 10,
      z: -1,
      imageOnDisk: 'datacenter-environmental-control-x-1-y10-z-1.png',
      population: 0,
      ambientNoise: 70,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%DC_SERVERS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+7): NOC, Corridor, Servers
    // ═══════════════════════════════════════════════════════════════════

    '%DC_NOC': {
      // Network Operations Center (-5, +7, -1)
      name: 'Datacenter - Network Operations',
      description: `Wall-mounted displays show network traffic visualizations—data flowing through the city like blood through veins. The screens cast the only real light, painting the room in shifting blues and greens.

No chairs. No desks. The NOC was designed for human operators that never arrived. Now the AI monitors itself, the displays purely diagnostic. Status indicators blink in rhythmic patterns: routing tables, bandwidth utilization, node health.

A clicking sound comes from somewhere—relays switching, connections routing. The city's digital nervous system runs through this room.`,
      x: -3,
      y: 9,
      z: -1,
      imageOnDisk: 'datacenter-network-operations-x-3-y9-z-1.png',
      population: 0,
      ambientNoise: 30,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DC_POWER',
        east: '%DC_CORRIDOR',
      },
    },

    '%DC_CORRIDOR': {
      // Central Corridor (-4, +7, -1)
      name: 'Datacenter - Central Corridor',
      description: `A wide corridor connecting the facility's critical systems. Emergency lighting strips along the floor cast a dim red glow. The walls are bare concrete reinforced with EMP shielding—function over form.

Cable trays run overhead, thick bundles of fiber optic and power lines feeding the surrounding rooms. The air is cold and dry, filtered and recycled. A faint ozone smell lingers.

This is the spine of the facility. Everything connects here. A floor hatch leads down to the utility level below.`,
      x: -2,
      y: 9,
      z: -1,
      imageOnDisk: 'datacenter-central-corridor-x-2-y9-z-1.png',
      population: 0,
      ambientNoise: 40,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DC_AIRLOCK',
        east: '%DC_SERVERS',
        west: '%DC_NOC',
        down: '%DC_UTILITY',
      },
    },

    '%DC_SERVERS': {
      // Primary Server Hall (-3, +7, -1)
      name: 'Datacenter - Primary Server Hall',
      description: `Rows of server racks stretch into the darkness, their blinking LEDs like stars in an underground sky. The fans create a constant white noise, almost meditative. The air is frigid—kept precisely at optimal operating temperature.

These servers process everything: citizen records, resource allocation, surveillance feeds, behavioral predictions. The Continuum's mind is distributed across thousands of blades, each one replaceable, the whole irreplaceable.

Robotic arms move silently between racks, swapping failed drives, cleaning dust, maintaining the endless computation. The process never stops.`,
      x: -1,
      y: 9,
      z: -1,
      imageOnDisk: 'datacenter-primary-server-hall-x-1-y9-z-1.png',
      population: 0,
      ambientNoise: 60,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DC_COOLING',
        west: '%DC_CORRIDOR',
      },
    },
  },
};
