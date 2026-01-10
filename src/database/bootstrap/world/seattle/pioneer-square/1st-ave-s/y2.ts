// 1st Ave S - between S. Main and S. Washington

export const room = {
  name: '1st Ave S',
  description: `A steel door painted black marks the entrance to what was Trinity Nightclub, the kind of place that only existed after midnight. No sign—if you didn't know where it was, you weren't supposed to find it. The door opens onto stairs descending into a basement that runs beneath half the block, brick-vaulted ceilings from the 1890s repurposed into a dance floor. Down there: a DJ booth, a bar, bathrooms with graffiti that passed for philosophy. Speakers that could move your chest from across the room.

To the east, the ornate sandstone corner of Grand Central Arcade rises four stories, its Romanesque arches and iron framework a monument to 1890s ambition. A clock tower crowns the southeast corner, its faces frozen at different times, the mechanisms having given up at different moments over the decades. The building's ground floor shows the faded gilt lettering of shops that closed before The Burning.

A bouncer's stool sits beside the door, black metal, bolted to the sidewalk. The stool is empty. The velvet rope that once stretched from door to stanchion lies coiled at the base of the wall like a dead snake.

These buildings connect below street level—the Underground passages run beneath the whole neighborhood, a labyrinth of old storefronts and sidewalks preserved in darkness. Most entrances are sealed, bricked up or padlocked. But the passages are still there, beneath your feet right now, silent except for dripping water and the scuttle of things that live in darkness.`,
  x: -14,
  y: 2,
  z: 0,
  // Environmental properties

  imageOnDisk: '1st-ave-s-x-14-y2-z0.png',
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  sittables: [
    {
      name: 'a bouncer stool',
      capacity: 1,
      emptyMsg:
        'A black metal bouncer stool sits bolted near the nightclub entrance.',
      occupiedMsg: '%s sitting on the bouncer stool',
    },
  ],
  exits: {
    west: {
      to: 'buildings/doc-maynards/z0.ts#BAR',
      description: "Heavy wooden doors lead into Doc Maynard's Public House",
    },
  },
};
