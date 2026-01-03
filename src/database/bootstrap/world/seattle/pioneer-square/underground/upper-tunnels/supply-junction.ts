// Supply Junction - where West Spine meets Supply Branch
// Critical intersection for underground logistics

export const room = {
  name: 'Supply Junction',
  description: `The intersection where the main spine meets the southern route was chosen for strategic reasons that remain valid after a century of burial. The sightlines are long in both directions—north along the spine, west toward the depot—allowing anyone standing here to spot approaching movement from a distance. The ceiling is lower here than at other junctions, barely seven feet, which limits options for rapid passage. The space favors those who know it.

The walls show evidence of ongoing reinforcement—new mortar between old bricks, timber braces installed where the original structure showed weakness. The work is professional, methodical, executed by someone who understands that hidden infrastructure requires hidden maintenance. The repairs are recent. The concern is current.

Scratched into the southwest corner is a symbol: a scale balanced over crossed keys. The meaning is opaque to casual observation. The precision of the carving suggests it means something to someone. Other marks cluster nearby—territorial indicators, directional symbols, warnings in a code that requires context. The junction is not just a passage. It's a statement.`,
  x: -14,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 20,
  waterLevel: 0,
  outdoor: false,
  exits: {
    down: {
      prototype: 'guardedExit',
      allowedFaction: 'Gray Cartel',
      denyMessage: 'A combination padlock dangles from its hasp. You lack the combination.',
      description: 'A reinforced hatch is set into the floor.',
    },
  },
};
