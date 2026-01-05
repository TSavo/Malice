// Corp Construction - Ground Level (z=0)
// A mysterious fenced construction site that blocks 2nd Ave
// Armed guards, heavy machinery, and secrets beneath

export const building = {
  name: 'Corp Construction',
  x: 6,
  y: 4,
  width: 7,
  height: 4,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%GATE_LOCK': {
      prototype: 'lock',
      name: 'Industrial Padlock',
      description:
        'A heavy-duty Abloy padlock, the kind rated for outdoor use and resistant to bolt cutters. Someone takes security seriously here.',
      difficulty: 7,
    },
    '%MAIN_GATE': {
      prototype: 'door',
      name: 'Chain-Link Gate',
      description:
        'A double-wide chain-link gate, the kind that swings open for vehicles. The fence around it rises ten feet, topped with razor wire. Warning signs are bolted every few feet: PRIVATE PROPERTY, NO TRESPASSING, AUTHORIZED PERSONNEL ONLY.',
      locked: true,
      open: false,
      locks: ['%GATE_LOCK'],
      material: 'metal',
      durability: 80,
    },

    '%OFFICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Office Scanner',
      description:
        'A keycard reader beside the office trailer door. The light glows red, waiting for valid credentials.',
      scanners: [
        { type: 'keycard', part: 'hand', message: 'Authorized personnel only.' },
      ],
      authorizedUsers: {},
    },

    '%SHAFT_LOCK': {
      prototype: 'biometricLock',
      name: 'Shaft Access Scanner',
      description:
        'A retinal scanner mounted beside the elevator shaft access. High security for what should be a construction site.',
      scanners: [
        { type: 'retinal', part: 'head', message: 'Authorized personnel only.' },
      ],
      authorizedUsers: {},
    },
    '%SHAFT_DOOR': {
      prototype: 'door',
      name: 'Elevator Shaft Door',
      description:
        'A heavy steel door protecting the elevator shaft access. The door is reinforced and fitted with a biometric scanner.',
      locked: true,
      open: false,
      locks: ['%SHAFT_LOCK'],
      material: 'steel',
      durability: 100,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND LEVEL (z=0) - CONSTRUCTION SITE
    // ═══════════════════════════════════════════════════════════════════

    '%GATE_ENTRANCE': {
      name: 'Corp Construction - Gate',
      description: `The main entrance to the construction site—a double-wide chain-link gate flanked by warning signs and topped with razor wire. Through the fence, you can see a sprawling excavation site where several buildings used to stand. Whatever they're building here required demolishing an entire block.

A guard shack sits just inside the gate, staffed even now. The guards wear private security uniforms, but their posture is military, their equipment professional-grade. This isn't a rent-a-cop operation.

The fence stretches in both directions, enclosing the entire site. To the west, it blocks what used to be 2nd Avenue. The street simply ends at chain-link and razor wire. Whoever authorized this project had the authority to close a major arterial.

The name on the sign—CORP CONSTRUCTION—tells you nothing. A shell company. A placeholder. Whatever this project actually is, they don't want it advertised.`,
      x: 6,
      y: 1,
      z: 0,
      population: 1,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: {
          to: '3rd-ave-s/y1.ts',
          description: 'The sidewalk leads east to 3rd Ave S',
        },
        west: {
          to: '%GUARD_POST',
          door: '%MAIN_GATE',
          description: 'The chain-link gate leads into the construction site',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'warning signs',
          aliases: ['signs', 'warnings'],
          description: `PRIVATE PROPERTY. NO TRESPASSING. AUTHORIZED PERSONNEL ONLY. HARD HAT AREA. The signs are new, professionally printed, mounted at regular intervals. The usual construction warnings mixed with security notices that suggest consequences beyond a simple fine.`,
        },
        {
          prototype: 'describable',
          name: 'razor wire',
          aliases: ['wire', 'barbed wire'],
          description: `Concertina wire tops the fence, the kind the military uses. Each coil is a tangle of razor-sharp blades that would shred anyone trying to climb over. This isn't about liability—it's about keeping people out.`,
        },
      ],
    },

    '%GUARD_POST': {
      name: 'Corp Construction - Guard Post',
      description: `A small guard shack just inside the gate, constructed from prefab panels and bulletproof glass. The guards stationed here are professionals—former military, likely, or corporate security trained to military standards. They don't chat with visitors. They don't take bribes. They log everyone in and out with biometric scanners.

The excavation site spreads west and north, a massive pit where buildings used to stand. Construction equipment sits idle—excavators, cranes, concrete pumps. The work happens at night, neighbors say. The trucks come and go after dark.

A large billboard announces the project: "FUTURE HOME OF CONTINUUM CIVIC CENTER - A Better Tomorrow, Today." The corporate logo gleams. The promise rings hollow.

Several paths lead into the site: west toward the equipment yard, north to the office trailers, and the main pit yawns in the center.`,
      x: 5,
      y: 1,
      z: 0,
      population: 2,
      ambientNoise: 20,
      lighting: 90,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%GATE_ENTRANCE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'project billboard',
          aliases: ['billboard', 'sign', 'continuum sign'],
          description: `"FUTURE HOME OF CONTINUUM CIVIC CENTER - A Better Tomorrow, Today." The Continuum logo is prominently displayed, the same sleek corporate branding you see on utility bills and government buildings. Below in smaller text: "Estimated Completion: TBD." No groundbreaking date. No architect's rendering of the finished building. Just a promise of a better tomorrow.`,
        },
        {
          prototype: 'describable',
          name: 'biometric scanner',
          aliases: ['scanner', 'biometric'],
          description: `A standalone biometric terminal logs everyone entering and leaving the site. Palm scan, retinal scan, photo ID. The data goes somewhere. Someone is keeping very careful records of who accesses this site.`,
        },
      ],
    },

    '%OFFICE_ROW': {
      name: 'Corp Construction - Office Trailers',
      description: `A row of construction trailers serves as the site's administrative hub. The trailers are nicer than typical job-site offices—climate controlled, windows tinted, satellite dishes on the roofs. One is marked SITE OFFICE, another ENGINEERING, a third simply AUTHORIZED PERSONNEL.

The trailers sit on a raised platform of gravel and concrete, elevated above the mud of the construction site. Power cables snake between them, connected to a generator that hums constantly. The generator is military-grade, capable of running the entire site independently of the city grid.

From here, you can see the full extent of the excavation—a hole that goes down several stories, deeper than any parking garage would require. The crane visible from the street reaches down into that darkness.`,
      x: 4,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 40,
      lighting: 85,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%SITE_OFFICE',
        north: '%ENGINEERING_TRAILER',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'satellite dishes',
          aliases: ['dishes', 'satellite', 'communications'],
          description: `Multiple satellite dishes point skyward from the trailer roofs, more bandwidth than any construction site needs. Real-time video feeds? Secure communications? Whatever they're building here requires a lot of data moving very quickly.`,
        },
        {
          prototype: 'describable',
          name: 'generator',
          aliases: ['power', 'military generator'],
          description: `A massive diesel generator, the kind used by military forward operating bases. It could power the entire site for weeks without refueling. Why would a construction project need independent power capability?`,
        },
      ],
    },

    '%SITE_OFFICE': {
      name: 'Corp Construction - Site Office',
      description: `The main administrative office for the construction site. Inside, the trailer is surprisingly well-appointed—real furniture, not folding tables, and a server rack humming in the corner that seems excessive for managing construction schedules.

Maps and blueprints cover the walls, but they're oddly vague. Site plans show the excavation perimeter but no building footprint. Structural diagrams reference subterranean levels but no above-ground floors. Whatever they're building, it's mostly underground.

A large monitor displays security camera feeds from around the site—the gate, the pit, the elevator shaft. Someone is watching everything, all the time.`,
      x: 3,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 25,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '%OFFICE_ROW',
          door: {
            prototype: 'door',
            name: 'Office Door',
            locked: false,
            open: false,
          },
        },
        south: '%EQUIPMENT_YARD',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'blueprints',
          aliases: ['maps', 'plans', 'diagrams'],
          description: `The blueprints are marked CONFIDENTIAL - PROJECT FOUNDATION. They show an underground structure going down at least five levels, with designations like "PRIMARY PROCESSING" and "CONTAINMENT WING" and "ARCHIVE VAULT." None of the labels suggest a civic center.`,
        },
        {
          prototype: 'describable',
          name: 'security monitors',
          aliases: ['monitors', 'screens', 'cameras'],
          description: `A bank of security monitors shows feeds from cameras throughout the site. Most show the expected views—perimeter, equipment, the pit. One monitor is labeled "LEVEL -3" and shows a corridor that doesn't look like any construction zone. The walls are finished, the floor polished. Someone is already living down there.`,
        },
        {
          prototype: 'describable',
          name: 'server rack',
          aliases: ['server', 'computers', 'rack'],
          description: `A full server rack, rack-mounted UPS, redundant networking—the kind of IT infrastructure you'd expect in a data center, not a construction trailer. The servers hum and blink, processing something continuously.`,
        },
      ],
    },

    '%ENGINEERING_TRAILER': {
      name: 'Corp Construction - Engineering Hub',
      description: `The engineering trailer is filled with technical equipment—survey instruments, ground-penetrating radar printouts, seismic monitoring graphs. The engineers who work here aren't just managing a construction project. They're studying something.

Geological maps cover one wall, marked with annotations about underground water tables, soil composition, and something labeled "ARTIFACT DENSITY." The Seattle underground is famous for its buried sidewalks and forgotten basements, but these maps suggest they've found something else down there.

A locked cabinet bears a biohazard symbol. The warning label reads: SAMPLE STORAGE - AUTHORIZED PERSONNEL ONLY.`,
      x: 4,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 30,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OFFICE_ROW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'geological maps',
          aliases: ['maps', 'geology'],
          description: `Detailed geological surveys of the site, layer by layer. One overlay is labeled "PRE-FIRE STRUCTURES" showing the original 1889 street level. Another shows "ANOMALOUS READINGS" with several areas circled in red. A third, partially covered, appears to show something labeled "THE FOUNDATION."`,
        },
        {
          prototype: 'container',
          name: 'sample cabinet',
          aliases: ['cabinet', 'storage', 'biohazard'],
          description: `A heavy steel cabinet with multiple locks and a biohazard symbol. Whatever they've found down there, they're storing samples here. The cabinet is cold to the touch—there's a refrigeration unit built in.`,
          locked: true,
          maxItems: 10,
          maxWeight: 50,
        },
      ],
    },

    '%EQUIPMENT_YARD': {
      name: 'Corp Construction - Equipment Yard',
      description: `Heavy construction equipment sits in neat rows—excavators, bulldozers, concrete pumps, cranes. The machinery is modern and well-maintained, but something is off. The excavators have been modified with containment shields. The dump trucks are enclosed, sealed against... something. This isn't standard construction equipment.

A covered staging area shelters pallets of materials: rebar, concrete forms, and crates marked with codes instead of contents. One stack of crates bears the Continuum corporate seal with "CLASSIFIED MATERIALS" stenciled below.

The equipment yard sits at the edge of the pit, and from here you can see just how deep they've dug. The excavation goes down and down, lit by industrial floodlights that make the depths look like something from a mining operation.`,
      x: 3,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 45,
      lighting: 90,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%PIT_EDGE',
        north: '%SITE_OFFICE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'modified excavators',
          aliases: ['excavators', 'equipment', 'machinery'],
          description: `The excavators have been fitted with containment shields around their buckets—clear polycarbonate panels that would catch debris or... contain something else. The operator cabs are pressurized, fitted with air filtration systems. These machines are designed to dig up something dangerous.`,
        },
        {
          prototype: 'container',
          name: 'classified crates',
          aliases: ['crates', 'materials'],
          description: `Heavy wooden crates marked with the Continuum seal and "CLASSIFIED MATERIALS - PROJECT FOUNDATION." The crates are sealed with tamper-evident tape. Whatever's inside, it's not standard construction supplies.`,
          locked: true,
          maxItems: 20,
          maxWeight: 200,
        },
      ],
    },

    '%PIT_EDGE': {
      name: 'Corp Construction - Pit Edge',
      description: `The edge of the excavation, protected by a railing that does little to diminish the vertiginous drop. The pit descends at least forty feet, maybe more—it's hard to tell with the shadows and the harsh angle of the floodlights. The bottom is a maze of rebar forests, partially poured concrete, and something that looks like an airlock door.

A heavy-duty construction elevator runs down the side of the pit, the kind that carries workers and equipment to lower levels. The elevator is controlled by a keycard reader, and the shaft continues past the visible bottom into darkness.

The scale of the excavation is staggering. They haven't just dug a basement—they've created an underground structure. The "civic center" is a cover story. This is something else entirely.`,
      x: 2,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 50,
      lighting: 85,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%EQUIPMENT_YARD',
        north: '%SHAFT_ACCESS',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'pit',
          aliases: ['excavation', 'hole'],
          description: `The excavation is a wound in the earth, a precisely carved pit that descends into Seattle's layered history. You can see the strata in the walls—modern fill, 1889 fire debris, original shoreline soil. And at the bottom, something that gleams with metal and purpose.`,
        },
        {
          prototype: 'describable',
          name: 'construction elevator',
          aliases: ['elevator', 'lift'],
          description: `An industrial construction elevator, the open-cage kind used to move workers and materials to different levels of a build site. This one has been modified with solid walls and an interlock system. The elevator only moves when the doors are sealed. Whatever's down there, they don't want the air mixing.`,
        },
      ],
    },

    '%SHAFT_ACCESS': {
      name: 'Corp Construction - Elevator Shaft Access',
      description: `The top of the elevator shaft, surrounded by safety barriers and warning signs. The shaft itself is a steel-reinforced tube descending into the pit, far deeper than the visible excavation. The elevator car sits at this level, waiting.

Through the elevator's sealed windows, you can see flashes of the levels below—construction in progress on one floor, finished corridors on another, and at the deepest visible level, something that glows with soft blue light.

A control panel lists the accessible levels: GROUND, LEVEL -1 (CONSTRUCTION), LEVEL -2 (INFRASTRUCTURE), LEVEL -3 (RESTRICTED). Below Level -3, the buttons are covered with a locked panel.`,
      x: 2,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 35,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PIT_EDGE',
        down: {
          to: 'z-1.ts:%CONSTRUCTION_ZONE',
          door: '%SHAFT_DOOR',
          description: 'A construction elevator descends into the pit',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'elevator controls',
          aliases: ['controls', 'panel', 'buttons'],
          description: `The elevator control panel shows four accessible levels: GROUND, LEVEL -1, LEVEL -2, LEVEL -3. A locked panel covers additional buttons below Level -3. The key slot is custom—not a standard elevator key. Whatever's down there, it requires special authorization.`,
        },
      ],
    },
  },
};
