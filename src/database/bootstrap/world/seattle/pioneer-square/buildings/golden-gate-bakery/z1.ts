// Golden Gate Bakery - Second Floor (z=1)
// Happy Day Photography - Wedding portrait studio
// Sample portraits still hang in the window, faded to ghosts

export const building = {
  name: 'Golden Gate Bakery',
  x: 5,
  y: -12,
  width: 1,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%STORAGE_LOCK': {
      prototype: 'lock',
      name: 'Storage Room Lock',
      description:
        'A simple padlock on the storage room door, the kind bought at any hardware store.',
      difficulty: 2,
    },
    '%STORAGE_DOOR': {
      prototype: 'door',
      name: 'Storage Door',
      description:
        'A plain door leading to a storage room, its paint peeling, its hinges squeaking.',
      locked: true,
      open: false,
      locks: ['%STORAGE_LOCK'],
      material: 'wood',
      durability: 40,
    },

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A simple latch lock on the roof hatch, more for keeping weather out than people.',
      difficulty: 1,
    },
    '%ROOF_HATCH': {
      prototype: 'door',
      name: 'Roof Hatch',
      description:
        'A metal hatch leading to the flat roof, its frame rusted but functional.',
      locked: false,
      open: false,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 55,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - PHOTO STUDIO
    // ═══════════════════════════════════════════════════════════════════

    '%STUDIO_LANDING': {
      name: 'Happy Day Photography - Landing',
      description: `The narrow stairwell opens onto a small landing, the transition from bakery to photo studio marked by a change in decor—from utilitarian food service to aspirational romance. Sample wedding portraits line the walls of the stairwell, their colors faded by fifty-five years of indirect light, the happy couples reduced to pale suggestions of joy.

A reception desk sits against one wall, its surface covered in dust, a guest book open to a page that was never signed. Business cards in a holder advertise services no longer offered: "Wedding Packages from $999," "Family Portraits," "Graduation Photos." The prices are from before money lost meaning. The services are from before happiness became a luxury.

The main studio is visible through a beaded curtain, strands of plastic pearls clicking faintly when the air moves.`,
      x: 5,
      y: -12,
      z: 1,
      imageOnDisk: 'happy-day-photography-landing-x5-y-12-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#STOREFRONT',
        north: '%MAIN_STUDIO',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'counter'],
          description: `A small reception desk covered in dust, its surface scattered with the detritus of a business that closed mid-operation. A guest book lies open, the last entry dated August 14, 2062—a couple who came to discuss their wedding photos. The wedding was scheduled for September. The world ended in August.`,
        },
        {
          prototype: 'describable',
          name: 'sample portraits',
          aliases: ['photos', 'pictures', 'portraits'],
          description: `Wedding portraits line the stairwell walls, their colors faded by decades of light exposure. Brides in elaborate white gowns, grooms in dark suits, the poses traditional and hopeful. Each portrait represents a marriage that began with ceremony. Each portrait represents a marriage that ended, one way or another. The faces are barely visible now, faded to suggestions of happiness.`,
        },
        {
          prototype: 'describable',
          name: 'beaded curtain',
          aliases: ['curtain', 'beads'],
          description: `A curtain of plastic pearl beads separates the landing from the main studio, the kind of decorative touch that suggested elegance on a budget. The beads are dusty and yellowed, clicking faintly when air moves through the building. Some strands are broken, beads scattered on the floor.`,
        },
      ],
    },

    '%MAIN_STUDIO': {
      name: 'Happy Day Photography - Studio',
      description: `The main studio is a time capsule of aspirational romance, preserved in dust and decay. Backdrop stands hold painted scenes—a garden gazebo, a moonlit beach, a classical column arrangement—the illusions that transformed a second-floor studio into anywhere couples wanted to be. The paint on the backdrops is peeling now, the gazebo collapsing, the beach fading to abstraction.

Photography equipment clutters the space: light stands with dead bulbs, reflector umbrellas covered in cobwebs, a massive camera on a tripod aimed at an empty posing platform. The camera is film, not digital—the photographer was traditional. The film inside, if any remains, has long since fogged.

Prop furniture fills one corner: a velvet chaise lounge rotted to springs and fabric scraps, artificial flowers bleached white by decades of indirect sun, a fake wedding cake that mice have nested in. The props were meant to suggest luxury. They suggest decay now.

A door leads to what was probably a dressing room. Stairs in the corner lead up to a roof access hatch.`,
      x: 5,
      y: -11,
      z: 1,
      imageOnDisk: 'happy-day-photography-studio-x5-y-11-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STUDIO_LANDING',
        west: {
          to: '%DRESSING_ROOM',
          description: 'A door leads to the dressing room',
          door: '%STORAGE_DOOR',
        },
        up: {
          to: 'z2.ts#ROOF',
          description: 'A narrow staircase leads to a roof hatch',
          door: '%ROOF_HATCH',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'backdrop stands',
          aliases: ['backdrops', 'scenes'],
          description: `Painted canvas backdrops on adjustable stands, the illusions of a dozen romantic settings. A garden gazebo with roses climbing its lattice—the paint peeling, the roses fading. A moonlit beach with palm trees—the moon yellowed, the palms browning. A classical arrangement of columns and drapes—the columns cracking, the drapes moth-eaten. The backdrops promised transformation. They deliver decay.`,
        },
        {
          prototype: 'furniture',
          name: 'vintage camera',
          aliases: ['camera', 'tripod'],
          description: `A large-format camera on a wooden tripod, aimed at the posing platform where brides and grooms once stood. The camera is film, not digital—the photographer was a traditionalist. The bellows are cracked, the lens clouded. Any film inside has long since fogged. The camera captured hundreds of happy moments. It captures nothing now.`,
        },
        {
          prototype: 'describable',
          name: 'lighting equipment',
          aliases: ['lights', 'umbrellas', 'stands'],
          description: `Photography lights on adjustable stands, their umbrellas and softboxes covered in cobwebs. The bulbs are dead, the power cords frayed. Professional lighting requires electricity. The studio hasn't had electricity in fifty-five years. The shadows stay where they fall.`,
        },
        {
          prototype: 'furniture',
          name: 'ruined chaise',
          aliases: ['chaise', 'lounge', 'couch'],
          description: `A velvet chaise lounge, the kind brides reclined on for glamorous portraits. The velvet has rotted away, exposing springs and horsehair padding. Mice have nested in the frame. The chaise was meant to suggest romance and luxury. It suggests the passage of time now, the decay of all things.`,
        },
        {
          prototype: 'describable',
          name: 'prop wedding cake',
          aliases: ['cake', 'wedding cake'],
          description: `A fake wedding cake used for photos, its foam construction designed to look like tiered fondant. Mice have burrowed into the foam, building nests in what was meant to represent celebration. Artificial flowers that once decorated the tiers lie scattered on the floor, bleached white by years of light. The cake was never meant to be eaten. Nothing here was meant to last.`,
        },
      ],
      sittables: [
        {
          name: 'posing platform',
          capacity: 2,
          emptyMsg:
            'A low platform where couples once posed for portraits, its carpet worn and stained.',
          occupiedMsg: '%s on the posing platform',
        },
      ],
    },

    '%DRESSING_ROOM': {
      name: 'Happy Day Photography - Dressing Room',
      description: `The dressing room is where brides transformed—where street clothes became wedding gowns, where nervous young women became the central figures of elaborate ceremonies. Mirrors line one wall, their glass clouded with age, their frames tarnished. The reflections they offer are dim and ghostly.

A rack of sample gowns stands against one wall, the dresses the studio kept for clients who couldn't afford their own. Fifty-five years have not been kind: silk has yellowed to ivory, lace has crumbled, moth damage leaves patterns of holes in what were once pristine fabrics. The gowns are wedding dresses for ghosts now.

A vanity table holds the debris of preparation: makeup cases dried and cracked, hairpins scattered and rusted, a jewelry box containing costume pieces that might still shine if polished. The chair before the vanity is pushed back, as if someone stood up and walked away mid-preparation.

The room smells of must and decay, the ghost of perfume long since dissipated.`,
      x: 4,
      y: -11,
      z: 1,
      imageOnDisk: 'happy-day-photography-dressing-room-x4-y-11-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MAIN_STUDIO',
      },
      sittables: [
        {
          name: 'vanity seat',
          capacity: 1,
          emptyMsg:
            'A padded stool before the vanity, its fabric faded and dusty.',
          occupiedMsg: '%s at the vanity',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'gown rack',
          aliases: ['gowns', 'dresses', 'wedding dresses'],
          description: `A rack of sample wedding gowns, kept for clients who couldn't afford their own. Fifty-five years have transformed them: silk yellowed to cream, lace crumbled to threads, moth damage creating patterns of absence in what were once pristine fabrics. Size tags still hang from the collars, measurements for women who are old now, or dead. The gowns wait for brides who will never come.`,
        },
        {
          prototype: 'furniture',
          name: 'vanity table',
          aliases: ['vanity', 'makeup', 'mirror'],
          description: `A vanity table with a trifold mirror, the glass clouded and spotted with age. Makeup cases lie open on the surface, their contents dried to dust and powder. Hairpins scattered across the table have rusted to brown. A jewelry box contains costume pieces—rhinestone tiaras, pearl-drop earrings—that might still shine if anyone cared to polish them. The last bride to sit here never finished preparing.`,
        },
        {
          prototype: 'describable',
          name: 'wall mirrors',
          aliases: ['mirrors', 'reflections'],
          description: `Full-length mirrors line the walls, positioned so a bride could see herself from every angle. The mirrors are clouded now, spotted with age, offering only dim reflections of whoever stands before them. The brides who once checked their appearance are ghosts now. The mirrors reflect ghosts.`,
        },
        {
          prototype: 'describable',
          name: 'scattered hairpins',
          aliases: ['pins', 'hairpins', 'bobby pins'],
          description: `Hairpins scattered across the vanity table and floor, dropped during the last preparations and never collected. Fifty-five years have rusted them brown, staining the surfaces they rest on. Each pin was meant to hold a hairstyle in place for a few hours. They've held their positions for fifty-five years instead.`,
        },
      ],
    },
  },

  postProcessors: [],
};
