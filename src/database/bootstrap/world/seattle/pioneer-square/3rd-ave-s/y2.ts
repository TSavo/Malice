// 3rd Ave S - between S. Washington St and S. Main St

export const room = {
  name: '3rd Ave S',
  description: `The King County Courthouse dominates the eastern side of the avenue, its brutalist concrete facade rising five stories above the street. The building was designed to inspire respect for the law—or perhaps fear of it. The massive bronze doors stand slightly ajar, someone having wedged them open with a fire extinguisher.

The Corp Construction fence continues west, but here it's been decorated. Someone hung photographs on the chain-link, pictures of people. Missing persons flyers, maybe, or memorials. The rain has faded them to ghosts, faces barely visible, names illegible. The fence has become a wall of the forgotten.

A newspaper box stands at the corner, still holding copies of the Seattle Times from months ago. The headline announces something that seemed important then. The newsprint has yellowed. The importance has evaporated.

The courthouse steps lead up to the entrance, broad stone worn smooth by decades of lawyers and defendants and the curious.`,
  x: 7,
  y: 2,
  z: 0,

  imageOnDisk: '3rd-ave-s-x7-y2-z0.png',
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  exits: {
    east: {
      to: 'buildings/county-courthouse/z0.ts:%LOBBY',
      description: 'Broad steps lead up to the courthouse entrance',
    },
  },
  sittables: [
    {
      name: 'courthouse steps',
      capacity: 4,
      emptyMsg: 'Broad stone steps lead up to the courthouse doors.',
      occupiedMsg: '%s sitting on the courthouse steps',
    },
  ],
};
