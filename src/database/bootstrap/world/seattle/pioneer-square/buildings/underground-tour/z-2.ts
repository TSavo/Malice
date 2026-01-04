// Underground Tour - Buried Streets Level (z=-2)
// The actual historic underground that tourists once paid to see
// Now accessible without a guide

export const building = {
  name: 'Underground Tour',
  x: -15,
  y: -3,
  width: 3,
  height: 3,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // TOUR ROUTE (z=-2) - THE BURIED STREETS
    // ═══════════════════════════════════════════════════════════════════════

    '%TOUR_START': {
      name: 'Underground Tour - Buried Sidewalk',
      description: `The stairs deposit you onto what was once a sidewalk—now a ceiling of wooden planks overhead, the street-level that tourists walked on became the roof of the world below. The prism glass skylights are dark, their purple panes admitting nothing from the modern streets far above.

This is where the tours began their actual underground journey, where guides gestured at the brick storefronts and explained how Seattle raised itself after the Great Fire. The storefronts are still here—display windows with iron frames, doorways leading to shops that closed over a century ago.

A rope barrier that once kept tourists in line lies coiled on the ground, its brass stanchions toppled and tarnished. The tour route leads south, but the rope can no longer compel obedience.`,
      x: -15,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%DESCENT',
        south: '%TOUR_MID',
        east: '%STOREFRONT_ROW',
      },
      objects: [
        { prototype: 'furniture', name: 'prism glass skylights', description: 'Glass prisms set into the ceiling once allowed light to filter down from the street above. The prisms are dark now—the sidewalk above them replaced with solid concrete decades ago.', boltedDown: true },
        { prototype: 'sign', name: 'a tour placard', description: 'A laminated placard on a stand explains the Great Fire of 1889, the decision to raise the streets, and the creation of this underground world. The corners are curled with moisture damage.', boltedDown: true },
        { prototype: 'furniture', name: 'fallen rope stanchions', description: 'Brass stanchions with red velvet rope, toppled and scattered. They once guided tourist traffic in orderly lines. The order has ended.', boltedDown: true },
      ],
    },

    '%TOUR_MID': {
      name: 'Underground Tour - Commerce Row',
      description: `The tour route continues past storefronts that once served a working city—a bank with iron-barred windows, a hotel lobby with a marble counter, a tailor's shop with a headless mannequin still wearing half a suit. The businesses closed when the streets rose, their owners relocating upward, leaving inventory behind.

The guides had stories for each storefront. The bank that survived three robberies before the fire took it. The hotel where Mark Twain supposedly spent one night. The tailor who made clothes for loggers and longshoremen. Truth and embellishment blended into entertainment.

The tour route turns east here, toward the main underground network that the tours only hinted at.`,
      x: -15,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%TOUR_START',
        east: '%TOUR_END',
        south: '%HIDDEN_ALCOVE',
      },
      objects: [
        { prototype: 'furniture', name: 'a headless mannequin', description: 'A dressmaker\'s mannequin still wears half a Victorian suit—one sleeve pinned, the other dangling loose. The head is missing, perhaps taken as a souvenir.', boltedDown: true },
        { prototype: 'furniture', name: 'an iron-barred window', description: 'The bank\'s teller window still has its iron bars intact. A cash drawer hangs open, emptied long ago but never removed.', boltedDown: true },
        { prototype: 'sign', name: 'a hotel register', description: 'A guest register lies open on the marble counter, its pages water-damaged but readable. Names from 1889, the last guests before the fire: "J. Stevens, Portland. W. Chen, San Francisco. A. Morrison, Tacoma."', boltedDown: true },
      ],
    },

    '%STOREFRONT_ROW': {
      name: 'Underground Tour - Preserved Storefronts',
      description: `The side passage runs along a row of storefronts that were preserved as tour exhibits—windows cleaned, facades stabilized, small plaques identifying each business. The preservation efforts ended when the tours did, but the storefronts remain in better condition than the rest of the underground.

A pharmacy with shelves of empty brown bottles. A hardware store with rusted tools still hanging on pegboards. A dry goods store with wooden barrels that once held flour and sugar and beans, their contents long since claimed by rats and rot.

The passage opens east into the wider underground network, where the tours never went.`,
      x: -14,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%TOUR_START',
        south: '%TOUR_END',
        east: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%BRANCH_W1',
          description: 'A passage leads east into the broader underground network',
        },
      },
      objects: [
        { prototype: 'cabinet', name: 'pharmacy shelves', description: 'Wooden shelves hold rows of brown glass bottles, their paper labels faded to illegibility. Whatever medicines they held evaporated decades ago.', boltedDown: true },
        { prototype: 'furniture', name: 'hardware pegboards', description: 'Rusted tools hang on pegboards: hammers, saws, chisels, files. A price tag is still visible: "HAND SAW - 75¢".', boltedDown: true },
        { prototype: 'crate', name: 'wooden barrels', description: 'Wooden barrels that once held dry goods now hold only dust and cobwebs. The staves are warped, the iron bands rusted.', boltedDown: true },
      ],
    },

    '%TOUR_END': {
      name: 'Underground Tour - End of the Line',
      description: `The tour route terminates at a junction where the preserved sections meet the unpreserved underground. A chain barrier with an EMPLOYEES ONLY sign once prevented tourists from wandering further. The chain hangs loose now, one end unhooked from the stanchion.

Beyond the barrier, the underground continues—less maintained, more authentic, the actual buried streets rather than the curated exhibit. This is where the tours turned around, where guides warned about unstable construction and liability concerns. The warnings were real. The unstable construction is still unstable.

A door in the south wall leads to passages that weren't on the tour.`,
      x: -14,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 5,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%STOREFRONT_ROW',
        west: '%TOUR_MID',
        south: '%UNTOUR_PASSAGE',
        east: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%PUMP_ROOM',
          description: 'A passage continues east into the maintenance tunnels',
        },
      },
      objects: [
        { prototype: 'sign', name: 'an employees only sign', description: 'A weathered sign reads "EMPLOYEES ONLY - TOUR PARTICIPANTS DO NOT PROCEED". Below it, graffiti adds: "tour\'s over".', boltedDown: true },
        { prototype: 'furniture', name: 'a loose chain barrier', description: 'A chain that once blocked the passage hangs from one stanchion, the other end unhooked. The barrier is symbolic now.', boltedDown: true },
      ],
    },

    '%HIDDEN_ALCOVE': {
      name: 'Underground Tour - Hidden Alcove',
      description: `A small alcove behind a collapsed display case, invisible from the main tour route. The guides didn't know about this space, or pretended not to—it wasn't part of the script. The alcove shows evidence of regular use: a sleeping bag, empty food cans, a battery-powered lantern.

Someone has been living here, using the tour infrastructure for shelter. The sleeping bag is recent. The person might return.`,
      x: -15,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 2,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%TOUR_MID',
        east: '%UNTOUR_PASSAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a sleeping bag', description: 'A worn sleeping bag rolled neatly against the wall. It\'s been used recently—the fabric is dirty but not mildewed.', boltedDown: true },
        { prototype: 'crate', name: 'empty food cans', description: 'A small pile of empty cans: beans, soup, Vienna sausages. The labels are from this decade.', boltedDown: true },
        { prototype: 'furniture', name: 'a battery lantern', description: 'A battery-powered camping lantern. The switch is off, but the batteries might still work.', boltedDown: true },
      ],
    },

    '%UNTOUR_PASSAGE': {
      name: 'Underground Tour - Restricted Passage',
      description: `Beyond the tour boundary, the underground loses its curated character. The walls are rougher, the floor uneven, the maintenance that kept the tour route passable never extended here. This is the real underground—the parts the tourists never saw.

The passage runs south toward the docks, connecting the tour infrastructure to the broader network that links Pioneer Square's basements and buried streets. The air is damper here, the smell stronger, the sense of history unmediated by plaques and guides.`,
      x: -14,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 3,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%TOUR_END',
        west: '%HIDDEN_ALCOVE',
        south: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%DOCK_PASSAGE',
          description: 'A rough passage descends toward the waterfront',
        },
      },
      objects: [
        { prototype: 'sign', name: 'scratched directions', description: 'Directions scratched into the brick: "DOCKS ↓" and "CITY →". Someone mapped these passages the old-fashioned way.', boltedDown: true },
      ],
    },
  },
};
