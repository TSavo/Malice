// Deep Cisterns - Level z=-4
// Ancient water infrastructure beneath the city
// Pre-fire cisterns, abandoned reservoirs, and flooded passages

export const building = {
  name: 'Deep Cisterns',
  x: 13,
  y: -10,
  width: 19,
  height: 10,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // ACCESS POINTS
    // ═══════════════════════════════════════════════════════════════════════

    '%CHINATOWN_ACCESS': {
      name: 'Chinatown Cistern Access',
      description: `The shaft opens into a flooded chamber that predates the Chinese community above—a cistern built to hold rainwater before the city had reliable water service. The cistern is brick-lined, its dome still intact, the water dark and still.

The chamber was rediscovered by those who dug the Chinatown tunnels. They found it useful. They kept it secret.`,
      x: 0,
      y: -10,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 0,
      waterLevel: 60,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/chinatown-underground/z-2.ts',
          room: '%ANCIENT_TUNNEL',
          description: 'A shaft rises toward the ancient tunnels',
        },
        south: '%CENTRAL_CISTERN',
      },
      objects: [
        { prototype: 'sign', name: 'carved markers', description: 'Chinese characters are carved into the brick above the waterline—markers left by those who found this place and understood its value.', boltedDown: true },
        { prototype: 'furniture', name: 'a mooring ring', description: 'An iron ring is set into the wall at water level. Someone once moored boats here.', boltedDown: true },
      ],
    },

    '%INDUSTRIAL_ACCESS': {
      name: 'Industrial Cistern Access',
      description: `The flooded shaft opens into a cistern that was incorporated into the industrial water system—a pre-fire reservoir adapted to serve the factories above. The chamber is larger than the domestic cisterns, expanded when industry demanded more water than the original construction could provide.

The water is dark, tainted with the residue of a century of industrial use.`,
      x: 10,
      y: -19,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 3,
      waterLevel: 70,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/industrial-underground/z-2.ts',
          room: '%PUMP_STATION',
          description: 'A flooded shaft rises toward the pump station',
        },
        west: '%INDUSTRIAL_RESERVOIR',
      },
      objects: [
        { prototype: 'furniture', name: 'industrial intake pipes', description: 'Large iron intake pipes extend from the walls, drawing water to the factories above. The pipes are cold, the water still.', boltedDown: true },
        { prototype: 'sign', name: 'a depth gauge', description: 'A rusted depth gauge is mounted to the wall, its needle resting at the bottom of its range. The water level hasn\'t been monitored for decades.', boltedDown: true },
      ],
    },

    '%SEWER_ACCESS': {
      name: 'Sewer Cistern Access',
      description: `The shaft descends from the sewer junction into a cistern that was repurposed as a combined sewer overflow—a chamber that filled during heavy rains to prevent street flooding. The original cistern construction remains beneath the modifications, older brick visible beneath newer concrete.`,
      x: 13,
      y: -17,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 2,
      waterLevel: 50,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/industrial-underground/z-2.ts',
          room: '%SEWER_JUNCTION',
          description: 'A shaft rises toward the sewer junction',
        },
        west: '%INDUSTRIAL_RESERVOIR',
      },
      objects: [
        { prototype: 'sign', name: 'an overflow marker', description: 'Painted lines on the wall show overflow levels: "10%", "25%", "50%", "DANGER". The highest mark shows evidence of being reached.', boltedDown: true },
        { prototype: 'furniture', name: 'an overflow weir', description: 'A concrete weir controls overflow into deeper passages. The mechanism is automated but no longer functional.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN CISTERN CHAMBERS
    // ═══════════════════════════════════════════════════════════════════════

    '%CENTRAL_CISTERN': {
      name: 'Central Cistern',
      description: `The passage opens into the largest of the pre-fire cisterns—a domed chamber that once held the water supply for an entire neighborhood. The dome rises thirty feet overhead, its brickwork still intact, its acoustics producing echoes that seem to come from everywhere and nowhere.

The water is waist-deep and cold. What lies beneath the surface is unclear.`,
      x: 0,
      y: -13,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 0,
      waterLevel: 65,
      outdoor: false,
      exits: {
        north: '%CHINATOWN_ACCESS',
        east: '%EASTERN_CISTERN',
        west: '%WESTERN_CISTERN',
        south: '%DEEP_PASSAGE_N',
      },
      objects: [
        { prototype: 'sign', name: 'a construction date', description: 'Carved into the keystone of the dome: "1876". Thirteen years before the Great Fire. The cistern survived what the city above did not.', boltedDown: true },
        { prototype: 'furniture', name: 'the intake well', description: 'A circular well in the center of the chamber once drew water from deeper aquifers. The mechanism is gone; the shaft remains.', boltedDown: true },
        { prototype: 'sign', name: 'scratched warnings', description: 'Scratched into the brick at water level: "DEPTH UNKNOWN" and "DO NOT DIVE".', boltedDown: true },
      ],
    },

    '%EASTERN_CISTERN': {
      name: 'Eastern Cistern',
      description: `A smaller cistern chamber extends east from the central dome, its construction slightly newer—perhaps an expansion when the neighborhood grew. The ceiling is lower here, the space more intimate, the water shallower.

This chamber was used for storage during Prohibition. The bottles are gone. The racks remain.`,
      x: 5,
      y: -13,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 0,
      waterLevel: 40,
      outdoor: false,
      exits: {
        west: '%CENTRAL_CISTERN',
        east: '%INDUSTRIAL_RESERVOIR',
      },
      objects: [
        { prototype: 'furniture', name: 'bottle racks', description: 'Wooden racks are bolted to the walls above the waterline, designed to hold bottles. A few broken bottles remain, their contents long since dispersed.', boltedDown: true },
        { prototype: 'crate', name: 'a floating crate', description: 'A wooden crate floats in the water, its lid missing. Whatever it contained is gone.', boltedDown: true },
        { prototype: 'sign', name: 'a prohibition marker', description: 'Chalked on the wall: "PROPERTY OF THE GOLDEN DRAGON - 1927". The Golden Dragon was a notorious speakeasy.', boltedDown: true },
      ],
    },

    '%WESTERN_CISTERN': {
      name: 'Western Cistern',
      description: `The western cistern is older than the central dome—perhaps the original construction, later connected to the larger system. The brickwork is rougher, the ceiling lower, the space more primitive. This was Seattle's first attempt at water infrastructure, built when the city was still a logging camp with ambitions.`,
      x: -5,
      y: -13,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 0,
      waterLevel: 55,
      outdoor: false,
      exits: {
        east: '%CENTRAL_CISTERN',
        south: '%COLLAPSED_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'a pioneer inscription', description: 'Carved into the oldest section of wall: "H.Y. 1865" and "WATER FOR THE PEOPLE". Henry Yesler, perhaps, or one of his workers.', boltedDown: true },
        { prototype: 'furniture', name: 'a hand pump base', description: 'The iron base of a hand pump remains bolted to a platform. The pump itself was removed; the base was too heavy to salvage.', boltedDown: true },
      ],
    },

    '%INDUSTRIAL_RESERVOIR': {
      name: 'Industrial Reservoir',
      description: `The passage opens into a larger chamber that was expanded to serve industrial needs—the original cistern walls extended outward, the capacity multiplied to feed the factories above. The construction is a patchwork of eras: pioneer brick, Victorian expansion, twentieth-century concrete.

The water is deeper here. The bottom is not visible.`,
      x: 10,
      y: -13,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 0,
      waterLevel: 80,
      outdoor: false,
      exits: {
        west: '%EASTERN_CISTERN',
        east: '%INDUSTRIAL_ACCESS',
        north: '%SEWER_ACCESS',
        south: '%DEEP_PASSAGE_E',
      },
      objects: [
        { prototype: 'furniture', name: 'industrial intake headers', description: 'Massive iron headers distributed water to the factories above. The valves are frozen shut, the headers corroded but intact.', boltedDown: true },
        { prototype: 'sign', name: 'a capacity plate', description: 'A brass plate reads: "RESERVOIR 7 - CAPACITY 500,000 GALLONS - SEATTLE WATER DEPT 1904".', boltedDown: true },
        { prototype: 'sign', name: 'a drowning warning', description: 'A painted sign, barely visible above the waterline: "DANGER - NO SWIMMING - STRONG CURRENTS". The currents are gone. The danger may remain.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP PASSAGES
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_PASSAGE_N': {
      name: 'Deep Passage North',
      description: `A flooded passage extends south from the central cistern, connecting to deeper chambers that may have been natural caves before they were incorporated into the water system. The passage is narrow, the water deep, the current barely perceptible.

Something built these passages before the city existed. The city just found them and put them to use.`,
      x: 0,
      y: -15,
      z: -4,
      population: 0,
      ambientNoise: 3,
      lighting: 0,
      waterLevel: 75,
      outdoor: false,
      exits: {
        north: '%CENTRAL_CISTERN',
        south: '%ANCIENT_CHAMBER',
      },
      objects: [
        { prototype: 'sign', name: 'natural formations', description: 'The walls show signs of water erosion—not construction, but natural cave formation. The passage existed before it was discovered.', boltedDown: true },
      ],
    },

    '%DEEP_PASSAGE_E': {
      name: 'Deep Passage East',
      description: `A passage extends from the industrial reservoir into territory that appears on no maps—tunnels that connect to the natural cave system beneath Seattle's hills. The construction ends here; beyond is raw stone, water-carved over millennia.`,
      x: 10,
      y: -15,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 0,
      waterLevel: 70,
      outdoor: false,
      exits: {
        north: '%INDUSTRIAL_RESERVOIR',
        west: '%ANCIENT_CHAMBER',
      },
      objects: [
        { prototype: 'sign', name: 'a surveyor\'s mark', description: 'A surveyor\'s mark is chiseled into the wall: "END OF SURVEY - CONTINUE AT OWN RISK - 1898". No one continued.', boltedDown: true },
      ],
    },

    '%COLLAPSED_TUNNEL': {
      name: 'Collapsed Tunnel',
      description: `The western passage ends at a collapse—tons of earth and brick filling what was once a connection to other cisterns. The collapse appears deliberate; the bricks are too regular, the debris too arranged. Someone sealed this passage intentionally.

What lies beyond is unknown. What was sealed away remains sealed.`,
      x: -5,
      y: -15,
      z: -4,
      population: 0,
      ambientNoise: 3,
      lighting: 0,
      waterLevel: 45,
      outdoor: false,
      exits: {
        north: '%WESTERN_CISTERN',
        east: '%ANCIENT_CHAMBER',
      },
      objects: [
        { prototype: 'sign', name: 'a warning stone', description: 'A flat stone is set into the collapse, carved with a single word: "SEALED". Below it, in smaller letters: "1889". The year of the fire.', boltedDown: true },
        { prototype: 'crate', name: 'sealed debris', description: 'The debris is too regular to be accidental—bricks laid deliberately, earth packed carefully. Someone wanted this passage closed forever.', boltedDown: true },
      ],
    },

    '%ANCIENT_CHAMBER': {
      name: 'Ancient Chamber',
      description: `The passages converge in a chamber that predates human construction—a natural cave, expanded by water and time, discovered and used but never truly tamed. The walls are smooth where water carved them, rough where tools tried to shape them. The ceiling disappears into darkness overhead.

The water here is cold and still. No current moves it. Nothing disturbs its surface.

This is the oldest place beneath Seattle. The city above is young. This place was here before.`,
      x: 3,
      y: -17,
      z: -4,
      population: 0,
      ambientNoise: 2,
      lighting: 0,
      waterLevel: 60,
      outdoor: false,
      exits: {
        north: '%DEEP_PASSAGE_N',
        east: '%DEEP_PASSAGE_E',
        west: '%COLLAPSED_TUNNEL',
        down: '%ABYSSAL_SHAFT',
      },
      objects: [
        { prototype: 'sign', name: 'petroglyphs', description: 'Faded marks on the walls might be natural formations or might be very old carvings. If they are art, they predate any known culture in the region.', boltedDown: true },
        { prototype: 'furniture', name: 'a natural altar', description: 'A flat stone rises from the water, smooth and level. Its position seems too perfect to be natural, but no tool marks are visible.', boltedDown: true },
        { prototype: 'sign', name: 'a modern warning', description: 'A plastic placard, incongruous against the ancient stone: "STRUCTURAL SURVEY INCOMPLETE - DO NOT PROCEED - CITY ENGINEERING 1987". No further surveys were conducted.', boltedDown: true },
      ],
    },

    '%ABYSSAL_SHAFT': {
      name: 'Abyssal Shaft',
      description: `A vertical shaft descends from the ancient chamber into absolute darkness. The walls are smooth, worn by water that no longer flows, leading down to depths that no survey has measured. Sound drops into the shaft and does not return as echo.

The water below is not visible. The depth is not known. What waits at the bottom—if there is a bottom—has never been documented.

Some shafts are better left unexplored.`,
      x: 3,
      y: -17,
      z: -5,
      population: 0,
      ambientNoise: 0,
      lighting: 0,
      waterLevel: 90,
      outdoor: false,
      exits: {
        up: '%ANCIENT_CHAMBER',
      },
      objects: [
        { prototype: 'sign', name: 'a warning scratched in stone', description: 'Scratched into the shaft wall, barely visible: "WENT DOWN. DID NOT RETURN. - T.M. 1923"', boltedDown: true },
        { prototype: 'furniture', name: 'a rusted cable', description: 'A cable extends down into the shaft, its upper end anchored to a ring in the stone. The cable disappears into darkness. Its lower end is not visible.', boltedDown: true },
        { prototype: 'sign', name: 'the silence', description: 'The absence of sound is profound. No dripping. No echo. No movement. The shaft swallows everything.', boltedDown: true },
      ],
    },
  },
};
