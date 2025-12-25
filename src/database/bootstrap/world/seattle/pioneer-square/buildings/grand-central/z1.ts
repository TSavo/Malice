// Grand Central Arcade - First Floor (z=1)
// Former office spaces with balconies overlooking the arcade

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR (shared reference)
    // ═══════════════════════════════════════════════════════════════════

    '%GC_E': {
      prototype: 'elevator',
      exits: {
        out: '%GC_HALL_1',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // SOUTH ROW (y=+2): Office 5, Balcony S, Office 6, Stairs 1
    // ═══════════════════════════════════════════════════════════════════

    '%GC_STAIRS_1': {
      name: 'Grand Central - First Floor Stairwell',
      description: `The eastern stairwell, connecting the first floor to the levels above and below. The stairs themselves are iron, bolted to the brick wall, with treads worn concave by a century of footsteps. The handrail is brass, tarnished to brown but still solid.

Looking down, the ground floor service area is visible through gaps in the stairs. Looking up, the second floor landing is accessible but shows signs of water damage. A bucket sits on one step, catching drips from somewhere above.

Graffiti covers the brick walls—some old, some recent. Dates span decades. Messages range from declarations of love to warnings about specific rooms to avoid. One recurring tag appears throughout: a stylized eye with a spiral pupil.`,
      x: -10,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%GC_STAIRS_2',
        north: '%GC_HALL_1',
        west: '%GC_BALC_S',
      },
    },

    '%GC_BALC_S': {
      name: 'Grand Central - South Balcony',
      description: `An iron balcony overlooking the southern end of the Grand Central Arcade. The railing is wrought iron in a floral pattern, some sections rusted through but most still solid. The floor is iron grating, allowing you to see the arcade floor below through the gaps.

From here, the arcade's iron and glass architecture is visible in full—the columns, the surviving glass panels, the central fountain with its faceless statue. Pigeons roost in the ironwork above, cooing and occasionally launching into startled flight.

The balcony runs along the interior of the building, connecting the offices on this floor. Doors open into the former office spaces—most hanging ajar, some missing entirely.`,
      x: -12,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 12,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_STAIRS_1',
        west: '%GC_OFFICE_5',
        north: '%GC_HALL_1',
      },
      sittables: [
        {
          name: 'a balcony bench',
          capacity: 2,
          emptyMsg: 'A wooden bench sits against the wall, offering a view down into the arcade.',
          occupiedMsg: '%s sitting on the balcony bench',
        },
      ],
    },

    '%GC_OFFICE_5': {
      name: 'Grand Central - Office Suite 5',
      description: `A corner office at the southwest of the first floor. Two windows look out toward the street, their glass clouded with age but intact. A third window, facing the arcade interior, has been boarded over from inside—someone wanted privacy.

The room still contains office furniture: a heavy oak desk, a chair with cracked leather upholstery, a bookcase empty except for mouse droppings and a single ledger book (its pages too water-damaged to read). The wallpaper—once a sophisticated pattern of ferns and scrollwork—peels in strips.

Someone lived here, after the offices closed. A bedroll in the corner, long since abandoned. Empty cans stacked neatly by the door. A fire pit made from a metal wastebasket, ceiling above it stained black. They're gone now.`,
      x: -13,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_BALC_S',
        north: '%GC_OFFICE_3',
      },
      sittables: [
        {
          name: 'a leather office chair',
          capacity: 1,
          emptyMsg: 'A cracked leather office chair sits behind the oak desk.',
          occupiedMsg: '%s sitting in the office chair',
        },
      ],
    },

    '%GC_OFFICE_6': {
      name: 'Grand Central - Office Suite 6',
      description: `A small office at the building's southeast corner, directly above the main entrance. The window here is remarkable—a stained glass panel depicting Seattle's waterfront circa 1890, ships in the harbor, Mount Rainier in the distance. The glass is intact, colors still vivid despite decades of Seattle weather.

The office itself is stripped bare. Only marks on the floor show where furniture once stood. The walls are painted a institutional green, faded to near-white near the window where sun has bleached them for a century.

The stained glass casts colored light across the floor—blue water, white sails, pink mountain. It's almost beautiful, this little pocket of preserved art in the midst of decay.`,
      x: -11,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_BALC_S',
        north: '%GC_OFFICE_4',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+3): Office 3, Hall 1, Office 4, Restroom
    // ═══════════════════════════════════════════════════════════════════

    '%GC_OFFICE_3': {
      name: 'Grand Central - Office Suite 3',
      description: `A mid-sized office on the building's western side, its windows looking out onto an alley between Grand Central and the next building. The view is a brick wall, close enough to touch if the window would open—which it doesn't, having been painted shut sometime in the 1950s.

The office was clearly occupied until recently—within the last year or two. A desk fashioned from scavenged doors sits against one wall. Stacks of papers, notebooks filled with cramped handwriting. A map of Pioneer Square pinned to the wall, marked with symbols in red ink. Someone was planning something, or tracking something.

Whatever they were doing, they left in a hurry. The chair is overturned. Papers are scattered. A mug lies shattered on the floor, its contents long since evaporated.`,
      x: -13,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_HALL_1',
        south: '%GC_OFFICE_5',
        north: '%GC_OFFICE_1',
      },
    },

    '%GC_HALL_1': {
      name: 'Grand Central - First Floor Hall',
      description: `The main hallway of Grand Central's first floor, connecting the offices and the elevator. The corridor runs east-west, with the elevator at the eastern end and offices branching off on both sides. The floor is hardwood, warped by moisture but still solid enough to walk on.

Transom windows above each office door let light filter into the hall—though the light is dim now, filtered through dirty glass and the arcade's broken skylights above. Brass nameplates on the doors list businesses that closed before most of the survivors were born: MARITIME INSURANCE, PACIFIC SURVEY CO., GOLDBERG & SONS ATTORNEYS.

The elevator gate stands at the hall's eastern end, the cage car visible behind its brass lattice. A call button glows faintly, suggesting power from somewhere. The building's electrical system shouldn't work—but the elevator does, somehow.`,
      x: -12,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_OFFICE_3',
        east: '%GC_OFFICE_4',
        south: '%GC_BALC_S',
        north: '%GC_BALC_N',
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
          const floorNumber = 1;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here. The brass gate stands open.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. From below, the elevator machinery groans reluctantly to life.';
          }

          return 'The button depresses with a click, but nothing happens.';
        `,
      },
      elevatorId: '%GC_E',
    },

    '%GC_OFFICE_4': {
      name: 'Grand Central - Office Suite 4',
      description: `A former professional office on the building's eastern side, adjacent to the elevator. The brass nameplate on the door reads DR. HENRY WHITMORE, DENTIST—a profession that apparently warranted good placement. The dental chair is still here, a Victorian horror of iron and leather, tilted at an angle that suggests its last patient left in a hurry.

Dental tools are scattered across a side table—picks, mirrors, forceps, all corroded to uselessness. A glass cabinet holds bottles with faded labels: COCAINE SOLUTION, CHLOROFORM, LAUDANUM. The medications of a different era, when dentistry was as much about managing pain as fixing teeth.

The ceiling has partially collapsed in one corner, revealing the floor of the hotel rooms above. Debris from that collapse covers the dental chair—plaster, wood, what might be a mattress spring.`,
      x: -11,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_HALL_1',
        south: '%GC_OFFICE_6',
        north: '%GC_OFFICE_2',
        east: '%GC_RESTROOM',
      },
      sittables: [
        {
          name: 'the dental chair',
          capacity: 1,
          emptyMsg: 'The Victorian dental chair tilts at an uncomfortable angle, leather straps dangling from its arms.',
          occupiedMsg: '%s reclining uneasily in the dental chair',
        },
      ],
    },

    '%GC_RESTROOM': {
      name: 'Grand Central - First Floor Restroom',
      description: `A communal restroom serving the first floor offices, its fixtures dating to the building's 1897 renovation. The toilets are high-tank models with pull chains—two of the three have fallen from their wall mounts and lie shattered on the tile floor. The third hangs at an angle, chain still attached, probably functional if you were desperate enough to try.

The sinks are marble, stained yellow-brown by a century of mineral deposits. Brass faucets—dry now—sport verdigris in their crevices. A cracked mirror above the sinks reflects a fragmented view of the room.

The floor is hexagonal tile in black and white, some tiles missing to reveal the wooden subfloor beneath. Water damage has buckled the floor near the toilet stalls. The smell is surprisingly neutral—whatever biological contributions accumulated here have long since dried and dissipated.`,
      x: -10,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_OFFICE_4',
        north: '%GC_STORAGE',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // NORTH ROW (y=+4): Office 1, Balcony N, Office 2, Storage
    // ═══════════════════════════════════════════════════════════════════

    '%GC_OFFICE_1': {
      name: 'Grand Central - Office Suite 1',
      description: `The northwest corner office, the largest on this floor and clearly the most prestigious. The brass nameplate reads WATSON C. SQUIRE, INVESTMENTS—one of the building's original developers maintaining an office in his creation.

The office is a wreck of former grandeur. A massive mahogany desk dominates the room, too heavy to loot, its surface scarred by knife marks and what might be bullet holes. Bookshelves line two walls, empty except for a few volumes too damaged to be worth taking. A portrait hangs askew—a stern-faced man in Victorian attire, his image slashed diagonally.

The windows offer a view of Washington Street and the buildings beyond. The glass is cracked but intact. On clear days, the Olympics would be visible in the distance. Most days, it's just grey.`,
      x: -13,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_BALC_N',
        south: '%GC_OFFICE_3',
      },
      sittables: [
        {
          name: 'a leather club chair',
          capacity: 1,
          emptyMsg: 'A worn leather club chair sits before the mahogany desk, its stuffing visible through cracks in the upholstery.',
          occupiedMsg: '%s sitting in the club chair',
        },
      ],
    },

    '%GC_BALC_N': {
      name: 'Grand Central - North Balcony',
      description: `The northern section of the first-floor balcony, overlooking the arcade's terminus where leaded glass windows look toward Washington Street. The view is spectacular despite the decay—the geometric patterns of the windows frame the grey sky beyond, creating an accidental art installation.

From here, you can see the arcade's full length stretching south. The central fountain is visible below, the iron columns marching in rows, the ruined shop fronts like empty eye sockets. Pigeons perch on the iron railings, occasionally taking flight in a flutter of grey and white.

The balcony floor is iron grating, some sections weakened by rust. Weight limits are uncertain. The railing creaks when leaned upon, though it holds.`,
      x: -12,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 12,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_OFFICE_1',
        east: '%GC_OFFICE_2',
        south: '%GC_HALL_1',
      },
      sittables: [
        {
          name: 'a window ledge',
          capacity: 2,
          emptyMsg: 'A wide window ledge offers seating with a view of the arcade below.',
          occupiedMsg: '%s sitting on the window ledge',
        },
      ],
    },

    '%GC_OFFICE_2': {
      name: 'Grand Central - Office Suite 2',
      description: `A corner office at the building's northeast, its windows looking both toward Washington Street and across the rooftops to the east. The PACIFIC SURVEY COMPANY nameplate suggests this was home to cartographers or engineers—confirmed by the remains of a large drafting table in the center of the room.

The drafting table is covered in maps—not modern ones, but originals from the 1890s. Maps of Seattle's streets, of Pioneer Square, of proposed rail lines and ferry routes. The paper is brittle, edges crumbling, but the ink has held. These are artifacts, accidentally preserved by being too specialized to loot.

A transit instrument rusts in the corner—a theodolite, its brass fittings green with verdigris. The lenses are clouded but intact. Survey stakes and measuring chains hang on hooks on one wall, alongside a framed diploma from the University of Washington, class of 1889.`,
      x: -11,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_BALC_N',
        south: '%GC_OFFICE_4',
        east: '%GC_STORAGE',
      },
    },

    '%GC_STORAGE': {
      name: 'Grand Central - First Floor Storage',
      description: `A utility space at the first floor's eastern end, originally meant for building maintenance but converted to general storage decades before The Burning. Metal shelving units line the walls, most empty but a few containing supplies that weren't worth looting: cleaning chemicals with warning labels in faded red, mop heads stiff with age, buckets with cracked handles.

A janitor's sink occupies one corner, its porcelain stained but intact. The faucet drips—actual running water, gravity-fed from tanks on the roof that somehow still hold. The water is rusty but present, a small miracle in a building where most systems have failed.

Access panels in the ceiling lead to maintenance crawlways between floors. One panel is missing, revealing dusty darkness above and a ladder bolted to the wall.`,
      x: -10,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 6,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_OFFICE_2',
        south: '%GC_RESTROOM',
      },
    },
  },
};
