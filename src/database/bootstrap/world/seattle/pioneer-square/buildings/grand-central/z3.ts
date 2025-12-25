// Grand Central Arcade - Third Floor / Roof (z=3)
// Partially collapsed roof level with clock tower

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR (shared reference)
    // ═══════════════════════════════════════════════════════════════════

    '%GC_E': {
      prototype: 'elevator',
      exits: {
        out: '%GC_ROOF_ACCESS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // SOUTH ROW (y=+2): [COLLAPSED], Iron Skyway, [COLLAPSED], [COLLAPSED]
    // Only the Iron Skyway is accessible
    // ═══════════════════════════════════════════════════════════════════

    '%GC_IRON_SKY': {
      name: 'Grand Central - Iron Skyway',
      description: `A narrow walkway of iron grating suspended above the arcade atrium, part of the original roof structure that somehow survived when the rest collapsed. The walk runs north-south along the building's centerline, offering dizzying views down to the arcade floor three stories below.

The grating shakes with each step but holds. Handrails—rusted iron bars—provide minimal reassurance. Pigeons roost in the remaining roof beams above, disturbed by any movement below and liable to take flight in startling clouds.

From here, the geometry of the iron and glass roof is visible in detail—where panels remain, where they've fallen, where the framework itself has twisted under the weight of Seattle winters. The view is beautiful and terrifying in equal measure.`,
      x: -12,
      y: 2,
      z: 3,
      population: 0,
      ambientNoise: 20,
      lighting: 80,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%GC_ROOF_CTR',
      },
      sittables: [
        {
          name: 'an iron beam',
          capacity: 1,
          emptyMsg: 'An exposed iron beam of the roof framework offers precarious seating.',
          occupiedMsg: '%s perched on the iron beam',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+3): Roof W, Roof Center, Roof E, Roof Access
    // ═══════════════════════════════════════════════════════════════════

    '%GC_ROOF_W': {
      name: 'Grand Central - West Roof',
      description: `The western edge of Grand Central's roof level, where the building meets the wall of its taller neighbor. A narrow ledge runs along the wall, providing access to this corner of the roof. The surface is a patchwork of original tar paper, later repairs, and exposed decking.

A water tank once stood here—the mounting brackets remain, rusted to the roof. The tank itself is gone, probably salvaged for the metal. Pipes that once connected to the hotel's plumbing still protrude, cut and capped.

The view west is limited by the neighboring building, but looking south you can see Pioneer Square spread below, the grid of streets, the scattered lights of survivors. Looking up, the sky is whatever Seattle offers—usually grey, occasionally blue, perpetually present.`,
      x: -13,
      y: 3,
      z: 3,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%GC_ROOF_CTR',
      },
      sittables: [
        {
          name: 'a water tank bracket',
          capacity: 2,
          emptyMsg: 'Iron brackets that once held a water tank provide rough seating.',
          occupiedMsg: '%s sitting on the old tank brackets',
        },
      ],
    },

    '%GC_ROOF_CTR': {
      name: 'Grand Central - Central Roof',
      description: `The center of Grand Central's roof, dominated by the remaining framework of the iron and glass canopy. The glass is mostly gone, but the iron bones remain—a lattice of Victorian engineering reaching toward the sky, beautiful in its skeletal decay.

Below, through the gaps, the arcade is visible three stories down. The fountain, the columns, the empty shop fronts—all laid out like a diagram of commercial ambition. The view is voyeuristic, looking down on a space designed to be looked up from.

This section of roof is relatively stable, the structure supported by the iron framework that was built to carry glass, not just weather. Planks have been laid across some gaps, creating navigable paths. Someone has been up here, maintaining access.`,
      x: -12,
      y: 3,
      z: 3,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%GC_ROOF_W',
        east: '%GC_ROOF_E',
        south: '%GC_IRON_SKY',
        north: '%GC_ROOF_N',
      },
      sittables: [
        {
          name: 'a flat section of roof',
          capacity: 4,
          emptyMsg: 'A relatively flat and stable section of rooftop offers open-air seating.',
          occupiedMsg: '%s sitting on the roof',
        },
      ],
    },

    '%GC_ROOF_E': {
      name: 'Grand Central - East Roof',
      description: `The eastern section of the roof, where the structure transitions from the original 1890s building to the 1897 hotel addition. The rooflines don't quite match—a step up here, a different pitch there—creating an uneven surface that pools water when it rains.

A maintenance hatch leads down to the linen storage below, but it's rusted shut. Someone painted DANGER on it in red letters that have faded to pink. The hatch may have been sealed deliberately, or the rust may have simply done the job.

From here, the clock tower is visible rising to the north—the building's most distinctive feature, modeled after Big Ben at a fraction of the scale. The clock faces are dark, the hands frozen, but the tower itself still stands.`,
      x: -11,
      y: 3,
      z: 3,
      population: 0,
      ambientNoise: 22,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%GC_ROOF_CTR',
        north: '%GC_CLOCK',
        south: '%GC_ROOF_ACCESS',
      },
    },

    '%GC_ROOF_ACCESS': {
      name: 'Grand Central - Roof Access',
      description: `The elevator penthouse and roof access point for Grand Central. The elevator machinery is housed in a small brick structure, its original door replaced by a sheet of plywood that hangs askew. Inside, gears and cables are visible—the mechanical heart of the antique elevator system.

A ladder leads up from the elevator penthouse to the roof proper. The ladder is iron, bolted to the brick, and while rusty, it seems solid. A safety cage that once enclosed it has mostly fallen away.

The elevator call button here still works, connecting to the mysterious power source that keeps the lift operational. The button glows faintly in the shadow of the penthouse, a small beacon of persistence.`,
      x: -10,
      y: 3,
      z: 3,
      population: 0,
      ambientNoise: 15,
      lighting: 70,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%GC_ROOF_E',
        north: '%GC_CLOCK',
        down: '%GC_STAIRS_2',
        in: '%GC_E',
      },
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          await obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button', 'press button'], self, 'callElevator');
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 3;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here at roof level.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. Far below, the elevator machinery groans to life, cables singing in the shaft.';
          }

          return 'The button clicks, but nothing responds.';
        `,
      },
      elevatorId: '%GC_E',
    },

    // ═══════════════════════════════════════════════════════════════════
    // NORTH ROW (y=+4): [COLLAPSED], Roof N, [COLLAPSED], Clock Tower
    // ═══════════════════════════════════════════════════════════════════

    '%GC_ROOF_N': {
      name: 'Grand Central - North Roof',
      description: `The northern edge of the roof, where the building looks out over Washington Street and the blocks beyond. The parapet here is decorative sandstone, carved with the same Romanesque motifs that adorn the street facade—arches, columns, stone eagles with weathered features.

One eagle has fallen, lying on the roof in pieces—head here, wing there, talons scattered. The others perch on the parapet still, watching the street with eroded eyes.

The view north shows the collision of Seattle's street grids—Pioneer Square's cardinal orientation giving way to downtown's angled streets beyond Yesler Way. From up here, you can see how the city was built in pieces by people who couldn't agree on which way was north.`,
      x: -12,
      y: 4,
      z: 3,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%GC_CLOCK',
        south: '%GC_ROOF_CTR',
      },
      sittables: [
        {
          name: 'the parapet',
          capacity: 3,
          emptyMsg: 'The decorative stone parapet offers seating with a view of Washington Street below.',
          occupiedMsg: '%s sitting on the parapet',
        },
        {
          name: 'a fallen eagle',
          capacity: 1,
          emptyMsg: 'A fallen stone eagle lies in pieces on the roof.',
          occupiedMsg: '%s sitting beside the fallen eagle',
        },
      ],
    },

    '%GC_CLOCK': {
      name: 'Grand Central - Clock Tower',
      description: `The base of Grand Central's clock tower, a miniature Big Ben that rises another twenty feet above the roofline. The tower is square, brick with stone trim, clock faces on all four sides. None of the clocks work—the hands are frozen at different times, the mechanisms long since failed.

A door leads into the tower's interior, where a spiral staircase once led up to the clock mechanism room. The stairs are present but precarious—iron steps bolted to the brick, some missing, some hanging loose. A rope dangles from above, suggesting someone climbed up at some point. Whether they came back down is unclear.

The clock faces glow faintly at night, a phenomenon no one has explained. There's no power, no phosphorescence, just a gentle luminescence that makes the frozen time visible from the street below. The clocks read 3:17, 9:42, 12:00 exactly, and 7:23—a conference of stopped moments.`,
      x: -10,
      y: 4,
      z: 3,
      population: 0,
      ambientNoise: 18,
      lighting: 90,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%GC_ROOF_N',
        south: '%GC_ROOF_ACCESS',
      },
      sittables: [
        {
          name: 'the tower steps',
          capacity: 2,
          emptyMsg: 'The bottom steps of the clock tower spiral staircase provide seating in the tower\'s shadow.',
          occupiedMsg: '%s sitting on the tower steps',
        },
      ],
    },
  },
};
