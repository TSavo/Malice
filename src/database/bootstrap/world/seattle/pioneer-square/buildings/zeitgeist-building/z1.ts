// Zeitgeist Building - First Floor (z=1)
// Gallery level - main exhibition spaces

export const building = {
  name: 'Zeitgeist Building',
  x: -13,
  y: 1,
  width: 3,
  height: 3,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR (shared reference)
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%GALLERY_LOBBY',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // FIRST FLOOR (z=1) - GALLERY LEVEL
    // ═══════════════════════════════════════════════════════════════════

    '%GALLERY_LOBBY': {
      name: 'TWELVE Gallery - Lobby',
      description: `The gallery's reception area occupies the building's second floor, the space transformed by white walls and polished concrete floors that replaced whatever industrial flooring existed before. Track lighting runs along the ceiling, adjustable spots positioned to highlight whatever hangs on the walls this month.

The space is deliberately minimal—a reception desk of reclaimed wood, a few carefully placed benches for contemplation, a rack of gallery guides that no one has restocked. The current exhibition's name is stenciled on the wall in black letters: HANDS THAT WORKED.

A freight elevator gate stands to the south, its iron lattice incongruous against the gallery white. Stairs descend to the lobby below. The hush here is deliberate, cultivated, the kind of silence that makes footsteps feel like intrusions.`,
      x: -12,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GALLERY_MAIN',
        east: '%GALLERY_EAST',
        west: '%GALLERY_WEST',
        down: '%LOBBY',
        up: '%STUDIO_LOBBY',
        'in': '%E',
      },
      sittables: [
        {
          name: 'a gallery bench',
          capacity: 2,
          emptyMsg: 'A minimal wooden bench offers a place to contemplate.',
          occupiedMsg: '%s sitting on the gallery bench',
        },
      ],
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
          const floorNumber = 1;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here at the gallery level.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. The freight elevator groans to life somewhere in the shaft.';
          }

          return 'The button clicks, but nothing responds.';
        `,
      },
      elevatorId: '%E',
    },

    '%GALLERY_MAIN': {
      name: 'TWELVE Gallery - Main Exhibition',
      description: `The main gallery space stretches across the building's width, tall windows on the north wall flooding the room with Seattle's grey light. The current exhibition—HANDS THAT WORKED—fills the space with black and white photographs: close-ups of hands, weathered and calloused, the tools they held, the work they did.

Each photograph is accompanied by a small placard: LONGSHOREMAN, 1978. SEAMSTRESS, 1982. MACHINIST, 1991. The hands belonged to workers from Seattle's industrial past, before automation, before The Burning, before everything became memory.

The irony isn't lost. These photographs document a world of labor that's gone, displayed in a gallery that exists because that world ended. Art about work, in a space where no one works anymore.

A visitors' book sits on a pedestal near the entrance. The last entry is from three years ago.`,
      x: -12,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 90,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GALLERY_LOBBY',
        east: '%GALLERY_CORNER',
        west: '%GALLERY_ALCOVE',
      },
      sittables: [
        {
          name: 'a viewing bench',
          capacity: 3,
          emptyMsg: 'A long bench centered in the gallery invites prolonged viewing.',
          occupiedMsg: '%s contemplating the exhibition',
        },
      ],
      objects: [
        {
          prototype: 'sign',
          name: 'exhibition placard',
          description: `HANDS THAT WORKED
Photographs by Marcus Chen
1978-2003

These images document the hands of Seattle's working class during the final decades of industrial labor. Each photograph is a portrait of capability—the strength, skill, and wear written into flesh.

Marcus Chen worked as a union organizer before turning to photography. He died in 2019. His archive was donated to TWELVE Gallery in 2021.

"The machines remember nothing. We have to remember for them."
— Marcus Chen, 2003`,
        },
      ],
    },

    '%GALLERY_WEST': {
      name: 'TWELVE Gallery - West Wing',
      description: `The west wing houses the gallery's permanent collection—or what remains of it. Paintings from the Pacific Northwest school line the walls: dark forests, grey seas, mountains that promise nothing but cold. The style is representational but moody, landscapes that feel like states of mind.

A small alcove in the corner holds installation pieces—sculptures of industrial detritus, found objects arranged into commentary that was probably clear once. The placard says ENTROPY STUDIES but doesn't elaborate.

The lighting here is warmer, less clinical than the main gallery. Someone understood that these works needed shadow to breathe. A window seat built into the west wall offers a view of 1st Avenue below, the street empty, the view unchanged since the works were hung.`,
      x: -13,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GALLERY_LOBBY',
        north: '%GALLERY_ALCOVE',
      },
      sittables: [
        {
          name: 'a window seat',
          capacity: 2,
          emptyMsg: 'A cushioned window seat looks out over 1st Avenue.',
          occupiedMsg: '%s sitting in the window seat',
        },
        {
          name: 'a corner chair',
          capacity: 1,
          emptyMsg: 'A vintage armchair sits in the corner, positioned for viewing.',
          occupiedMsg: '%s seated in the corner chair',
        },
      ],
    },

    '%GALLERY_EAST': {
      name: 'TWELVE Gallery - East Wing',
      description: `The east wing is dedicated to contemporary work—or what was contemporary when the gallery was active. The pieces here are more challenging: video installations on loop, screens flickering in the dim light; sound art that drones from hidden speakers; mixed-media pieces that incorporate garbage and gold in equal measure.

One corner holds a piece called AFTER THE FIRE: a charred beam suspended from cables, slowly rotating, its surface inscribed with names. Whether it references The Burning or some other fire is unclear. Both interpretations work.

The lighting here is theatrical, spots and shadows creating drama. A viewing platform in the center raises visitors above the floor, offering perspective on larger pieces. The platform's cushioned surface suggests visitors were meant to linger, to let the art work on them.`,
      x: -11,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GALLERY_LOBBY',
        north: '%GALLERY_CORNER',
      },
      sittables: [
        {
          name: 'a viewing platform',
          capacity: 4,
          emptyMsg: 'A raised viewing platform offers perspective on the installation pieces.',
          occupiedMsg: '%s observing from the platform',
        },
      ],
    },

    '%GALLERY_ALCOVE': {
      name: 'TWELVE Gallery - Reading Alcove',
      description: `A quieter space tucked into the northwest corner, designed for research and reflection. Bookshelves line the walls, holding art catalogs, monographs, exhibition histories from TWELVE and other galleries now gone. A reading table in the center has chairs for four, a lamp that still works, pencils and paper for notes.

This was the gallery's study—a place for students, researchers, artists looking for inspiration. The books are organized by medium, then alphabetically by artist. Someone took care here. Someone understood that art history matters even when—especially when—the world is ending.

A small cork board holds announcements for events that never happened: opening receptions, artist talks, educational programs. The dates are all in the future. A future that became the past while no one was watching.`,
      x: -13,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GALLERY_WEST',
        east: '%GALLERY_MAIN',
      },
      sittables: [
        {
          name: 'a reading chair',
          capacity: 4,
          emptyMsg: 'Comfortable reading chairs surround the study table.',
          occupiedMsg: '%s reading in the alcove',
        },
      ],
    },

    '%GALLERY_CORNER': {
      name: 'TWELVE Gallery - Project Space',
      description: `The northeast corner is TWELVE's project space—a flexible gallery-within-gallery for experimental work. The walls are temporary, movable, allowing the space to be reconfigured for each installation. Currently they form a small labyrinth, visitors meant to walk through rather than around.

Inside the maze: polaroids pinned to walls with no order or explanation, photographs of places and people, moments captured and displayed without context. The exhibition is called REMEMBER THIS? and the question feels less rhetorical now than it probably did when the show opened.

A small office alcove connects to the space, visible through a doorway—the curator's office, cramped and book-filled, a desk buried in papers that no one will ever file.`,
      x: -11,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GALLERY_EAST',
        west: '%GALLERY_MAIN',
      },
      sittables: [
        {
          name: 'a maze bench',
          capacity: 1,
          emptyMsg: 'A small bench hides within the labyrinth of walls.',
          occupiedMsg: '%s resting within the maze',
        },
      ],
    },
  },

  postProcessors: [],
};
