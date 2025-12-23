// City Services - Ground Floor (z=0)
// Sanitation Department

export const building = {
  name: 'City Services',
  x: -16,
  y: 8,
  width: 2,
  height: 2,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%INCINERATOR_LOCK': {
      prototype: 'biometricLock',
      name: 'Incinerator Access Scanner',
      description: 'A palm scanner mounted beside the heavy door, its surface discolored by heat and grime.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Incinerator access denied.' },
      ],
      authorizedUsers: {},
    },

    '%ALLEY_LOCK': {
      prototype: 'biometricLock',
      name: 'Rear Exit Scanner',
      description: 'A fingerprint scanner beside a steel door, its surface grimy from years of use.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'Staff access only.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      name: 'City Services - Elevator',
      description: `A utilitarian elevator car with scuffed metal walls and a floor worn smooth by work boots. The control panel is industrial—heavy buttons, no frills. It smells faintly of cleaning solution and something less pleasant beneath.

The car rattles slightly as it moves, but the machinery sounds solid enough. Functional. Maintained by people who fix things rather than replace them.`,
      x: -15,
      y: 9,
      z: 0,
      exits: {
        out: '%ENTRY',
      },
      elevator: {
        floors: [0, 1, 2],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          0: '%ENTRY',
          1: '%ELEV_LOBBY_Z1',
          2: '%ELEV_LOBBY_Z2',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - SANITATION
    // ═══════════════════════════════════════════════════════════════════

    '%ENTRY': {
      name: 'City Services - Public Intake',
      description: `The public face of City Services occupies what was once a bank lobby—high ceilings, marble floors now scuffed and stained, brass fixtures tarnished to brown. The grandeur of early twentieth century finance reduced to municipal utility.

A service counter runs along one wall, positions marked by faded numbers on brass plaques. Behind the counter, cubbyholes and filing systems. The bureaucracy of sanitation, water, and power consolidated into one building.

An elevator stands in the corner, its doors industrial steel rather than the brass they replaced. The floor directory is hand-lettered: SANITATION - GROUND FLOOR. WATER & POWER - 2ND FLOOR. OPERATIONS - 3RD FLOOR.`,
      x: -15,
      y: 9,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: { to: '1st-ave-s/y9.ts', description: 'Glass doors open onto 1st Ave S' },
        west: '%LOBBY',
        south: '%STORAGE',
        in: '%E',
      },
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          await obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 0;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. Machinery stirs above.';
          }

          return 'The button light flickers, but nothing happens.';
        `,
      },
      elevatorId: '%E',
    },

    '%LOBBY': {
      name: 'City Services - Sanitation Lobby',
      description: `A waiting area for sanitation services. Plastic chairs line the walls, bolted to the floor in rows. The linoleum is worn in paths between the chairs and the service windows to the east. People have waited here for decades, their patience worn into the floor.

The walls display faded posters about proper waste disposal, recycling guidelines, hazmat protocols. The information is dated but the principles remain. Waste doesn't sort itself.

A door to the south leads to the processing area. A sign reads: AUTHORIZED PERSONNEL ONLY. The lock looks newer than the door.`,
      x: -16,
      y: 9,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ENTRY',
        south: '%PROCESSING',
      },
      sittables: [
        {
          name: 'a plastic chair',
          capacity: 1,
          emptyMsg: 'A row of plastic chairs sits bolted to the floor, worn smooth by decades of waiting.',
          occupiedMsg: '%s sitting in one of the plastic chairs.',
        },
      ],
    },

    '%PROCESSING': {
      name: 'City Services - Sanitation Processing',
      description: `Behind the public-facing lobby, the machinery of sanitation. Work tables line the walls, surfaces scarred by years of sorting and cataloging. Clipboards hang from hooks, forms half-filled. The bureaucracy of waste management.

A heavy door on the east wall is marked INCINERATOR - AUTHORIZED PERSONNEL ONLY. The door is steel, heat-resistant, with a biometric scanner mounted beside it. Through a small window, you can see the glow of something hot.

The room smells of industrial cleaner layered over older, more organic odors. Sanitation work leaves traces.`,
      x: -16,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        east: { room: '%INCINERATOR_BAY', locks: ['%INCINERATOR_LOCK'] },
        west: { to: 'alley/y8.ts', locks: ['%ALLEY_LOCK'], description: 'A steel door leads to the alley' },
      },
    },

    '%INCINERATOR_BAY': {
      name: 'City Services - Incinerator Bay',
      description: `A utilitarian chamber dominated by an industrial incinerator. The walls are lined with heat-resistant tiles, discolored by years of thermal stress. Ventilation ducts run along the ceiling, drawing the heat and fumes upward.

The incinerator itself is a squat, heavy unit—municipal grade, built for volume rather than efficiency. The inspection window glows orange when operational. Warning labels in faded yellow and black cover every surface: EXTREME HEAT, AUTHORIZED PERSONNEL ONLY, NO HAZARDOUS MATERIALS.

The floor is concrete, stained and scored. A metal cart sits nearby for loading materials. The air is hot and dry, carrying the acrid smell of things that have been burned.`,
      x: -15,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 20,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PROCESSING',
      },
      objects: [
        {
          prototype: 'incinerator',
          name: 'municipal incinerator',
          description: 'A heavy-duty municipal incinerator, its metal housing blackened by years of use. The control panel is simple—ignition, fuel gauge, temperature readout. The inspection window reveals the burn chamber within.',
          destroyMessage: 'The item catches fire instantly, consumed by the intense heat. Nothing remains but ash.',
          temperature: 1400,
          fuelLevel: 80,
          operational: true,
        },
      ],
    },

    '%STORAGE': {
      name: 'City Services - Sanitation Storage',
      description: `A storage area for sanitation equipment and supplies. Metal shelving units line the walls, holding cleaning supplies, safety equipment, and spare parts for machinery that may or may not still function.

The air is thick with the smell of industrial chemicals—bleach, ammonia, solvents. Everything needed to clean up after a city. The supplies are organized by type, labels faded but legible. Someone maintained order here once.

Drums of chemicals sit in the corner on containment pallets. Proper storage. Proper procedures. The habits of sanitation workers don't die easily.`,
      x: -15,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ENTRY',
      },
    },
  },
};
