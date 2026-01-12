// Rat Pits - Level z=-4
// Vermin-infested passages where rats rule
// The domain of the rats, contested only by the desperate and the mad

export const building = {
  name: 'Rat Pits',
  x: -12,
  y: -18,
  width: 18,
  height: 12,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // ACCESS POINTS
    // ═══════════════════════════════════════════════════════════════════════

    '%BORDER_CROSSING': {
      name: 'Border Crossing',
      description: `The passage from the homeless warrens descends into contested territory—the border between human desperation and animal dominion. The scratching is constant here, a white noise of tiny claws on stone. Eyes gleam in the darkness beyond the reach of any light.

The rats allow passage. For now. But they watch everything.`,
      x: -7,
      y: -10,
      z: -4,
      imageOnDisk: 'border-crossing-x-7-y-10-z-4.png',
      population: 0,
      ambientNoise: 50,
      lighting: 3,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/homeless-warrens/z-3.ts',
          room: '%RAT_BORDER',
          description: 'A passage ascends to the homeless warrens',
        },
        south: '%FEEDING_GROUND',
        east: '%CORPSE_TUNNEL',
      },
      objects: [
        {
          prototype: 'sign',
          name: 'claw marks',
          description:
            'Deep scratches cover every surface—territorial markings from generations of rats. Some of the marks are disturbingly large.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'gnawed bones',
          description:
            'Bones are scattered across the floor—animal bones, mostly. The rats leave warnings for those who enter their territory.',
          boltedDown: true,
        },
      ],
    },

    '%SEWER_ACCESS': {
      name: 'Sewer Access Point',
      description: `A broken sewer main provides the rats with access to the city's waste system—an endless supply of food and a highway to anywhere in Seattle. The pipe is large enough for a human to crawl through, but the rats make it clear that would be unwise.

The stench is overpowering. The sounds from within are worse.`,
      x: 0,
      y: -14,
      z: -4,
      imageOnDisk: 'sewer-access-point-x0-y-14-z-4.png',
      population: 0,
      ambientNoise: 45,
      lighting: 2,
      outdoor: false,
      exits: {
        west: '%RAT_HIGHWAY',
        south: {
          to: 'buildings/flooded-sewers/z-4.ts',
          room: '%MAIN_JUNCTION',
          description: 'A sewer pipe leads into the flooded passages',
        },
        north: '%FEEDING_GROUND',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'the sewer pipe',
          description:
            'A concrete sewer pipe, cracked and leaking, provides passage to the sewer system. Rats pour in and out in constant streams.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'rat trails',
          description:
            'Greasy trails mark the paths most traveled by the rats. The stone is worn smooth by countless tiny feet.',
          boltedDown: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FEEDING ZONES
    // ═══════════════════════════════════════════════════════════════════════

    '%FEEDING_GROUND': {
      name: 'Feeding Ground',
      description: `This chamber serves as a communal feeding area for the colony—a space where food is brought, fought over, and consumed. The floor is littered with debris: garbage from the surface, bones, rotting organic matter. The rats move through it like a living carpet.

Feeding frenzies happen here. Best not to be present when they do.`,
      x: -4,
      y: -12,
      z: -4,
      imageOnDisk: 'feeding-ground-x-4-y-12-z-4.png',
      population: 0,
      ambientNoise: 60,
      lighting: 1,
      outdoor: false,
      exits: {
        north: '%BORDER_CROSSING',
        south: '%SEWER_ACCESS',
        east: '%BREEDING_WARRENS',
        west: '%BONE_YARD',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'garbage piles',
          description:
            'Heaps of garbage cover the floor—food waste from the surface, brought down through the sewers. The rats pick through it constantly.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'feeding stations',
          description:
            'Certain spots are reserved for dominant rats—cleared areas where the largest specimens eat first. The hierarchy is absolute.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'territorial scratches',
          description:
            'The walls are covered in scratches that seem to form patterns—territorial boundaries, perhaps, or something more organized.',
          boltedDown: true,
        },
      ],
    },

    '%CORPSE_TUNNEL': {
      name: 'Corpse Tunnel',
      description: `The rats drag their dead here—a passage lined with the remains of generations. The bones pile against the walls, picked clean, arranged in ways that seem almost deliberate. Some of the bones are too large to be rats.

The colony remembers its dead. Or perhaps it just uses them.`,
      x: -2,
      y: -10,
      z: -4,
      imageOnDisk: 'corpse-tunnel-x-2-y-10-z-4.png',
      population: 0,
      ambientNoise: 30,
      lighting: 0,
      outdoor: false,
      exits: {
        west: '%BORDER_CROSSING',
        south: '%BREEDING_WARRENS',
        east: '%RAT_HIGHWAY',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'bone walls',
          description:
            'Bones line the walls in dense layers—rat bones primarily, but mixed with others. Some skulls are almost recognizable.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'arranged remains',
          description:
            'Some bones appear deliberately placed—skulls facing outward, long bones forming patterns. Coincidence, or something else?',
          boltedDown: true,
        },
      ],
    },

    '%BONE_YARD': {
      name: 'Bone Yard',
      description: `A larger chamber serves as the colony's ossuary—a repository of bones collected over decades. The rats bring their prey here to consume, leaving the remains. The floor is a carpet of bones, crunching underfoot. Some of the bones are disturbingly recent.

Things die here. Many things.`,
      x: -8,
      y: -12,
      z: -4,
      imageOnDisk: 'bone-yard-x-8-y-12-z-4.png',
      population: 0,
      ambientNoise: 25,
      lighting: 0,
      outdoor: false,
      exits: {
        east: '%FEEDING_GROUND',
        south: '%DEEP_NEST',
        west: '%ALPHA_CHAMBER',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a bone carpet',
          description:
            'The floor is covered in bones—inches deep, impossible to avoid. They crunch and shift with every step.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'fresh remains',
          description:
            'Near one wall, the bones are fresher—still connected by sinew, still wearing scraps of fur or fabric. The colony feeds well.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a feeding pit',
          description:
            'A depression in the floor serves as an active feeding site. The bones here are wet, the smell overpowering.',
          boltedDown: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COLONY CENTER
    // ═══════════════════════════════════════════════════════════════════════

    '%BREEDING_WARRENS': {
      name: 'Breeding Warrens',
      description: `The heart of the colony's reproduction—a maze of tunnels too small for humans, opening into this observation chamber. The walls are honeycombed with nest holes, each containing a breeding pair and their litters. The squeaking of newborns is constant.

The colony grows. Always growing. The surface has no idea how many rats live beneath it.`,
      x: 0,
      y: -12,
      z: -4,
      imageOnDisk: 'breeding-warrens-x0-y-12-z-4.png',
      population: 0,
      ambientNoise: 55,
      lighting: 0,
      outdoor: false,
      exits: {
        north: '%CORPSE_TUNNEL',
        west: '%FEEDING_GROUND',
        south: '%DEEP_NEST',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'nest holes',
          description:
            'Countless holes riddle the walls—each one a nest, each nest containing a breeding pair and their young. The squeaking never stops.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'nesting material',
          description:
            'Shredded paper, fabric, insulation, and other soft materials are piled for nest building. The rats are efficient scavengers.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'colony growth marks',
          description:
            'Scratches on a central pillar seem to mark something—perhaps generations, perhaps population milestones. The marks go back decades.',
          boltedDown: true,
        },
      ],
    },

    '%ALPHA_CHAMBER': {
      name: 'Alpha Chamber',
      description: `The largest rat in the colony holds court here—a beast the size of a small dog, scarred from countless battles, surrounded by its lieutenants. This is the seat of power in the rat kingdom, where the alpha's will becomes colony law.

Challenging the alpha means death. But the alpha grows old. Others are watching.`,
      x: -10,
      y: -12,
      z: -4,
      imageOnDisk: 'alpha-chamber-x-10-y-12-z-4.png',
      population: 0,
      ambientNoise: 35,
      lighting: 0,
      outdoor: false,
      exits: {
        east: '%BONE_YARD',
        south: '%TREASURE_HOARD',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'the throne mound',
          description:
            "A mound of bones and debris serves as the alpha's throne—elevated above its subjects, commanding a view of all approaches.",
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'challenge scars',
          description:
            'Deep gouges in the floor mark where challenges have been fought. Dark stains show where they ended.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'tribute piles',
          description:
            'Offerings from the colony are piled around the throne—choice bits of food, shiny objects, tokens of submission.',
          boltedDown: true,
        },
      ],
    },

    '%RAT_HIGHWAY': {
      name: 'Rat Highway',
      description: `A major thoroughfare through the colony—a passage worn smooth by the constant traffic of rats moving between territories. The flow is organized, almost orderly: one direction on each side, with dominant rats taking the center.

The highway connects everything. Control the highway, control the colony.`,
      x: 3,
      y: -12,
      z: -4,
      imageOnDisk: 'rat-highway-x3-y-12-z-4.png',
      population: 0,
      ambientNoise: 50,
      lighting: 1,
      outdoor: false,
      exits: {
        west: '%CORPSE_TUNNEL',
        east: '%SEWER_ACCESS',
        south: '%FLOODED_PASSAGE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'worn pathways',
          description:
            'The floor is worn into distinct lanes—grooves carved by countless tiny feet over years of constant use.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'scent markers',
          description:
            'Invisible to human eyes but obvious to rats: scent markers that designate lanes, territories, and warnings.',
          boltedDown: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP ZONES
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_NEST': {
      name: 'Deep Nest',
      description: `Below the main colony, the oldest rats retreat to this chamber—a dark space where the largest and most aggressive specimens lurk. These are the survivors, the ones who have lived longest in the deadly hierarchy. They are not afraid of humans.

They have eaten humans.`,
      x: -4,
      y: -14,
      z: -4,
      imageOnDisk: 'deep-nest-x-4-y-14-z-4.png',
      population: 0,
      ambientNoise: 40,
      lighting: 0,
      outdoor: false,
      exits: {
        north: '%BREEDING_WARRENS',
        west: '%BONE_YARD',
        east: '%FLOODED_PASSAGE',
        down: '%ABYSSAL_DEN',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'massive burrows',
          description:
            'The burrows here are larger than elsewhere—sized for rats grown fat on decades of feeding. The scratching from within is deep and slow.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'human remains',
          description:
            'Scattered among the rat bones: human finger bones, a jawbone, a watch still clasped around nothing. The colony remembers its meals.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a feeding station',
          description:
            'A cleared area where the deep nest rats eat. The bones here are larger, the teeth marks deeper.',
          boltedDown: true,
        },
      ],
    },

    '%TREASURE_HOARD': {
      name: 'Treasure Hoard',
      description: `Rats collect shiny things—coins, jewelry, foil, glass. This chamber holds generations of accumulated treasure, piled in glittering mounds that catch the faintest light. The rats guard it fiercely, though its value is lost on them.

Some of the jewelry still has fingers attached.`,
      x: -10,
      y: -14,
      z: -4,
      imageOnDisk: 'treasure-hoard-x-10-y-14-z-4.png',
      population: 0,
      ambientNoise: 30,
      lighting: 2,
      outdoor: false,
      exits: {
        north: '%ALPHA_CHAMBER',
        east: '%DEEP_NEST',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%COLLAPSED_TUNNEL',
          description: 'A narrow passage descends toward the cisterns',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'treasure mounds',
          description:
            'Piles of glittering objects cover the floor: coins, jewelry, foil wrappers, broken glass, anything that catches light. The rats have accumulated this over decades.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'grisly trinkets',
          description:
            "Among the treasures: rings still on fingers, necklaces still clasped, a gold tooth still in its jaw. The rats don't discriminate.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'guardian nests',
          description:
            'Large burrows surround the treasure—home to the rats who guard it. They are always watching.',
          boltedDown: true,
        },
      ],
    },

    '%FLOODED_PASSAGE': {
      name: 'Flooded Passage',
      description: `Where the rat pits meet the rising water table, a flooded passage connects to the sewer system. The rats swim when they must, but prefer the dry passages. This transition zone is contested—rats above, water below, and things in the water that even rats avoid.`,
      x: 0,
      y: -16,
      z: -4,
      imageOnDisk: 'flooded-passage-x0-y-16-z-4.png',
      population: 0,
      ambientNoise: 35,
      lighting: 1,
      waterLevel: 40,
      outdoor: false,
      exits: {
        north: '%RAT_HIGHWAY',
        west: '%DEEP_NEST',
        south: {
          to: 'buildings/flooded-sewers/z-4.ts',
          room: '%RAT_OVERFLOW',
          description: 'A flooded tunnel leads into the sewers',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'rat rafts',
          description:
            "Debris accumulates at the water line—platforms the rats use to cross without swimming. They're constantly maintained.",
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'high water marks',
          description:
            'Marks on the walls show how high the water rises. Sometimes it floods the entire passage. Sometimes rats drown.',
          boltedDown: true,
        },
      ],
    },

    '%ABYSSAL_DEN': {
      name: 'Abyssal Den',
      description: `Below even the deep nest, a single den exists—home to something that might once have been a rat. The scratching here is different: slower, heavier, deliberate. The other rats avoid this place. They leave offerings at the entrance and flee.

What lives here has lived here for a very long time.`,
      x: -4,
      y: -14,
      z: -5,
      imageOnDisk: 'abyssal-den-x-4-y-14-z-5.png',
      population: 0,
      ambientNoise: 10,
      lighting: 0,
      outdoor: false,
      exits: {
        up: '%DEEP_NEST',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'the den entrance',
          description:
            'A single massive burrow dominates the chamber—easily three feet in diameter, worn smooth by something large moving in and out.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'offerings',
          description:
            'Rat corpses are piled at the burrow entrance—offerings from the colony above. Some are fresh. Something accepts them.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'deep scratches',
          description:
            'Gouges in the stone floor are too large, too deep to be made by any normal rat. They lead into the burrow.',
          boltedDown: true,
        },
        {
          prototype: 'sign',
          name: 'the silence',
          description: 'The scratching has stopped. Something is listening.',
          boltedDown: true,
        },
      ],
    },
  },
};
