// West Spine passage - with access to J&M Cafe bootlegger tunnels

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage opens into what might have been a small plaza—a widening in the buried street where several buildings once fronted a common space. The ceiling is higher here, nearly ten feet, and the brick walls recede to form alcoves that were once doorways. The sense of space is disorienting after the confinement of the tunnels. The darkness feels larger.

Cast iron columns stand at the corners of the open area, their bases buried in the accumulated debris of a century. The columns support nothing visible—the floors they once held have been removed or collapsed—but they remain, monuments to a structural plan that no longer exists. Someone painted numbers on them once. The numbers have meaning only to the dead.

The southern wall shows a heavy door, reinforced with iron bands—a bootlegger passage connecting to a building basement above.`,
      x: -14,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 'buildings/jm-cafe/z-1.ts:%BOOTLEGGER_ROOM',
          description: 'A bootlegger passage leads to a building basement',
        },
      },
    },
  },
};
