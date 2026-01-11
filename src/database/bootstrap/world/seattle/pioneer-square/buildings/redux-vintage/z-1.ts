// Redux Vintage - Basement (z=-1)
// Storage cellar with a hidden passage used for smuggling vintage goods... and other things

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Trapdoor Lock',
      description:
        'A sturdy hasp and padlock securing the basement trapdoor, the key hidden somewhere in the back room.',
      difficulty: 3
    },

    '%HIDDEN_LOCK': {
      prototype: 'lock',
      name: 'Hidden Panel Lock',
      description:
        'A concealed latch mechanism that releases when the correct clothing rod is pulled.',
      difficulty: 6
    },
    '%HIDDEN_PANEL': {
      prototype: 'door',
      name: 'Hidden Panel',
      description:
        'A section of wall that appears to be solid brick but swings open on hidden hinges.',
      locked: true,
      open: false,
      locks: ['%HIDDEN_LOCK']
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1) - STORAGE AND SMUGGLING PASSAGE
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR_STAIRS': {
      name: 'Redux - Cellar Stairs',
      description: `A narrow wooden staircase descends from a trapdoor in the back room, the steps worn smooth by decades of feet carrying boxes up and down. The wood creaks with every step, announcing presence to anyone below. The walls are bare brick, sweating with moisture that never quite dries.

The smell of the shop above—mothballs, old fabric, ghost perfume—mingles with the basement's own scent: damp earth, old cardboard, the particular mustiness of underground spaces.

A single bare bulb hangs at the bottom of the stairs, its pull-chain dangling. The light it casts is yellow and weak, barely reaching the corners of the space below.`,
      x: -16,
      y: 4,
      z: -1,
      imageOnDisk: 'redux-cellar-stairs-x-16-y4-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: { to: 'z0.ts#%BACKROOM', door: '%BASEMENT_TRAPDOOR', locks: ['%BASEMENT_LOCK'] },
        north: '%OVERFLOW',
        east: '%MAIN_CELLAR'
      }
    },

    '%MAIN_CELLAR': {
      name: 'Redux - Main Cellar',
      description: `The main storage area sprawls beneath the showroom, its low ceiling supported by wooden beams that date to the building's original construction. Cardboard boxes are stacked everywhere—labeled by decade, by type, by source—the overflow of a vintage business that accumulated faster than it sold.

The organization suggests obsession. Every box is labeled in the same handwriting, the same marker, the same system of codes: "EST-73-A" (estate sale, 1970s, category A), "CON-85-D" (consignment, 1980s, category D). Someone built a taxonomy of nostalgia and applied it with religious consistency.

The floor is packed earth covered in plywood sheets that shift slightly underfoot. Water stains on the boxes suggest periodic flooding—the kind of basement that fills when the water table rises, then drains, leaving its mark.

A wall of chrome clothing racks dominates the eastern side, hung with garment bags containing pieces too valuable or too fragile for the shop floor.`,
      x: -15,
      y: 4,
      z: -1,
      imageOnDisk: 'redux-main-cellar-x-15-y4-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CELLAR_STAIRS',
        north: '%HIDDEN_ROOM'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'labeled boxes',
          aliases: ['boxes', 'cardboard boxes', 'storage'],
          description:
            'Cardboard boxes stacked to the ceiling, each labeled in faded marker with a code system: "EST-73-A," "CON-85-D." The taxonomy of vintage retail, preserved in Sharpie.'
        },
        {
          prototype: 'cabinet',
          name: 'garment racks',
          aliases: ['racks', 'clothing racks', 'chrome racks'],
          description:
            'Chrome racks hung with garment bags, their contents shapeless behind cloudy plastic. These are the premium pieces—designer labels, mint condition, priced for serious collectors who never came.'
        },
        {
          prototype: 'describable',
          name: 'water stains',
          aliases: ['stains', 'flood marks'],
          description:
            'Tide lines mark the boxes at various heights, recording floods that rose and fell over the years. The lowest boxes are soft with water damage. The highest remain untouched. The basement remembers every storm.'
        },
      ]
    },

    '%OVERFLOW': {
      name: 'Redux - Overflow Storage',
      description: `A secondary storage space tucked into the building's northwest corner, used for items that didn't fit the store's carefully curated aesthetic. The contents are less organized here—unsorted estate sale purchases, donations that were never processed, mistakes bought at auction and never resold.

Mannequin parts are piled in one corner: arms, torsos, heads with painted eyes staring in different directions. The dismembered display figures create an unsettling tableau, limbs reaching from the pile as if trying to escape.

A workbench against the wall holds tools for minor repairs: a sewing kit, fabric glue, a heat gun for reshaping plastic. The repairs stopped mid-project. A zipper replacement sits half-finished, the needle still threaded.

The brick wall on the north side doesn't quite match the rest—newer mortar, slightly different color. Someone sealed something up.`,
      x: -16,
      y: 4,
      z: -1,
      imageOnDisk: 'redux-overflow-storage-x-16-y4-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%CELLAR_STAIRS',
        east: '%HIDDEN_ROOM'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'mannequin parts',
          aliases: ['mannequins', 'limbs', 'parts'],
          description:
            'A pile of dismembered mannequins—arms reaching, torsos stacked, heads with frozen smiles turned at odd angles. The plastic is sun-bleached and cracked, retired from service upstairs. They seem to be trying to escape the pile.'
        },
        {
          prototype: 'desk',
          name: 'repair workbench',
          aliases: ['workbench', 'bench', 'tools'],
          description:
            'A workbench with repair tools: a sewing kit, fabric glue, a heat gun. A zipper replacement sits half-finished, the needle still threaded, the work abandoned mid-stitch.'
        },
        {
          prototype: 'describable',
          name: 'sealed wall section',
          aliases: ['wall', 'bricks', 'sealed section'],
          description:
            'A section of the north wall where the mortar is newer than the surrounding brickwork. Someone bricked up an opening here—recently enough that the difference is visible, long enough ago that no one remembers why.'
        },
      ]
    },

    '%HIDDEN_ROOM': {
      name: 'Redux - Hidden Room',
      description: `Behind a rack of garment bags, a section of wall swings open on concealed hinges, revealing a space that doesn't appear on any building plans. The room is small—barely eight feet square—with walls of old brick and a ceiling so low that standing upright is uncomfortable.

This was a smuggling cache, probably dating back to Prohibition. The space is perfect for hiding things: no windows, no official access, forgotten by everyone who didn't need to know. The vintage store's previous owners found it and used it. The current emptiness suggests they found a better hiding place.

A heavy iron ring is set into the floor, attached to a hatch that leads down into darkness. The hatch is old—older than the vintage clothes, older than the building's current use, possibly older than the fire that raised Seattle and buried its streets.

The walls bear scratched tallies and dates in chalk, some nearly illegible with age. People counted days here. People waited here. The room remembers.`,
      x: -15,
      y: 4,
      z: -1,
      imageOnDisk: 'redux-hidden-room-x-15-y4-z-1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { room: '%MAIN_CELLAR', door: '%HIDDEN_PANEL', locks: ['%HIDDEN_LOCK'] },
        west: '%OVERFLOW',
        down: '%SHAFT'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'iron floor ring',
          aliases: ['ring', 'hatch', 'trapdoor'],
          description:
            'A heavy iron ring set into the floor, attached to a hatch that leads down into the underground. The iron is worn smooth from use, the hinges oiled recently. Someone maintains this access.'
        },
        {
          prototype: 'describable',
          name: 'chalk tallies',
          aliases: ['tallies', 'marks', 'scratches'],
          description:
            'Chalk marks on the walls—tallies in groups of five, dates in various handwriting, names that might be aliases. People counted time here, waiting for danger to pass or opportunity to arrive. The oldest marks are nearly illegible. The newest are months old.'
        },
        {
          prototype: 'crate',
          name: 'empty crates',
          aliases: ['crates', 'boxes'],
          description:
            'Wooden crates stacked in the corner, their lids pried open, their contents removed. Whatever was stored here has been moved—or delivered. The crates wait for the next shipment.'
        },
      ]
    },

    '%SHAFT': {
      name: 'Redux - Smuggler\'s Shaft',
      description: `A vertical shaft descends from the hidden room above, its walls rough brick reinforced with iron bands at intervals. The shaft is narrow—barely wide enough for one person—and drops perhaps twenty feet into the darkness below.

Metal rungs are bolted into the wall, forming a ladder that descends into the underground. The rungs are worn smooth in their centers from decades of hands and feet. This passage has seen regular use over the years.

The air moves in the shaft, a faint draft rising from the tunnels below, carrying the mineral smell of deep earth and the distant echo of dripping water. The shaft connects to the buried city that lies beneath Seattle—the original streets, entombed when the city rebuilt itself after the great fire.`,
      x: -15,
      y: 4,
      z: -1
      imageOnDisk: 'redux-smuggler-s-shaft-x-15-y4-z-1.5.png',.5,
      population: 0,
      ambientNoise: 5,
      lighting: 3,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%HIDDEN_ROOM',
        down: '%TUNNEL_ACCESS'
      }
    },

    '%TUNNEL_ACCESS': {
      name: 'Underground Passage',
      description: `The shaft opens into one of the buried passages that thread beneath Pioneer Square—the original ground level of Seattle, entombed when the city rebuilt itself after the fire of 1889. The ceiling here was once a wooden sidewalk; now it's a rotten timber lattice that occasionally drops splinters on the unwary.

The passage stretches east and west, connecting to the network of underground tunnels that spread beneath the neighborhood. The walls are brick, darkened with age and moisture, bearing the ghostly outlines of advertisements for businesses that closed a century ago.

This was once a busy street. The storefronts are sealed now, their windows bricked over, their doors leading nowhere. But the passage persists, used by those who need to move unseen—smugglers, fugitives, the forgotten.`,
      x: -15,
      y: 4,
      z: -2,
      imageOnDisk: 'underground-passage-x-15-y4-z-2.png',
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%SHAFT'
      }
    }
  }
};
