// Junction Corridor - connecting The Junction to Northern Junction
// Fills the gap from (-14,5) to (-7,6) along the West Spine

export const rooms = {
  '%JUNCTION_E1': {
    name: 'Corridor from The Junction',
    description: `The passage extends eastward from The Junction, its brick walls bearing the soot stains of a century of torch and lantern use. The ceiling drops slightly as the tunnel follows the original contours of the 1889 street level, dipping where the old roadbed did before the city covered it all.

Water damage marks the lower courses of brick—the high-water line from when the Great Fire's ashes were still being washed into the bay. Everything below that line has a different color, leached of its original red by decades of flooding before the city finally got the drainage right.`,
    x: -13,
    y: 5,
    z: -2,
    population: 0,
    ambientNoise: 12,
    lighting: 15,
    waterLevel: 5,
    outdoor: false,
    exits: {
      west: {
        to: 'underground/upper-tunnels/the-junction.ts',
        description: 'The passage leads west to The Junction',
      },
      east: '%JUNCTION_E2',
    },
    objects: [
      {
        prototype: 'sign',
        name: 'water stains',
        description: 'Dark mineral deposits trace the history of flooding along the lower walls, each band marking a different inundation before the drainage was perfected.',
        boltedDown: true,
      },
    ],
  },

  '%JUNCTION_E2': {
    name: 'Buried Intersection',
    description: `The tunnel passes through what was once a street intersection, the perpendicular passage now collapsed and blocked with rubble. Fragments of wooden sidewalk decking protrude from the ceiling—the undersides of boardwalks that once crossed here, now entombed in fill and forgotten.

A brass survey marker embedded in the floor reads "CITY OF SEATTLE 1907," marking when engineers mapped these abandoned spaces for the first time since they were buried. The survey predates the current street grid by decades.`,
    x: -12,
    y: 5,
    z: -2,
    population: 0,
    ambientNoise: 10,
    lighting: 12,
    waterLevel: 5,
    outdoor: false,
    exits: {
      west: '%JUNCTION_E1',
      east: '%JUNCTION_E3',
    },
    objects: [
      {
        prototype: 'sign',
        name: 'brass survey marker',
        description: 'A brass disc set into the floor, inscribed "CITY OF SEATTLE 1907" with reference numbers that meant something to surveyors over a century ago.',
        boltedDown: true,
      },
      {
        prototype: 'furniture',
        name: 'wooden sidewalk fragments',
        description: 'Splintered remnants of the wooden boardwalks that once spanned the street intersections, now fossilized in the ceiling fill.',
        boltedDown: true,
      },
    ],
  },

  '%JUNCTION_E3': {
    name: 'Old Commercial Basement',
    description: `The passage cuts through the basement of a building that burned in 1889 and was never rebuilt above this level. Iron window grates still cover the wells that once admitted light from the sidewalk—the glass long shattered, the wells filled with dirt and debris from the street regrading.

The brick walls bear faded painted signs: "J. MORTON DRY GOODS" on one side, "MINERS SUPPLIES" on the other. The two businesses shared this basement, a common arrangement when Seattle was young and space was at a premium.`,
    x: -11,
    y: 5,
    z: -2,
    population: 0,
    ambientNoise: 8,
    lighting: 10,
    waterLevel: 0,
    outdoor: false,
    exits: {
      west: '%JUNCTION_E2',
      east: '%JUNCTION_E4',
    },
    objects: [
      {
        prototype: 'sign',
        name: 'faded business signs',
        description: 'Painted advertisements for J. Morton Dry Goods and a miners supply company, the paint preserved by darkness but slowly flaking away.',
        boltedDown: true,
      },
      {
        prototype: 'furniture',
        name: 'iron window grates',
        description: 'Decorative iron grates that once covered light wells to the sidewalk above, now blocked by a century of accumulated fill.',
        boltedDown: true,
      },
    ],
  },

  '%JUNCTION_E4': {
    name: 'Collapsed Stairwell',
    description: `A wooden staircase once rose here to the street level, its treads now rotted away and its stringers collapsed into a jumble of timber. Someone cleared a path through the debris decades ago, the wood shoved aside rather than removed, creating a low crawlspace that becomes a proper passage again on the far side.

The ceiling is lower here where the stairwell's landing created a natural break in the tunnel height. Taller visitors must duck to pass through, their heads brushing the underside of what was once an elegant entryway.`,
    x: -10,
    y: 5,
    z: -2,
    population: 0,
    ambientNoise: 10,
    lighting: 8,
    waterLevel: 0,
    outdoor: false,
    exits: {
      west: '%JUNCTION_E3',
      east: '%JUNCTION_E5',
    },
    objects: [
      {
        prototype: 'furniture',
        name: 'collapsed timber',
        description: 'The remains of a wooden staircase, its structural members rotted and collapsed into a jumble that was roughly cleared to allow passage.',
        boltedDown: true,
      },
    ],
  },

  '%JUNCTION_E5': {
    name: 'Brick-Lined Passage',
    description: `The tunnel runs through a section of particularly fine brickwork, the masonry laid in an ornamental pattern that suggests this was once a visible space rather than a buried utility passage. Decorative arches span the ceiling at regular intervals, purely aesthetic elements that served no structural purpose.

The craftsmanship speaks to a time when even basements were built with pride, when immigrant masons brought Old World techniques to this raw frontier town. Their work has outlasted the buildings above.`,
    x: -9,
    y: 5,
    z: -2,
    population: 0,
    ambientNoise: 8,
    lighting: 12,
    waterLevel: 0,
    outdoor: false,
    exits: {
      west: '%JUNCTION_E4',
      northeast: '%JUNCTION_TURN',
    },
    objects: [
      {
        prototype: 'sign',
        name: 'decorative brick arches',
        description: 'Ornamental arches of contrasting brick colors span the ceiling, purely decorative elements from when this basement was meant to be seen.',
        boltedDown: true,
      },
    ],
  },

  '%JUNCTION_TURN': {
    name: 'Angled Passage',
    description: `The tunnel angles here, turning northward as it navigates around some obstruction that the original builders refused to excavate through. Perhaps bedrock, perhaps the foundation of a building deemed too important to undermine. The reason is lost, but the angle remains.

Someone painted directional arrows on the walls—faded red chevrons pointing toward destinations that may or may not still exist. The arrows date from different eras, layered over each other as successive generations of underground travelers added their own guidance.`,
    x: -8,
    y: 6,
    z: -2,
    population: 0,
    ambientNoise: 10,
    lighting: 15,
    waterLevel: 0,
    outdoor: false,
    exits: {
      southwest: '%JUNCTION_E5',
      east: {
        to: 'buildings/underground-east/z-2.ts',
        room: '%OCC_JUNCTION',
        description: 'The passage continues east to the Northern Junction',
      },
    },
    objects: [
      {
        prototype: 'sign',
        name: 'painted directional arrows',
        description: 'Faded red chevrons painted on the walls, layered over each other from different eras, all pointing toward destinations in the underground network.',
        boltedDown: true,
      },
    ],
  },
};
