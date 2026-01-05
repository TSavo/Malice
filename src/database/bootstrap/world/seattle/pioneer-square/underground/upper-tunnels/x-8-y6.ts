// Junction Corridor - Angled Passage (turn from y=5 to y=6)

export const room = {
  name: 'Angled Passage',
  description: `The tunnel angles here, turning northward as it navigates around some obstruction that the original builders refused to excavate through. Perhaps bedrock, perhaps the foundation of a building deemed too important to undermine. The reason is lost, but the angle remains.

Someone painted directional arrows on the walls—faded red chevrons pointing toward destinations that may or may not still exist. The arrows date from different eras, layered over each other as successive generations of underground travelers added their own guidance.`,
  x: -8,
  y: 6,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 15,
  waterLevel: 0,
  outdoor: false,
  exits: {
    southwest: {
      to: 'underground/upper-tunnels/x-9-y5.ts',
      description: 'The passage angles southwest',
    },
    east: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%OCC_JUNCTION',
      description: 'The passage continues east to the Northern Junction',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'painted directional arrows',
      description: 'Faded red chevrons painted on the walls, layered over each other from different eras, all pointing toward destinations in the underground network.',
      boltedDown: true,
    },
  ],
};
