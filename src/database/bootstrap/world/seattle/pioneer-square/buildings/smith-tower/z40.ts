// Smith Tower - Penthouse Level (z=40)
// Private penthouse and crown service

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%PHL',
      },
    },

    '%PHL': {
      // Penthouse Landing (-4, +8, 40)
      name: 'Penthouse Landing',
      description: `A narrow landing wrapped in scuffed brass trim. A heavy oak door leads west into the penthouse, its handle worn to bright metal. Overhead, a square hatch labeled ROOF ACCESS sits flush with the plaster; a recessed ladder disappears into it. The air is warm and carries the scent of old polish and trapped heat.`,
      x: -4,
      y: 8,
      z: 40,
      population: 0,
      ambientNoise: 6,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PH',
        up: '%PHDOME',
        in: '%E',
        down: '%ODL',
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
          const floorNumber = 40;
          const elevatorId = self.elevatorId || null;

          if (!elevatorId) {
            return 'The call button clicks uselessly. No power.';
          }

          const elevator = await $.load(elevatorId);
          if (!elevator) {
            return 'Nothing answers the button press.';
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

    '%PH': {
      // Penthouse Suite (-5, +8, 40)
      name: 'Penthouse Suite',
      description: `A low-ceilinged suite pressed under the pyramid roof. Dark wood paneling wraps the room; a built-in bar of dull brass and glass sits dry and dusty. A narrow view slit is cut into the terracotta skin, framing a sliver of skyline. Most furniture is draped in canvas sheets. A tight spiral stair winds up toward the dome framing.`,
      x: -5,
      y: 8,
      z: 40,
      population: 0,
      ambientNoise: 4,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%PHL',
        up: '%PHDOME',
      },
    },

    '%PHDOME': {
      // Dome Service (+0, +8, 40) – treated as same z for simplicity
      name: 'Glass Dome Catwalk',
      description: `A narrow metal catwalk circles the inside of the glass dome, every step ringing against the frame. A string of tired blue LEDs washes the beams in cold light. An access panel hums softly, and through the glass the city glitters in distorted reflections.`,
      x: -4,
      y: 9,
      z: 40,
      population: 0,
      ambientNoise: 8,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%PHL',
        south: '%PH',
      },
    },
  },
};
