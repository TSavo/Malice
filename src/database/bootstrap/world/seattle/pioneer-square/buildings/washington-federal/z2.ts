// Washington Federal Bank - Roof (z=2)
// Rooftop with clock tower and HVAC equipment
// The clock is frozen at 2:47

export const building = {
  name: 'Washington Federal Bank',
  x: -1,
  y: -2,
  width: 2,
  height: 2,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A heavy padlock on the roof access door, the kind meant to keep unauthorized personnel from falling off buildings.',
      difficulty: 4,
    },
    '%ROOF_DOOR': {
      prototype: 'door',
      name: 'Roof Access Door',
      description:
        'A metal door leading to the roof, marked with warnings about authorized personnel and fall hazards.',
      locked: false,
      open: true,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 80,
    },

    '%CLOCK_LOCK': {
      prototype: 'lock',
      name: 'Clock Tower Lock',
      description:
        'A brass lock on the clock tower access panel, tarnished but functional.',
      difficulty: 3,
    },
    '%CLOCK_DOOR': {
      prototype: 'door',
      name: 'Clock Tower Panel',
      description:
        'A small maintenance panel providing access to the clock mechanism. The brass is tarnished green.',
      locked: true,
      open: false,
      locks: ['%CLOCK_LOCK'],
      material: 'metal',
      durability: 70,
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF LEVEL (z=2) - OUTDOOR AREA
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_ACCESS': {
      name: 'Washington Federal - Roof Access',
      description: `The stairwell terminates in a small vestibule before the roof door—a transitional space between the climate-controlled interior and the exposed rooftop. Safety notices are posted on the walls: AUTHORIZED PERSONNEL ONLY, FALL HAZARD, ROOF ACCESS FOR MAINTENANCE ONLY.

The door to the roof stands open, someone having forced the padlock at some point. The lock hangs uselessly from the hasp. Beyond the door, grey Seattle sky is visible, and the sound of wind carries into the vestibule.

A window in the door offers a preview of the roof—gravel and tar paper, HVAC equipment, the back of the clock tower that faces the street below.`,
      x: -1,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z1.ts#STAIRWELL_1',
        east: {
          description: 'The roof access door leads outside',
          door: '%ROOF_DOOR',
          to: '%ROOF_MAIN',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'safety notices',
          aliases: ['notices', 'signs', 'warnings'],
          description: `Safety notices in red and yellow: "ROOF ACCESS - AUTHORIZED PERSONNEL ONLY," "FALL HAZARD - USE CAUTION," "EMERGENCY PROCEDURES POSTED IN MAINTENANCE ROOM." The warnings assumed someone cared about liability. The liability ended with everything else.`,
        },
      ],
    },

    '%ROOF_MAIN': {
      name: 'Washington Federal - Main Roof',
      description: `The bank's flat roof stretches toward the building's edges, covered in gravel over tar paper that has cracked and buckled in places. HVAC equipment clusters in the center—massive air handling units, condensers, the mechanical systems that kept the building comfortable. The equipment is silent now, its last maintenance check recorded on a tag that no one will read.

The clock tower rises from the building's eastern facade, its back visible from here—a brick structure housing the clock mechanism, accessible through a small maintenance panel. The clock faces the street, its hands frozen at 2:47, a time that meant nothing when it happened and means nothing now.

The view from the roof encompasses Pioneer Square and beyond—other rooftops, the waterfront visible to the west, Smith Tower rising to the south. The perspective is commanding. There is no one left to command.`,
      x: -2,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_ACCESS',
        south: '%CLOCK_TOWER',
        north: '%ROOF_EDGE',
        east: '%ROOF_CORNER',
      },
      sittables: [
        {
          name: 'equipment housing',
          capacity: 2,
          emptyMsg:
            'The housing of an HVAC unit provides a place to sit, its metal warm from residual heat.',
          occupiedMsg: '%s sitting on the HVAC housing',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'HVAC equipment',
          aliases: ['hvac', 'air conditioning', 'machinery'],
          description: `Industrial air handling equipment occupies the center of the roof—massive grey boxes connected by ductwork, compressors that once hummed with climate control. Maintenance tags dangle from access panels, recording inspection dates that stopped years ago. The equipment is dead, but the building's temperature is now whatever temperature Seattle provides.`,
        },
        {
          prototype: 'describable',
          name: 'clock tower',
          aliases: ['tower', 'clock'],
          description: `The clock tower rises from the building's eastern facade—a brick structure in neoclassical style, housing the clock mechanism that once kept time for the neighborhood. From the roof, only the back of the tower is visible: a maintenance access panel, tarnished brass hardware, the works that no longer work. The clock faces the street below, its hands frozen at 2:47.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop view',
          aliases: ['view', 'panorama'],
          description: `The roof offers a commanding view of Pioneer Square—other historic buildings at roughly the same height, their ornate cornices and rooftop gardens visible at angles the street never provides. Smith Tower rises to the south, its white terracotta grey with rain. The waterfront is visible to the west, the bay beyond. The city spreads in all directions, empty and quiet.`,
        },
      ],
    },

    '%CLOCK_TOWER': {
      name: 'Washington Federal - Clock Tower',
      description: `The clock tower—a small brick structure rising from the bank's facade, housing the mechanism that once told time to the neighborhood. The tower is barely large enough for a person to enter, designed for maintenance access rather than occupation.

Inside, the clockwork is visible: gears and springs and the careful engineering of mechanical timekeeping. The mechanism is frozen, its mainspring unwound, its escapement still. A small window looks out at the back of the clock face, the hands visible in reverse, forever pointing at 2:47.

The clock ran on springs and gears, wound weekly by someone who understood the mechanism. That someone is gone. The clock keeps its last time, a monument to a moment that seemed ordinary when it happened.`,
      x: -2,
      y: -3,
      z: 2,
      population: 0,
      ambientNoise: 20,
      lighting: 70,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: {
          description: 'A maintenance panel leads back to the main roof',
          door: '%CLOCK_DOOR',
          to: '%ROOF_MAIN',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'clock mechanism',
          aliases: ['clockwork', 'mechanism', 'gears'],
          description: `The clock's inner workings: brass gears meshed in precise ratios, a mainspring coiled tight (or loose, now), an escapement that once tick-tocked the seconds away. The mechanism is German engineering, built to last centuries with proper maintenance. The maintenance stopped. The mechanism froze. The time it shows—2:47—is neither PM nor AM, neither important nor unimportant. It's just when the clock stopped.`,
        },
        {
          prototype: 'describable',
          name: 'clock face',
          aliases: ['face', 'dial', 'hands'],
          description: `The back of the clock face is visible from inside the tower—Roman numerals in reverse, the minute and hour hands frozen at 2:47. The hands are iron, painted black, large enough to be readable from the street below. From this angle, you can see how they're mounted, how they once moved, how they will never move again. Time stopped. The clock agrees.`,
        },
        {
          prototype: 'furniture',
          name: 'winding mechanism',
          aliases: ['winder', 'key'],
          description: `A large brass key in a receptacle—the clock's winding mechanism. Weekly, someone would insert the key and wind the mainspring, storing the energy that powered the clock for seven days. The key is still in place, rusted into position. The spring is fully unwound. No amount of winding will make the clock care about time again.`,
        },
      ],
    },

    '%ROOF_EDGE': {
      name: 'Washington Federal - Roof Edge (North)',
      description: `The northern edge of the roof offers views of the blocks beyond—2nd Avenue continuing north toward downtown, the Corp Construction zone's black barriers visible in the distance. A low parapet wall runs along the edge, knee-height, more symbolic than protective.

Someone has left a camp chair here, weathered and stained, its fabric torn. The chair faces north, positioned for watching the street below. Cigarette butts are scattered nearby, filtered and unfiltered, the accumulated evidence of someone who spent time here. Watching. Waiting. The watching ended. The chair remains.

A fire escape ladder is bolted to the parapet, providing emergency egress to the alley below. The ladder is rusted but structurally sound—tested by whoever left the chair, probably.`,
      x: -2,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_MAIN',
        down: null, // Fire escape to alley - could be implemented
      },
      sittables: [
        {
          name: 'camp chair',
          capacity: 1,
          emptyMsg:
            'A weathered camp chair faces north, positioned for watching the street below.',
          occupiedMsg: '%s in the camp chair',
        },
        {
          name: 'parapet wall',
          capacity: 2,
          emptyMsg:
            'The low parapet wall at the roof\'s edge offers precarious seating.',
          occupiedMsg: '%s perched on the parapet',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['ladder', 'escape'],
          description: `A metal fire escape ladder bolted to the parapet wall, providing access to the alley three stories below. The ladder is rusted but sound, its rungs worn smooth by hands and feet. The ladder was meant for emergencies. Someone has used it regularly—the wear patterns show frequent traffic.`,
        },
        {
          prototype: 'describable',
          name: 'cigarette butts',
          aliases: ['butts', 'cigarettes', 'smoking'],
          description: `Cigarette butts scattered across the gravel—dozens of them, filtered and unfiltered, various brands or no brand at all. Someone spent a lot of time on this roof, smoking and watching. The butts are weathered, bleached by sun and rain. The smoking stopped months ago. The evidence remains.`,
        },
        {
          prototype: 'describable',
          name: 'northern view',
          aliases: ['view', 'north'],
          description: `The view north shows 2nd Avenue continuing toward downtown—taller buildings rising in the distance, the Corp Construction zone's black barriers marking a boundary. The debris wall that separates Pioneer Square from the wasteland beyond is visible to the northwest, a line of collapsed buildings that became topography. The view is sobering. Most views are now.`,
        },
      ],
    },

    '%ROOF_CORNER': {
      name: 'Washington Federal - Roof Corner (Southeast)',
      description: `The southeast corner of the roof offers the best views—Smith Tower visible to the south, its white terracotta spire the tallest structure in the immediate area. The waterfront is visible to the west, Elliott Bay grey and cold, occasionally showing the silhouette of a ship in the deep channel.

The parapet here is more substantial, a decorative balustrade that matches the neoclassical facade below. Stone urns that once held decorative plants now hold rainwater and dead leaves. The architectural flourishes continue even here, where visitors were never meant to see.

A drainage gutter runs along the parapet, channeling rainwater to downspouts at the corners. The gutter is clogged with debris—leaves, feathers, the accumulated detritus of seasons without maintenance. Water pools instead of draining.`,
      x: -1,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_MAIN',
      },
      sittables: [
        {
          name: 'stone balustrade',
          capacity: 2,
          emptyMsg:
            'The decorative stone balustrade offers seating with a view.',
          occupiedMsg: '%s sitting on the balustrade',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'stone urns',
          aliases: ['urns', 'planters'],
          description: `Decorative stone urns along the parapet, designed to hold ornamental plants that would soften the building's edges. The plants died long ago, leaving the urns to collect rainwater and windblown debris. Each urn is a small ecosystem now—dead leaves decomposing into mulch, moss growing on shaded surfaces, the occasional hardy weed pushing through.`,
        },
        {
          prototype: 'describable',
          name: 'Smith Tower view',
          aliases: ['view', 'tower', 'smith'],
          description: `Smith Tower rises to the south—its white terracotta facade stained grey by decades of Seattle rain, its Chinese guardian figures visible at the corners if you know where to look. The tower was the tallest building west of the Mississippi when it was built. Now it's just the tallest building still standing in Pioneer Square, home to Continuum Banking and whatever else happens inside its walls.`,
        },
        {
          prototype: 'describable',
          name: 'clogged gutter',
          aliases: ['gutter', 'drainage'],
          description: `A copper drainage gutter runs along the parapet, channeling rainwater to downspouts at the corners. The gutter is clogged with debris—years of leaves and feathers and mysterious organic matter forming a dam. Water pools behind the clog, staining the parapet, finding other ways to drain. The building is slowly losing its battle with water.`,
        },
      ],
    },
  },

  postProcessors: [],
};
