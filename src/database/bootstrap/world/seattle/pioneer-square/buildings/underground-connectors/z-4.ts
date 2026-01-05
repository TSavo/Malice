// Z=-4 Connecting Passages
// These rooms fill coordinate gaps in the deep underground, creating
// a complex non-linear network with thematic consistency.
//
// Thematic regions:
// - West (-10 to -8): Rat Kingdom - ancient tunnels, bone-strewn passages
// - Central (-5 to 0): Sewer/Cistern system - drains, flooded passages
// - East (3 to 10): Mixed rat territory and industrial drainage

export const building = {
  name: 'Lower Passages Z-4',
  x: -20,
  y: -20,
  width: 40,
  height: 30,
  floors: 1,

  rooms: {
  // ═══════════════════════════════════════════════════════════════════════════
  // WESTERN RAT KINGDOM (-10 to -8, y=-12 to -16)
  // Ancient tunnels where the rat colonies have established dominion
  // ═══════════════════════════════════════════════════════════════════════════

  '%RAT_DESCENT': {
    name: 'Rat Descent',
    description: `A steep passage descends between the Alpha Chamber and the Treasure Hoard. The walls are worn smooth by generations of rat traffic—millions of tiny claws over decades. The air is thick with musk and the sound of chittering echoes from both directions.

Bones are embedded in the packed earth floor. Some are rat bones. Some are not.`,
    x: -10,
    y: -13,
    z: -4,
    population: 0,
    ambientNoise: 55,
    lighting: 1,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%ALPHA_CHAMBER',
        description: 'The passage rises toward the Alpha Chamber',
      },
      south: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%TREASURE_HOARD',
        description: 'The descent continues toward the Treasure Hoard',
      },
      east: '%BONE_BRIDGE',
    },
    objects: [
      { prototype: 'furniture', name: 'worn passage walls', description: 'The walls gleam with the oils of countless rat bodies passing through. The stone is polished to a dark sheen.', boltedDown: true },
      { prototype: 'furniture', name: 'embedded bones', description: 'Bones protrude from the packed floor—some tiny, some disturbingly large. The rats build their roads on the dead.', boltedDown: true },
    ],
  },

  '%BONE_BRIDGE': {
    name: 'Bone Bridge',
    description: `A natural stone arch spans a dark crevasse, the bridge surface covered in a mosaic of bones—rat bones, bird bones, cat bones, and others less identifiable. The rats have reinforced the structure with their dead, creating a macabre but functional crossing.

Below, the crevasse drops into absolute darkness. Things move in that darkness.`,
    x: -9,
    y: -12,
    z: -4,
    population: 0,
    ambientNoise: 40,
    lighting: 0,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%ALPHA_CHAMBER',
        description: 'The bridge leads to the Alpha Chamber',
      },
      east: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%OVERFLOW_W',
        description: 'The bridge connects to the Bone Yard',
      },
      south: '%HOARD_APPROACH',
    },
    objects: [
      { prototype: 'furniture', name: 'bone mosaic floor', description: 'Thousands of bones form the bridge surface, fitted together with disturbing precision. Walking on them produces a hollow clatter.', boltedDown: true },
      { prototype: 'furniture', name: 'the crevasse', description: 'A black void yawns beneath the bridge. The depth is unknowable. Occasionally, something scrapes against stone far below.', boltedDown: true },
    ],
  },

  '%HOARD_APPROACH': {
    name: 'Hoard Approach',
    description: `The passage between the bone bridge and the Treasure Hoard narrows, forcing even rats to pass single-file. The walls are scratched with claw marks—territorial warnings, directional signs, or something else entirely. The smell of hoarded decay intensifies.

Rat sentries watch from crevices in the walls. They do not attack. They observe.`,
    x: -9,
    y: -14,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 1,
    outdoor: false,
    exits: {
      north: '%BONE_BRIDGE',
      west: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%TREASURE_HOARD',
        description: 'The approach leads to the Treasure Hoard',
      },
      east: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%COLLAPSED_SECTION',
        description: 'A narrow gap leads toward the Collapsed Section',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'claw-marked walls', description: 'Deep scratches cover every surface—rat language, warnings, or territorial claims. The patterns repeat in ways that suggest meaning.', boltedDown: true },
      { prototype: 'furniture', name: 'sentry crevices', description: 'Dark gaps in the walls hold watching eyes. The sentries are patient, unblinking, countless.', boltedDown: true },
    ],
  },

  '%COLLAPSE_DESCENT': {
    name: 'Collapse Descent',
    description: `A treacherous passage descends through partially collapsed tunnels, connecting the Bone Yard above to the Collapsed Section below. The ceiling has fallen in places, creating a maze of debris that only the smallest creatures navigate easily.

Water seeps through the rubble from the flooded chambers below. The footing is treacherous.`,
    x: -8,
    y: -13,
    z: -4,
    population: 0,
    ambientNoise: 30,
    lighting: 1,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%OVERFLOW_W',
        description: 'The passage rises toward the Bone Yard',
      },
      south: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%COLLAPSED_SECTION',
        description: 'The descent continues toward the Collapsed Section',
      },
      west: '%HOARD_APPROACH',
    },
    objects: [
      { prototype: 'furniture', name: 'collapsed debris', description: 'Fallen stone and concrete create a chaotic obstacle course. Some gaps are too small for humans but perfect for rats.', boltedDown: true },
      { prototype: 'furniture', name: 'seeping water', description: 'Water trickles through the rubble, carrying the chill of the flooded depths. The stone is slick and treacherous.', boltedDown: true },
    ],
  },

  '%FLOODED_APPROACH': {
    name: 'Flooded Approach',
    description: `The passage between the Collapsed Section and the Submerged Chamber grows increasingly waterlogged. The floor disappears under rising water, and the walls show tide marks from fluctuating levels. During heavy rains, this passage floods completely.

The water is cold and dark, carrying debris from the drowned chambers ahead.`,
    x: -8,
    y: -15,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 1,
    waterLevel: 50,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%COLLAPSED_SECTION',
        description: 'The passage rises toward the Collapsed Section',
      },
      south: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%SUBMERGED_CHAMBER',
        description: 'The flooded passage continues to the Submerged Chamber',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'tide marks', description: 'Dark stains on the walls mark water levels—some at ankle height, some at the ceiling. The flooding is unpredictable.', boltedDown: true },
      { prototype: 'furniture', name: 'floating debris', description: 'Debris drifts on the water: wood fragments, plastic, a shoe, things best not examined closely.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRAL SEWER/CISTERN SYSTEM (-5 to 0, y=-10 to -16)
  // The city's drainage infrastructure, flooded and forgotten
  // ═══════════════════════════════════════════════════════════════════════════

  '%NEST_APPROACH': {
    name: 'Nest Approach',
    description: `A narrow passage connects the Feeding Ground to the Deep Nest below. The walls are lined with shredded material—paper, cloth, plastic—woven into insulation by generations of rats. The temperature is warmer here, heated by countless small bodies.

The sound of nursing young carries from below. This is the heart of the colony.`,
    x: -4,
    y: -13,
    z: -4,
    population: 0,
    ambientNoise: 50,
    lighting: 0,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%FEEDING_GROUND',
        description: 'The passage rises toward the Feeding Ground',
      },
      south: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%DEEP_NEST',
        description: 'The passage descends toward the Deep Nest',
      },
      west: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%MAIN_JUNCTION',
        description: 'A wet passage leads toward the Western Cistern',
      },
      east: '%CISTERN_CROSSING',
    },
    objects: [
      { prototype: 'furniture', name: 'nest insulation', description: 'Shredded material lines the walls inches thick—newspaper, fabric, insulation foam. It muffles sound and retains heat.', boltedDown: true },
      { prototype: 'furniture', name: 'nursing sounds', description: 'The soft sounds of nursing young drift from below—tiny squeaks, the rustle of bodies, maternal chittering.', boltedDown: true },
    ],
  },

  '%NEST_DRAIN_LINK': {
    name: 'Nest-Drain Passage',
    description: `A connecting tunnel runs between the Deep Nest and the Drain Junction, where rat territory meets the sewer system. The rats avoid the sewer water but use this passage to access the food-rich drainage. The division between dry nest and wet drain is stark.

Rat droppings mark the boundary. Beyond, human waste flows.`,
    x: -3,
    y: -14,
    z: -4,
    population: 0,
    ambientNoise: 45,
    lighting: 1,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%DEEP_NEST',
        description: 'The passage leads to the Deep Nest',
      },
      east: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%DRAIN_JUNCTION',
        description: 'The passage opens to the Drain Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'territorial markers', description: 'Rat droppings and urine stains mark the boundary between nest territory and sewer. The message is clear: this far, no further.', boltedDown: true },
      { prototype: 'sign', name: 'the divide', description: 'A visible line where dry packed earth meets wet concrete. Two worlds, connected but separate.', boltedDown: true },
    ],
  },

  '%DRAIN_DESCENT': {
    name: 'Drain Descent',
    description: `A steep drainage channel connects the Drain Junction to the Submerged Tunnel below. Water flows constantly down this passage, carrying the city's waste to the flooded depths. The walls are slick with algae and worse.

Handholds are scarce. Those who slip don't stop until they hit the water below.`,
    x: -2,
    y: -15,
    z: -4,
    population: 0,
    ambientNoise: 50,
    lighting: 2,
    waterLevel: 30,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%DRAIN_JUNCTION',
        description: 'The channel rises toward the Drain Junction',
      },
      south: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%SUBMERGED_TUNNEL',
        description: 'The channel descends toward the Submerged Tunnel',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'algae-slick walls', description: 'Green-black algae coats every surface, fed by nutrients in the sewage. The footing is treacherous.', boltedDown: true },
      { prototype: 'furniture', name: 'constant flow', description: 'Water streams down the channel, never stopping. The sound masks everything else.', boltedDown: true },
    ],
  },

  '%TUNNEL_LINK': {
    name: 'Tunnel Connector',
    description: `A flooded passage connects the Submerged Tunnel to the Industrial Outfall, running through the deepest part of the underground drainage. The water is waist-deep and cold, carrying industrial chemicals that burn exposed skin.

No one comes here by choice. Only desperation or necessity drives passage through these waters.`,
    x: -1,
    y: -16,
    z: -4,
    population: 0,
    ambientNoise: 40,
    lighting: 1,
    waterLevel: 75,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%SUBMERGED_TUNNEL',
        description: 'The flooded passage leads to the Submerged Tunnel',
      },
      east: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%INDUSTRIAL_OUTFALL',
        description: 'The passage continues toward the Industrial Outfall',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'chemical water', description: 'The water has an oily sheen and acrid smell. Prolonged contact causes rashes, worse with open wounds.', boltedDown: true },
      { prototype: 'sign', name: 'warning scratches', description: 'Scratched into the wall above waterline: "DON\'T SWALLOW". Sound advice.', boltedDown: true },
    ],
  },

  '%SEWER_LINK': {
    name: 'Sewer Connector',
    description: `A wide drainage pipe connects the Drain Junction to the Sewer Access Point, forming a major artery in the underground sewer network. The pipe is large enough to walk upright, though the floor is covered in flowing sewage.

This is a main transit route for those who know the underground. The smell never leaves your clothes.`,
    x: -1,
    y: -14,
    z: -4,
    population: 0,
    ambientNoise: 55,
    lighting: 3,
    waterLevel: 25,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%DRAIN_JUNCTION',
        description: 'The pipe leads to the Drain Junction',
      },
      east: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%PIPE_GALLERY',
        description: 'The pipe continues to the Sewer Access Point',
      },
      south: '%TUNNEL_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'large drainage pipe', description: 'A concrete pipe wide enough to walk through. The curved walls are stained with decades of sewage flow.', boltedDown: true },
      { prototype: 'sign', name: 'transit markers', description: 'Spray-painted arrows and symbols mark the route—the language of underground travelers.', boltedDown: true },
    ],
  },

  '%CISTERN_CROSSING': {
    name: 'Cistern Crossing',
    description: `A crossing point where the rat territories meet the old cistern network. Pipes of various sizes converge here, some carrying water, some carrying worse. The rats use the dry pipes as highways; the wet ones are left to humans.

The sound of flowing water comes from multiple directions. Navigation requires attention.`,
    x: -1,
    y: -10,
    z: -4,
    population: 0,
    ambientNoise: 45,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%CORPSE_TUNNEL',
        description: 'A passage leads toward the Corpse Tunnel',
      },
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CHINATOWN_ACCESS',
        description: 'Pipes lead toward the Chinatown Cistern Access',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'converging pipes', description: 'Pipes of all sizes meet here—concrete, cast iron, PVC. Some are original, some added later, some improvised.', boltedDown: true },
      { prototype: 'furniture', name: 'rat highways', description: 'Dry pipes show signs of heavy rat traffic—droppings, fur, the polished sheen of constant passage.', boltedDown: true },
    ],
  },

  '%BREEDING_DESCENT': {
    name: 'Breeding Descent',
    description: `A passage connects the Chinatown Cistern Access to the Breeding Warrens below. The air grows warmer and more humid as you descend, thick with the musk of concentrated rat population. The walls pulse with movement—rats flowing up and down in endless streams.

This is the main artery to the breeding chambers. Thousands pass through daily.`,
    x: 0,
    y: -11,
    z: -4,
    population: 0,
    ambientNoise: 60,
    lighting: 1,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CHINATOWN_ACCESS',
        description: 'The passage rises toward the Chinatown Cistern Access',
      },
      south: {
        to: 'buildings/rat-pits/z-4.ts',
        room: '%BREEDING_WARRENS',
        description: 'The passage descends toward the Breeding Warrens',
      },
      west: '%CISTERN_CROSSING',
    },
    objects: [
      { prototype: 'furniture', name: 'flowing rats', description: 'Rats stream up and down the passage walls, floor, and ceiling—a living river of fur and teeth. They ignore humans unless provoked.', boltedDown: true },
      { prototype: 'furniture', name: 'musk saturation', description: 'The air is so thick with rat musk it coats the tongue. Breathing through the mouth doesn\'t help.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EASTERN PASSAGES (4 to 10)
  // Industrial drainage meeting rat territory
  // ═══════════════════════════════════════════════════════════════════════════

  '%RESERVOIR_DESCENT': {
    name: 'Reservoir Descent',
    description: `A vertical shaft connects the Industrial Reservoir above to the Deep Passage East below. Rusty ladder rungs are bolted into the concrete walls, though several are missing or loose. The shaft echoes with the sound of dripping water.

Industrial runoff has stained the walls in rainbow patterns—beautiful and toxic.`,
    x: 10,
    y: -14,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 2,
    outdoor: false,
    exits: {
      up: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%RESERVOIR',
        description: 'The shaft rises toward the Industrial Reservoir',
      },
      down: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%DEEP_EAST',
        description: 'The shaft descends toward the Deep Passage East',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'rusty ladder', description: 'Iron rungs protrude from the wall, orange with rust. Some are missing, others wiggle dangerously when gripped.', boltedDown: true },
      { prototype: 'furniture', name: 'chemical staining', description: 'Industrial chemicals have painted the concrete in swirling patterns—copper green, rust orange, oil-black.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRAY CARTEL TERRITORY (northern z=-4)
  // ═══════════════════════════════════════════════════════════════════════════

  '%LOWER_CONNECTOR_W': {
    name: 'Lower Connector West',
    description: `A reinforced passage connects sections of the Gray Cartel's lower level. The walls show signs of recent construction—new concrete patching old brick. Security cameras cover the junction, their red lights blinking in the darkness.

This is Cartel territory. Unauthorized visitors are dealt with.`,
    x: -20,
    y: -6,
    z: -4,
    population: 0,
    ambientNoise: 25,
    lighting: 5,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/gray-cartel/z-4.ts',
        room: '%DEEP_SOUTH',
        description: 'The passage leads to the Deep South Cave',
      },
      east: '%LOWER_CONNECTOR_E',
    },
    objects: [
      { prototype: 'furniture', name: 'security cameras', description: 'Modern cameras watch the passage, their red LEDs unblinking. Someone is always watching.', boltedDown: true },
      { prototype: 'furniture', name: 'reinforced walls', description: 'New concrete reinforces old brick—the Cartel securing their territory against collapse and intrusion.', boltedDown: true },
    ],
  },

  '%LOWER_CONNECTOR_E': {
    name: 'Lower Connector East',
    description: `The eastern section of the lower connector passage. The construction here is older, the original brick tunnel only partially reinforced. Water seeps through cracks, and the security presence is lighter than the western section.

A secondary escape route, less guarded but less maintained.`,
    x: -18,
    y: -6,
    z: -4,
    population: 0,
    ambientNoise: 30,
    lighting: 3,
    outdoor: false,
    exits: {
      west: '%LOWER_CONNECTOR_W',
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CISTERN_ACCESS',
        description: 'The passage leads to the Cistern Access',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'seeping walls', description: 'Water seeps through cracks in the old brick, dripping constantly. The floor is perpetually damp.', boltedDown: true },
      { prototype: 'furniture', name: 'emergency supplies', description: 'A locked cabinet contains emergency supplies—first aid, flashlights, a radio. Cartel standard for escape routes.', boltedDown: true },
    ],
  },

  '%BARRACKS_LINK': {
    name: 'Barracks Corridor',
    description: `A connecting corridor between the Cutter Barracks and the Medical Bay. The walls are painted institutional gray, and fluorescent lights flicker overhead. Doors on either side lead to storage rooms and utility closets.

Off-duty Cutters pass through here regularly. The corridor smells of sweat and antiseptic.`,
    x: -13,
    y: 6,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 8,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/gray-cartel/z-4.ts',
        room: '%BARRACKS',
        description: 'The corridor leads to the Cutter Barracks',
      },
      east: {
        to: 'buildings/gray-cartel/z-4.ts',
        room: '%MEDICAL',
        description: 'The corridor leads to the Medical Bay',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'flickering lights', description: 'Fluorescent tubes flicker and buzz, casting uneven light. No one bothers to replace them.', boltedDown: true },
      { prototype: 'furniture', name: 'storage doors', description: 'Unmarked doors line the corridor—supplies, equipment, things best not asked about.', boltedDown: true },
    ],
  },

  '%PASSAGE_LINK': {
    name: 'Lower Junction Link',
    description: `A passage connecting the Lower Junction to the Lower Passage network. The construction here is mixed—old brick, new concrete, exposed pipes. Navigation markers are painted on the walls in Cartel code.

This is a transit route, not a destination. People pass through quickly.`,
    x: -13,
    y: 5,
    z: -4,
    population: 0,
    ambientNoise: 30,
    lighting: 4,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/gray-cartel/z-4.ts',
        room: '%JUNCTION',
        description: 'The passage leads to the Lower Junction',
      },
      east: {
        to: 'underground/lower-passages/z-4.ts',
        room: '%LOWER_PASSAGE',
        description: 'The passage continues east',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'mixed construction', description: 'Old brick meets new concrete meets exposed pipes. The architecture tells the story of decades of modification.', boltedDown: true },
      { prototype: 'sign', name: 'navigation markers', description: 'Symbols are painted on the walls—arrows, numbers, codes. The Cartel\'s internal navigation system.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRAL PASSAGE NETWORK (y=-4 corridor)
  // The main east-west transit route at z=-4
  // ═══════════════════════════════════════════════════════════════════════════

  '%ANCIENT_LINK_W': {
    name: 'Ancient Passage West',
    description: `A section of ancient tunnel connects the modern passages to older construction. The walls here are hand-cut stone, predating the city above. No one knows who built these tunnels or why. The stone is worn smooth by time.

Faint carvings are visible in places—symbols that match no known language.`,
    x: -7,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 20,
    lighting: 1,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/deep-passages/z-4.ts',
        room: '%LOWER',
        description: 'The passage continues toward the Lower Passage',
      },
      east: {
        to: 'buildings/ancient-underground/z-4.ts',
        room: '%ANCIENT',
        description: 'The ancient passage continues east',
      },
      down: {
        to: 'underground/lower-passages/z-5.ts',
        room: '%DEEP_ANCIENT',
        description: 'A hidden shaft descends into deeper darkness',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'hand-cut stone', description: 'The walls are hand-cut stone, the chisel marks still visible after centuries. The craftsmanship is impressive.', boltedDown: true },
      { prototype: 'sign', name: 'ancient carvings', description: 'Faint symbols are carved into the stone—circles, lines, shapes that might be letters or might be something else entirely.', boltedDown: true },
    ],
  },

  '%ANCIENT_LINK_E': {
    name: 'Ancient Passage East',
    description: `The ancient stonework gives way to more recent construction—brick and concrete replacing hand-cut stone. The transition is abrupt, as if someone simply built over the old passage without understanding what they'd found.

Water damage has exposed sections of the original stone beneath the newer walls.`,
    x: -5,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 25,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/ancient-underground/z-4.ts',
        room: '%ANCIENT',
        description: 'The passage leads to the Ancient Passage',
      },
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%WESTERN_JUNCTION',
        description: 'The passage continues to the Western Deep Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'construction transition', description: 'Old stone meets new brick in a jarring junction. The builders didn\'t care about preservation.', boltedDown: true },
      { prototype: 'furniture', name: 'exposed stonework', description: 'Water damage has revealed original stone beneath the brick. The ancient construction is superior.', boltedDown: true },
    ],
  },

  '%CAVERN_DESCENT': {
    name: 'Cavern Descent',
    description: `A rough passage descends from the Western Deep Junction toward the Northern Cavern. The walls transition from constructed tunnel to natural cave, the stone formations growing more organic with each step. Stalactites drip mineral-rich water.

This is where human construction ends and natural cave begins.`,
    x: -4,
    y: -3,
    z: -4,
    population: 0,
    ambientNoise: 20,
    lighting: 1,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%WESTERN_JUNCTION',
        description: 'The passage rises toward the Western Deep Junction',
      },
      north: {
        to: 'buildings/natural-caves/z-4.ts',
        room: '%NORTHERN',
        description: 'The passage continues to the Northern Cavern',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'stalactites', description: 'Mineral formations hang from the ceiling, some mere inches from the floor. They drip constantly.', boltedDown: true },
      { prototype: 'furniture', name: 'natural transition', description: 'The walls change from carved stone to natural cave, the transition gradual but unmistakable.', boltedDown: true },
    ],
  },

  '%CISTERN_APPROACH_E': {
    name: 'Cistern Approach East',
    description: `A passage connecting the Western Deep Junction to the Cistern Approach. The walls are damp with condensation, and the sound of water grows louder ahead. This is the transition zone between the dry passages and the flooded cistern network.

The air is humid and cool, carrying the smell of standing water.`,
    x: -3,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%WESTERN_JUNCTION',
        description: 'The passage leads to the Western Deep Junction',
      },
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%APPROACH',
        description: 'The passage continues to the Cistern Approach',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'condensation', description: 'Water beads on every surface, dripping from the ceiling. The humidity is oppressive.', boltedDown: true },
      { prototype: 'furniture', name: 'water sounds', description: 'The sound of moving water echoes from ahead—the cistern network, flooded and active.', boltedDown: true },
    ],
  },

  '%CISTERN_LINK': {
    name: 'Cistern Connector',
    description: `A wide passage connecting the Cistern Approach to the Western Cistern. The floor is wet, water flowing sluggishly toward the cistern network. Pipes of various sizes run along the ceiling, some active, some long abandoned.

This is infrastructure territory—the city's hidden plumbing laid bare.`,
    x: -1,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 40,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%APPROACH',
        description: 'The passage leads to the Cistern Approach',
      },
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%WESTERN',
        description: 'The passage continues to the Western Cistern',
      },
      north: '%CISTERN_CROSSING',
    },
    objects: [
      { prototype: 'furniture', name: 'overhead pipes', description: 'Pipes of all sizes run along the ceiling—water, sewage, mystery fluids. Some leak, some gurgle, some are silent.', boltedDown: true },
      { prototype: 'furniture', name: 'wet floor', description: 'Water covers the floor in a thin sheet, flowing slowly toward the cisterns. The footing requires care.', boltedDown: true },
    ],
  },

  '%NORTH_PASSAGE_LINK': {
    name: 'North Passage Link',
    description: `A passage connecting the Western Cistern to the Cistern North Passage. The construction here is newer—twentieth century concrete replacing nineteenth century brick. The passage is cleaner than most, suggesting regular maintenance.

Numbers are stenciled on the walls at regular intervals. Someone tracks locations here.`,
    x: 0,
    y: -3,
    z: -4,
    population: 0,
    ambientNoise: 30,
    lighting: 4,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%WESTERN',
        description: 'The passage leads to the Western Cistern',
      },
      north: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%NORTH',
        description: 'The passage continues to the Cistern North Passage',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'stenciled numbers', description: 'Numbers are painted on the walls: "C-47", "C-48". A mapping system for the cistern network.', boltedDown: true },
      { prototype: 'furniture', name: 'newer concrete', description: 'The walls are smooth concrete, relatively modern. This section was rebuilt sometime in the last century.', boltedDown: true },
    ],
  },

  '%WEST_CISTERN_LINK': {
    name: 'West Cistern Link',
    description: `A connecting passage between the Western Cistern and the Central Cistern. Water flows through a channel in the floor, connecting the two cistern chambers. The passage is wide enough for maintenance equipment, though none has passed this way in years.

Rust stains mark where metal equipment once stood.`,
    x: 1,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 45,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%WESTERN',
        description: 'The passage leads to the Western Cistern',
      },
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CENTRAL',
        description: 'The passage continues to the Central Cistern',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'water channel', description: 'A channel runs through the floor, carrying water between cisterns. The flow is constant but slow.', boltedDown: true },
      { prototype: 'furniture', name: 'rust stains', description: 'Orange stains mark where equipment once stood. Whatever was here has been removed—or dissolved.', boltedDown: true },
    ],
  },

  '%SHAFT_LINK': {
    name: 'Shaft Approach',
    description: `A passage connecting the Cistern North Passage to the Cistern Shaft. The ceiling rises here, the passage opening into a vertical shaft that connects multiple levels. Ladder rungs are bolted to the wall, ascending into darkness.

Sounds echo strangely in the shaft—voices carry from levels above and below.`,
    x: 1,
    y: -2,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%NORTH',
        description: 'The passage leads to the Cistern North Passage',
      },
      east: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%SHAFT',
        description: 'The passage opens to the Cistern Shaft',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'rising ceiling', description: 'The ceiling rises dramatically, opening into a vertical shaft. The change in acoustics is immediate.', boltedDown: true },
      { prototype: 'furniture', name: 'echoing sounds', description: 'Sounds echo and multiply in the shaft—a whisper becomes a chorus, footsteps become thunder.', boltedDown: true },
    ],
  },

  '%CENTRAL_NORTH': {
    name: 'Central Cistern North',
    description: `The northern section of the Central Cistern complex, connecting the main chamber to the Cistern Shaft. The walls are lined with pipes feeding into the cistern system. Some pipes still flow; others are sealed with concrete plugs.

The sound of water is omnipresent—dripping, flowing, pooling.`,
    x: 2,
    y: -3,
    z: -4,
    population: 0,
    ambientNoise: 50,
    lighting: 2,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CENTRAL',
        description: 'The passage leads to the Central Cistern',
      },
      north: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%SHAFT',
        description: 'The passage continues to the Cistern Shaft',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'pipe infrastructure', description: 'Pipes of all sizes feed into the walls—the circulatory system of the cistern network.', boltedDown: true },
      { prototype: 'furniture', name: 'sealed pipes', description: 'Some pipes are sealed with concrete plugs, cutting off flows that were deemed unnecessary or dangerous.', boltedDown: true },
    ],
  },

  '%CENTRAL_SOUTH': {
    name: 'Central Cistern South',
    description: `The southern section of the Central Cistern complex, connecting to the Deep Cistern Access below. The floor slopes downward, water channeling toward the deeper chambers. The walls show water damage from decades of flooding.

This is the descent into the deepest parts of the cistern network.`,
    x: 2,
    y: -5,
    z: -4,
    population: 0,
    ambientNoise: 45,
    lighting: 1,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CENTRAL',
        description: 'The passage rises toward the Central Cistern',
      },
      south: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%DEEP_ACCESS',
        description: 'The passage descends toward the Deep Cistern Access',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'sloping floor', description: 'The floor slopes downward at a noticeable angle. Water follows the slope toward the depths.', boltedDown: true },
      { prototype: 'furniture', name: 'water damage', description: 'High water marks stain the walls at various heights—records of past floods, some reaching the ceiling.', boltedDown: true },
    ],
  },

  '%EAST_CISTERN_LINK': {
    name: 'East Cistern Link',
    description: `A connecting passage between the Central Cistern and the Eastern Cistern. The passage is wider here, designed for the heavy equipment that once maintained the cistern network. Rails embedded in the floor suggest carts once traveled this route.

Now only rats and the desperate use this path.`,
    x: 3,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 40,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/deep-cisterns/z-4.ts',
        room: '%CENTRAL',
        description: 'The passage leads to the Central Cistern',
      },
      east: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%PIPE_GALLERY',
        description: 'The passage continues to the Eastern Cistern',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'embedded rails', description: 'Metal rails are set into the floor, rusted but intact. Maintenance carts once rolled through here.', boltedDown: true },
      { prototype: 'furniture', name: 'wide passage', description: 'The passage is wider than most—designed for equipment, now used by those who need the space.', boltedDown: true },
    ],
  },

  '%EAST_PASSAGE_LINK': {
    name: 'East Passage Link',
    description: `A passage connecting the Eastern Cistern to the Eastern Passage. The construction changes here—cistern infrastructure giving way to older tunnel work. The passage narrows, and the ceiling lowers.

Graffiti marks the transition: "BEYOND HERE BE RATS". Someone had a sense of humor.`,
    x: 5,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 35,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/flooded-sewers/z-4.ts',
        room: '%PIPE_GALLERY',
        description: 'The passage leads to the Eastern Cistern',
      },
      east: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%EASTERN_PASSAGE',
        description: 'The passage continues to the Eastern Passage',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'narrowing passage', description: 'The passage narrows significantly, the ceiling dropping. Tall visitors must duck.', boltedDown: true },
      { prototype: 'sign', name: 'rat warning graffiti', description: 'Spray-painted on the wall: "BEYOND HERE BE RATS". Below it, someone added: "THEY BITE".', boltedDown: true },
    ],
  },

  '%JUNCTION_LINK': {
    name: 'Junction Approach',
    description: `A passage connecting the Eastern Passage to the Eastern Deep Junction. The tunnel opens into a larger chamber ahead, multiple passages converging. The sound of activity echoes from the junction—water, movement, occasional voices.

This is a major intersection in the underground network.`,
    x: 7,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 45,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%EASTERN_PASSAGE',
        description: 'The passage leads to the Eastern Passage',
      },
      east: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%EASTERN_JUNCTION',
        description: 'The passage opens to the Eastern Deep Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'widening tunnel', description: 'The tunnel widens as it approaches the junction, the acoustics changing to accommodate the larger space ahead.', boltedDown: true },
      { prototype: 'furniture', name: 'echoing sounds', description: 'Sounds from the junction echo back—water, footsteps, the occasional voice. The intersection is active.', boltedDown: true },
    ],
  },

  '%INDUSTRIAL_DESCENT': {
    name: 'Industrial Descent',
    description: `A steep passage descends from the Eastern Deep Junction toward the Industrial Deep Access. The walls are stained with industrial runoff, and the smell of chemicals grows stronger with each step. Safety signs, faded and ignored, warn of hazards ahead.

This is the transition into industrial territory. Hard hats are recommended but absent.`,
    x: 8,
    y: -3,
    z: -4,
    population: 0,
    ambientNoise: 40,
    lighting: 4,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%EASTERN_JUNCTION',
        description: 'The passage rises toward the Eastern Deep Junction',
      },
      north: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%INDUSTRIAL_ACCESS',
        description: 'The passage descends toward the Industrial Deep Access',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'industrial staining', description: 'Chemical stains streak the walls—greens, oranges, colors that shouldn\'t exist in nature.', boltedDown: true },
      { prototype: 'sign', name: 'faded safety signs', description: 'OSHA signs are bolted to the walls, their warnings faded but legible: "HARD HAT AREA", "CHEMICAL HAZARD".', boltedDown: true },
    ],
  },

  '%SEWER_NETWORK_LINK': {
    name: 'Sewer Network Link',
    description: `A passage connecting the Eastern Deep Junction to the Sewer Network Access. The tunnel transitions from industrial construction to sewer infrastructure—concrete to brick, dry to wet. The smell changes accordingly.

This is where industrial meets municipal. Neither claims responsibility.`,
    x: 9,
    y: -4,
    z: -4,
    population: 0,
    ambientNoise: 50,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/industrial-underground/z-4.ts',
        room: '%EASTERN_JUNCTION',
        description: 'The passage leads to the Eastern Deep Junction',
      },
      east: {
        to: 'buildings/sewer-network/z-4.ts',
        room: '%ACCESS',
        description: 'The passage continues to the Sewer Network Access',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'construction transition', description: 'Industrial concrete gives way to municipal brick. The change is abrupt and telling.', boltedDown: true },
      { prototype: 'furniture', name: 'jurisdictional signs', description: 'A painted line marks where industrial property ends and city infrastructure begins. Neither side maintains it well.', boltedDown: true },
    ],
  },
  },
};
