// 1st Ave S - between S. Jackson and S. Main

export const room = {
  name: '1st Ave S',
  description: `Main Street opens ahead, and with it the heart of Pioneer Square's old commercial district. The Merchant's Cafe anchors the corner in weathered brick, its window still proclaiming SEATTLE'S OLDEST RESTAURANT in gold leaf that's flaking at the edges. EST. 1890. Through the glass: a mahogany bar, stools with torn leather seats, bottles arranged on shelves behind the bar in neat rows. The arrangement suggests someone left expecting to return.

The carriage tours launched from this corner—tourists in horse-drawn buggies, clip-clopping past historic buildings while guides recited facts about the Great Fire. The carriage is gone, probably stabled somewhere that isn't here. The horse that pulled it is probably dead. A hitching post remains bolted to the curb, cast iron shaped into a horse's head, rings for reins on either side. Decorative for fifty years, functional for fifty before that. Now just a shape.

The curb cut here still shows yellow paint where carriages loaded passengers. The paint has faded to a color that doesn't have a name.`,
  x: -14,
  y: -2,
  z: 0,
  // Exit connections

  imageOnDisk: '1st-ave-s-x-14-y-2-z0.png',
  exits: {
    west: {
      to: 'buildings/merchants-cafe/z0.ts#%BAR',
      description: "The glass-paneled door of Merchant's Cafe",
      door: 'buildings/merchants-cafe/z0.ts#%FRONT_DOOR',
    },
    east: {
      to: 'buildings/colman-building/z0.ts#%WEST_RETAIL',
      description: 'Glass doors lead into the vacant Colman Building retail space',
    },
  },
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  sittables: [
    {
      name: 'a hitching post',
      capacity: 1,
      emptyMsg: 'An old cast-iron hitching post stands bolted to the curb.',
      occupiedMsg: '%s leaning against the hitching post',
    },
  ],
};
