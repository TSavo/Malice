// Second Chance Thrift - Second Floor (z=1)
// Apartments above the thrift store
// Four small units, various states of occupation

export const building = {
  name: 'Second Chance Thrift',
  x: -10,
  y: 8,
  width: 3,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%APT1_LOCK': {
      prototype: 'rentableLock',
      name: 'Apartment 1 Lock',
      description: 'A deadbolt on the apartment door, the standard hardware of urban rentals.',
      difficulty: 4,
    },
    '%APT1_DOOR': {
      prototype: 'door',
      name: 'Apartment 1 Door',
      description:
        'A wooden door with a brass "1" mounted at eye level. The door shows kick marks at the bottom—either break-in attempts or frustrated residents.',
      locked: true,
      open: false,
      locks: ['%APT1_LOCK'],
      material: 'wood',
      durability: 60,
    },

    '%APT2_LOCK': {
      prototype: 'rentableLock',
      name: 'Apartment 2 Lock',
      description: 'A deadbolt and chain, more security than the building probably warrants.',
      difficulty: 4,
    },
    '%APT2_DOOR': {
      prototype: 'door',
      name: 'Apartment 2 Door',
      description:
        'A wooden door with a tarnished brass "2". A peephole has been drilled at eye level. Scratch marks around the lock suggest someone had trouble with keys.',
      locked: true,
      open: false,
      locks: ['%APT2_LOCK'],
      material: 'wood',
      durability: 60,
    },

    '%APT3_LOCK': {
      prototype: 'rentableLock',
      name: 'Apartment 3 Lock',
      description: 'A basic deadbolt, the lock replaced more recently than the others.',
      difficulty: 3,
    },
    '%APT3_DOOR': {
      prototype: 'door',
      name: 'Apartment 3 Door',
      description:
        'A wooden door with a brass "3". The door is slightly ajar, swaying when the building settles.',
      locked: false,
      open: true,
      locks: ['%APT3_LOCK'],
      material: 'wood',
      durability: 55,
    },

    '%APT4_LOCK': {
      prototype: 'rentableLock',
      name: 'Apartment 4 Lock',
      description: 'A deadbolt with a sticky mechanism, requiring precise key angles.',
      difficulty: 4,
    },
    '%APT4_DOOR': {
      prototype: 'door',
      name: 'Apartment 4 Door',
      description:
        'A wooden door with a crooked brass "4". A welcome mat sits in front—BLESS THIS MESS, it reads.',
      locked: true,
      open: false,
      locks: ['%APT4_LOCK'],
      material: 'wood',
      durability: 60,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - APARTMENTS
    // ═══════════════════════════════════════════════════════════════════

    '%LANDING': {
      name: 'Second Chance Building - Second Floor Landing',
      description: `The second floor landing serves four apartment doors, numbered 1 through 4, arranged two on each side of a narrow hallway. The carpet is worn to threads in the high-traffic areas, its original color uncertain beneath years of accumulated foot traffic.

A single window at the end of the hall admits grey Seattle light, its glass grimy with years of rain residue. The light barely penetrates the hallway's gloom.

A fire extinguisher hangs on the wall, its inspection tag showing a date from years ago. The gauge reads empty. The extinguisher is decorative at this point, meeting codes that no longer apply.`,
      x: -11,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#STAIRWELL',
        up: 'z2.ts#ROOF_SW',
        east: {
          description: 'Door to Apartment 1',
          door: '%APT1_DOOR',
          to: '%APT1',
        },
        west: {
          description: 'Door to Apartment 2',
          door: '%APT2_DOOR',
          to: '%APT2',
        },
        north: '%HALL_NORTH',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'threadbare carpet',
          aliases: ['carpet', 'floor'],
          description: `The hallway carpet is worn to threads, its pile compressed to felt in the high-traffic areas. The original color might have been burgundy or brown—it's hard to tell under the layers of stain and wear. The carpet was cheap when installed and has gotten no better with age.`,
        },
        {
          prototype: 'describable',
          name: 'fire extinguisher',
          aliases: ['extinguisher'],
          description: `A fire extinguisher mounted on the wall, its red paint faded to pink. The inspection tag shows a date from years ago, the gauge reads EMPTY, and the mounting bracket is loose. The extinguisher meets no current codes, but codes are no longer current.`,
        },
      ],
    },

    '%HALL_NORTH': {
      name: 'Second Chance Building - North Hall',
      description: `The hallway continues north past two more apartment doors, ending at a window that looks out over the alley behind the building. The window is painted shut, its frame swollen with moisture, its glass clouded.

The carpet here is in slightly better condition—fewer residents walking this far into the building, the wear pattern concentrated near the stairs.

A bulletin board hangs on the wall between the apartment doors, covered with notices that no one has updated: QUIET HOURS 10PM-8AM. NO SMOKING IN COMMON AREAS. RENT DUE 1ST OF MONTH. The notices assume a world of rules and consequences. The world has moved on.`,
      x: -11,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LANDING',
        east: {
          description: 'Door to Apartment 3 (ajar)',
          door: '%APT3_DOOR',
          to: '%APT3',
        },
        west: {
          description: 'Door to Apartment 4',
          door: '%APT4_DOOR',
          to: '%APT4',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'bulletin board',
          aliases: ['board', 'notices'],
          description: `A cork bulletin board covered in notices: building rules, emergency numbers, a flyer for a tenant meeting that happened years ago. The notices are held with pushpins, their paper yellowed, their urgency expired. QUIET HOURS. NO SMOKING. RENT DUE. The rules of communal living, still posted, no longer enforced.`,
        },
        {
          prototype: 'describable',
          name: 'painted window',
          aliases: ['window'],
          description: `A window at the end of the hall, its frame swollen with moisture, its sash painted shut by some maintenance worker who valued insulation over ventilation. The glass is clouded with years of grime, the view through it approximate: the alley, the buildings beyond, the grey sky above.`,
        },
      ],
    },

    '%APT1': {
      name: 'Second Chance Building - Apartment 1',
      description: `Apartment 1 is a studio—one room serving as living, sleeping, and cooking space, with a bathroom through the only interior door. The layout is efficient, the design from an era when "efficiency" meant "cramped."

The furniture is sparse: a futon against one wall, a desk by the window, a dresser that might have come from the thrift store downstairs. The kitchen is a strip along one wall—mini fridge, two-burner stove, sink, microwave. The essentials.

Books are stacked everywhere—on the desk, on the floor, on the windowsill. The resident was a reader, or was accumulating books faster than reading them. The spines show an eclectic taste: philosophy, science fiction, cookbooks, graphic novels. The books remain. The reader has departed.`,
      x: -10,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LANDING',
      },
      sittables: [
        {
          name: 'the futon',
          capacity: 2,
          emptyMsg:
            'A futon mattress on a metal frame serves as both couch and bed, depending on the hour.',
          occupiedMsg: '%s sitting on the futon',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg: 'An office chair on casters sits at the desk, positioned for work or reading.',
          occupiedMsg: '%s seated at the desk',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'futon',
          aliases: ['bed', 'couch'],
          description: `A futon on a metal frame, its mattress covered in a patterned sheet that's seen better days. The futon is positioned to face the window, either for light or for the view of the street below. The frame creaks when weight shifts. The mattress sags in the middle. It's furniture of compromise.`,
        },
        {
          prototype: 'desk',
          name: 'cluttered desk',
          aliases: ['desk'],
          description: `A desk covered in books and papers, the workspace of someone who was either very busy or very disorganized. A laptop sits closed in the center—too old to be valuable, too new to be vintage. Notes are scrawled on post-its stuck to the wall. The notes are illegible, personal shorthand for thoughts that made sense once.`,
        },
        {
          prototype: 'cabinet',
          name: 'book stacks',
          aliases: ['books'],
          description: `Books stacked everywhere—philosophy (Foucault, Butler, Deleuze), science fiction (Le Guin, Octavia Butler, Kim Stanley Robinson), cookbooks (vegetarian, specifically), graphic novels (indie stuff, not superhero). The collection suggests someone who was curious about ideas and about feeding themselves on a budget. The books are a library. The librarian is gone.`,
        },
      ],
    },

    '%APT2': {
      name: 'Second Chance Building - Apartment 2',
      description: `Apartment 2 is nearly identical in layout to its neighbor—studio, kitchen strip, single interior door to bathroom—but the personality is entirely different. This resident liked pink. Everything is pink: the bedspread, the curtains, the throw pillows, the kitchen towels. Pink fairy lights are strung around the window frame, their LEDs dark.

Photographs cover one wall, printed and taped in overlapping layers. Selfies, group shots, landscapes, the visual diary of someone who documented their life extensively. The faces in the photos are young—early twenties, probably—the smiles bright.

A keyboard synthesizer sits on a stand by the window, its power cable trailing to a surge protector that's switched off. Music was made here. The music has stopped.`,
      x: -12,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LANDING',
      },
      sittables: [
        {
          name: 'the bed',
          capacity: 2,
          emptyMsg:
            'A twin bed with a pink bedspread and too many throw pillows occupies one corner.',
          occupiedMsg: '%s sitting on the pink bed',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'pink bed',
          aliases: ['bed'],
          description: `A twin bed buried under pillows and a fuzzy pink bedspread. The aesthetic is aggressively cute—throw pillows in heart shapes, a stuffed animal collection at the headboard, fairy lights framing the window above. Someone lived here who was determined to create a space that felt warm and personal. They succeeded.`,
        },
        {
          prototype: 'describable',
          name: 'photo wall',
          aliases: ['photos', 'pictures'],
          description: `An entire wall covered in printed photographs, taped in overlapping layers. Selfies with friends, shots of meals at restaurants, sunsets from various locations, concert crowds, the visual record of a life actively documented. The faces are young. The smiles are genuine. The photographer is no longer here to add to the collection.`,
        },
        {
          prototype: 'furniture',
          name: 'synthesizer',
          aliases: ['keyboard', 'synth'],
          description: `A keyboard synthesizer on a metal stand, its keys dusty, its cables coiled but still connected. The synthesizer is a mid-range model—not professional, not toy, the kind bought by someone serious about learning. Sheet music and chord charts are scattered nearby. Practice was happening here. The practice has ended.`,
        },
      ],
    },

    '%APT3': {
      name: 'Second Chance Building - Apartment 3',
      description: `Apartment 3 is empty—not abandoned, but vacated. The furniture is gone, the personal effects removed, the space cleaned to the level that landlords require for security deposit return. The carpet shows indentations where furniture stood: a bed here, a desk there, the ghost of a floor plan.

The kitchen counters are wiped clean, the appliances still functional but unpowered. A single item was left behind: a refrigerator magnet shaped like a cactus, forgotten on the fridge door.

The door was left unlocked, or the lock failed, or someone came through and didn't bother to secure it on the way out. The apartment is open, available, waiting for a tenant who will never sign a lease.`,
      x: -10,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_NORTH',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'carpet indentations',
          aliases: ['indentations', 'carpet'],
          description: `The carpet shows the ghost of previous furniture: rectangles where a bed stood, circles where a table's legs compressed the pile, the floor plan of someone's life visible in the pattern of wear. The furniture is gone. The impressions remain, slowly rising as the carpet fibers attempt to remember their original shape.`,
        },
        {
          prototype: 'describable',
          name: 'cactus magnet',
          aliases: ['magnet', 'cactus'],
          description: `A refrigerator magnet shaped like a cartoon cactus, its surface printed with the word ARIZONA. The magnet is the only item left in the apartment—forgotten during move-out, or deliberately abandoned as too trivial to pack. The cactus smiles its fixed smile, waiting for someone to notice it.`,
        },
      ],
    },

    '%APT4': {
      name: 'Second Chance Building - Apartment 4',
      description: `Apartment 4 has the feel of long habitation—furniture worn into familiar shapes, walls decorated with years of accumulated objects, the density of a life lived in place. The resident was older, judging from the decor: crocheted afghans, ceramic figurines, framed photographs of grandchildren.

A recliner faces a small television, the setup of someone who spent evenings watching shows and then falling asleep with the TV on. The TV is dark, but a blanket is draped over the recliner, ready for napping.

The kitchen is stocked with canned goods—soup, vegetables, tuna, the supplies of someone who prepared for emergencies. The preparations may have helped. The resident's fate is unknown.`,
      x: -12,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_NORTH',
      },
      sittables: [
        {
          name: 'the recliner',
          capacity: 1,
          emptyMsg:
            'A well-worn recliner faces the dark television, a crocheted blanket draped over the arm.',
          occupiedMsg: '%s settled into the recliner',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'recliner',
          aliases: ['chair'],
          description: `A La-Z-Boy recliner in brown fabric, its surface worn smooth where arms and heads have rested thousands of times. The footrest extends when the handle is pulled; the mechanism still works. A crocheted blanket drapes over one arm, positioned for easy nap coverage. The recliner is the center of the apartment's social universe—all other furniture orients toward it.`,
        },
        {
          prototype: 'cabinet',
          name: 'canned goods',
          aliases: ['cans', 'pantry', 'food'],
          description: `Kitchen cabinets stocked with canned goods: Campbell's soup in various flavors, Green Giant vegetables, StarKist tuna. The supplies of someone who believed in being prepared. The cans are organized by type, labels facing forward, the system of someone who took inventory seriously. The cans are still good, theoretically. Canned goods last.`,
        },
        {
          prototype: 'describable',
          name: 'grandchildren photos',
          aliases: ['photos', 'pictures', 'frames'],
          description: `Framed photographs cover every flat surface: school portraits, baby pictures, family gatherings. The grandchildren age across the photos, from infants to teenagers, the progression visible across the frames. The resident surrounded themselves with family, even when family wasn't present. The photos preserve smiles from happier times.`,
        },
        {
          prototype: 'describable',
          name: 'ceramic figurines',
          aliases: ['figurines', 'ceramics'],
          description: `Ceramic figurines crowd the windowsill and bookshelf: Precious Moments children, angel figures, a nativity scene left out year-round. The collection suggests either deep sentiment or compulsive purchasing. Each figurine is positioned carefully, dusted regularly, the objects of someone's devoted attention.`,
        },
      ],
    },
  },
};
