// Fabrication Factory - Ground Floor (z=0)
// Old transport warehouse converted to AI-controlled infrastructure manufacturing

export const building = {
  name: 'Fabrication Factory',
  x: -20,
  y: 8,
  width: 3,
  height: 4,
  floors: 4,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BREAKROOM_BACK_LOCK': {
      prototype: 'biometricLock',
      name: 'Breakroom Exit Scanner',
      description:
        'A palm scanner beside a steel door marked EMERGENCY EXIT, its warning sticker peeling.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Employee access only.' },
      ],
      authorizedUsers: {},
    },

    '%SECURITY_BACK_LOCK': {
      prototype: 'biometricLock',
      name: 'Security Exit Scanner',
      description:
        'A retinal scanner beside a reinforced door, its housing newer than the surrounding wall.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Security personnel only.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      name: 'Fabrication Factory - Elevator',
      description: `A freight elevator with reinforced walls and a scarred metal floor. The car is oversized, built to move heavy equipment and bulk materials between floors. Grease stains mark where machinery has been loaded and unloaded.

The control panel is industrial—chunky buttons, a key lock for restricted floors. The cables groan when the car moves, but the machinery sounds solid. Built for weight, not comfort.`,
      x: -19,
      y: 10,
      z: 0,
      exits: {
        out: '%ELEVATORS',
      },
      elevator: {
        floors: [0, 1, 2, 3],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          0: '%ELEVATORS',
          1: '%ELEVATORS_Z1',
          2: '%ELEVATORS_Z2',
          3: '%ROOF_ACCESS',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - TOP ROW (y=11)
    // ═══════════════════════════════════════════════════════════════════

    '%LOADING_BAY': {
      name: 'Fabrication Factory - Loading Bay',
      description: `The old warehouse loading dock, preserved from the building's transport days. A massive roll-up door dominates the west wall, facing the Waterfront. The concrete floor is cracked and oil-stained, grooved by decades of heavy machinery.

Overhead rails run the length of the ceiling—an ancient gantry crane system, retrofitted with modern servos. Pallets of raw materials stack along the walls: metal stock, polymer pellets, circuit boards in static-shielded containers. A forklift sits idle near the door, its battery indicator blinking amber.

The air smells of machine oil and ozone. Through the loading door, you can see the gray waters of Elliott Bay.`,
      x: -20,
      y: 11,
      z: 0,
      exits: {
        west: {
          to: 'waterfront/y11.ts',
          prototype: 'guardedExit',
          allowedFaction: 'Citizen',
          denyMessage:
            'A security scanner beside the loading door flashes red. "Authorized personnel only."',
          description: 'A massive roll-up door opens onto the Waterfront',
        },
        east: '%WAREHOUSE',
      },
    },

    '%WAREHOUSE': {
      name: 'Fabrication Factory - Warehouse Storage',
      description: `Floor-to-ceiling industrial shelving fills the space, organized with inhuman precision. Every bin is labeled, every shelf indexed. Robotic arms on ceiling tracks move silently between rows, pulling components and depositing them on conveyor belts that disappear into the factory floor below.

The inventory system runs itself. Screens mounted on endcaps display stock levels, reorder thresholds, supply chain status. Most items show green. Some flash yellow—delayed shipments, depleted reserves, materials the city can no longer easily source.

The shelving units hum with embedded sensors. The warehouse knows exactly what it contains, down to the last bolt.`,
      x: -19,
      y: 11,
      z: 0,
      exits: {
        west: '%LOADING_BAY',
        east: '%SECURITY',
        south: '%ELEVATORS',
      },
    },

    '%SECURITY': {
      name: 'Fabrication Factory - Security Station',
      description: `A reinforced booth overlooking the warehouse floor. Monitors cover one wall—camera feeds cycling through the loading bay, factory floor, perimeter. Most show empty corridors and humming machinery. The AI doesn't need guards, but the infrastructure remains.

A weapons locker stands against the back wall, locked with biometric seals. Emergency protocols displayed on a laminated card: lockdown procedures, evacuation routes, contact frequencies for city services. The procedures assume human security personnel. The station hasn't been manned in months.

A coffee maker sits unplugged on the desk. Someone's mug still rests beside it, stained brown inside.`,
      x: -18,
      y: 11,
      z: 0,
      exits: {
        west: '%WAREHOUSE',
        east: {
          to: 'alley/y11.ts',
          locks: ['%SECURITY_BACK_LOCK'],
          description: 'A reinforced security door leads to the alley',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - SECOND ROW (y=10)
    // ═══════════════════════════════════════════════════════════════════

    '%PUBLIC_SERVICES': {
      name: 'Fabrication Factory - Public Services',
      description: `The public face of the factory—a service counter where citizens can place orders for infrastructure components. The waiting area has plastic chairs bolted to the floor, a ticket dispenser, and informational posters about fabrication services and pricing.

A terminal on the counter lets customers submit requests: replacement pipes, electrical panels, structural components. The system quotes prices and estimated completion times. Most orders are municipal—City Services requisitions, building permits requiring specific parts. Private citizens can order too, if they have the credits.

The counter is unstaffed. A speaker grille handles customer inquiries. The AI's voice is polite, efficient, and utterly unhelpful for anything outside standard parameters.`,
      x: -20,
      y: 10,
      z: 0,
      exits: {
        down: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%FAB_BASEMENT',
          description: 'A maintenance door conceals stairs to the basement',
          hidden: true,
        },
        west: {
          to: 'waterfront/y10.ts',
          prototype: 'guardedExit',
          allowedFaction: 'Citizen',
          denyMessage:
            'The glass doors remain locked. A speaker crackles: "Citizens only."',
          description: 'Glass doors open onto the Waterfront',
        },
        east: '%ELEVATORS',
        down: {
          to: 'z-1.ts:%PROCESSING',
          description: 'A freight elevator leads down to the basement',
          door: 'z-1.ts:%BASEMENT_DOOR',
          locks: ['z-1.ts:%BASEMENT_LOCK'],
        },
      },
    },

    '%ELEVATORS': {
      name: 'Fabrication Factory - Elevator Lobby',
      description: `A central hub connecting the public areas to the factory floor. The freight elevator dominates the space—oversized doors capable of accommodating heavy machinery and bulk materials. A smaller service elevator beside it handles personnel.

Conveyor belts emerge from slots in the walls, carrying finished components from the factory floor to the warehouse above. The belts run constantly, a steady stream of pipes, panels, and parts moving through the building's circulatory system.

Safety markings cover the floor: yellow hazard stripes, designated walking paths, warnings about automated systems. The conveyors don't stop for people.`,
      x: -19,
      y: 10,
      z: 0,
      exits: {
        north: '%WAREHOUSE',
        east: '%BREAKROOM',
        south: '%FACTORY_2',
        west: '%PUBLIC_SERVICES',
        in: '%E',
      },
    },

    '%BREAKROOM': {
      name: 'Fabrication Factory - Breakroom',
      description: `A utilitarian space for workers who no longer work here. Vending machines line one wall—snacks, drinks, basic supplies. Most are operational, maintained by the same automated systems that run the factory. The coffee machine produces something technically coffee-adjacent.

Tables and chairs fill the center of the room, bolted down in institutional rows. A microwave sits on a counter, its door hanging slightly open. Lockers along the back wall still have names on them: Martinez, Chen, Okonkwo. The locks haven't been opened in months.

A bulletin board displays outdated safety notices and a shift schedule from before the AI took over operations. Someone drew a smiley face on the schedule. It doesn't look happy.`,
      x: -18,
      y: 10,
      z: 0,
      exits: {
        west: '%ELEVATORS',
        east: {
          to: 'alley/y10.ts',
          locks: ['%BREAKROOM_BACK_LOCK'],
          description: 'A steel emergency exit leads to the alley',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - THIRD ROW (y=9)
    // ═══════════════════════════════════════════════════════════════════

    '%FACTORY_1': {
      name: 'Fabrication Factory - Factory Floor 1',
      description: `The northwest quadrant of the factory floor. CNC machines and industrial lathes occupy this section, cutting and shaping metal stock into precision components. The machines run continuously, guided by AI optimization algorithms that never sleep.

Robotic arms feed raw materials into hoppers, retrieve finished pieces, sort them onto conveyors. The choreography is hypnotic—dozens of machines working in perfect synchronization, no wasted motion, no idle time. The efficiency is inhuman because nothing human designed it.

The noise is constant: the whine of servos, the screech of cutting tools, the thunk of parts dropping into bins. Ear protection hangs on hooks by the entrance. The signs suggesting you wear it are yellowed with age.`,
      x: -20,
      y: 9,
      z: 0,
      exits: {
        east: '%FACTORY_2',
        south: '%FACTORY_3',
      },
    },

    '%FACTORY_2': {
      name: 'Fabrication Factory - Factory Floor 2',
      description: `The central fabrication bay. 3D printers of industrial scale dominate the space—massive frames capable of producing building-sized components layer by layer. Polymer extrusion, metal sintering, composite layup. The printers can make almost anything given the right feedstock and specifications.

Quality control stations line the perimeter, though the inspectors are mechanical now. Scanners check dimensional accuracy, stress-test samples, verify material composition. Reject bins collect the failures—surprisingly few. The AI learned quality control faster than it learned anything else.

A central monitoring station displays production queues, material consumption rates, maintenance schedules. The screens update in real-time, a constant flow of data that no human could process.`,
      x: -19,
      y: 9,
      z: 0,
      exits: {
        north: '%ELEVATORS',
        east: '%OPERATIONS',
        south: '%FACTORY_4',
        west: '%FACTORY_1',
      },
    },

    '%OPERATIONS': {
      name: 'Fabrication Factory - Operations Center',
      description: `The brain of the factory, though that metaphor feels backwards now. Banks of servers hum in climate-controlled racks, processing the endless calculations that keep production running. The AI doesn't live here—it lives everywhere—but this is where its decisions become actions.

Workstations line the walls, their screens displaying production metrics, supply chain status, maintenance alerts. The interfaces were designed for human operators. The AI uses them anyway, perhaps out of habit, perhaps because it finds the visualization useful, perhaps for reasons no one understands.

A supervisor's desk sits empty in the corner, personal effects still arranged on its surface: family photos, a stress ball, a mug that says "World's Okayest Manager." The manager isn't here. The AI manages itself.`,
      x: -18,
      y: 9,
      z: 0,
      exits: {
        west: '%FACTORY_2',
        south: '%FOREMAN',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BOTTOM ROW (y=8)
    // ═══════════════════════════════════════════════════════════════════

    '%FACTORY_3': {
      name: 'Fabrication Factory - Factory Floor 3',
      description: `The assembly section. Components from the other factory floors converge here, fed by conveyor belts into automated assembly cells. Robotic arms weld, bolt, and snap pieces together, building complex assemblies from simple parts.

The cells are modular—reconfigurable for different products. Today they're building water pump housings, electrical junction boxes, HVAC components. Tomorrow the AI might retool them for something else entirely. The flexibility is the point.

Finished assemblies queue on output conveyors, tagged with RFID chips that track them through the supply chain. The city's infrastructure runs on parts made in this room. Every pipe, every panel, every piece of the machine that keeps Seattle alive.`,
      x: -20,
      y: 8,
      z: 0,
      exits: {
        north: '%FACTORY_1',
        east: '%FACTORY_4',
      },
    },

    '%FACTORY_4': {
      name: 'Fabrication Factory - Factory Floor 4',
      description: `The southeast quadrant handles finishing and packaging. Surface treatment stations apply coatings, sealants, protective layers. Packaging robots wrap, crate, and label finished goods for shipment to warehouses and work sites across the city.

The output dock connects to an automated guided vehicle system—small robotic carts that carry loads to the loading bay without human intervention. The carts follow magnetic strips embedded in the floor, pausing at intersections, yielding to each other according to protocols the AI devised.

A testing station occupies one corner: pressure vessels, electrical test benches, environmental chambers. Random samples get pulled from production for verification. The AI trusts its quality control, but it verifies anyway.`,
      x: -19,
      y: 8,
      z: 0,
      exits: {
        north: '%FACTORY_2',
        east: '%FOREMAN',
        west: '%FACTORY_3',
      },
    },

    '%FOREMAN': {
      name: "Fabrication Factory - Foreman's Office",
      description: `A glass-walled office overlooking the factory floor. The foreman's desk faces outward, positioned to watch the production lines. The chair is ergonomic, expensive, empty. Personal effects remain: a hard hat on a hook, safety glasses in a drawer, a union calendar three months out of date.

The walls display production charts, safety records, employee recognition plaques. "287 Days Without a Lost-Time Injury" reads one sign. The counter stopped updating when the humans left. The AI hasn't had any injuries to report.

A window in the back wall looks into Operations—the foreman could supervise both the floor and the control room from this vantage point. Now the AI supervises itself, and the office serves as a monument to how things used to work.`,
      x: -18,
      y: 8,
      z: 0,
      exits: {
        north: '%OPERATIONS',
        west: '%FACTORY_4',
      },
    },
  },

  postProcessors: [],
};
