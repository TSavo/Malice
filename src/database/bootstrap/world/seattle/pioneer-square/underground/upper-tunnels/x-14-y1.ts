// West Spine passage - with access to Zeitgeist Building basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage shows evidence of fire damage—smoke stains darkening the ceiling, brick surfaces cracked from heat exposure, the burnt remnants of timber supports replaced with newer wood. The fire happened long ago, perhaps in the Great Fire of 1889 or perhaps in some smaller conflagration that history didn't bother to record. The underground has its own history, parallel to the city above, remembered by the stones.

The replacement timbers are rough-hewn, functional rather than aesthetic, installed by hands that cared more about holding up the ceiling than impressing visitors. The work is solid. The repairs have held. Whatever burned here burned once and hasn't burned since.

A breach in the eastern wall leads to a building basement—the Zeitgeist Building's foundation, where art waits in climate-controlled darkness.`,
      x: -14,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: 'buildings/zeitgeist-building/z-1.ts:%OLD_FOUNDATION',
          description: 'A breach in the wall leads to a building basement',
        },
      },
    },
  },
};
