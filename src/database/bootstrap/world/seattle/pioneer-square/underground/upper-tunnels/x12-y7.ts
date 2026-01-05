// Underground passage - between Cable Corridor (12,6) and Fourth Avenue North (14,8)

export const room = {
  name: 'Cable Hub Junction',
  description: `The passage reaches a junction where multiple cable routes converge, the infrastructure forming a nexus of telecommunications power. Equipment cabinets line the walls—network switches, fiber amplifiers, power distribution units—all humming with the flow of data and electricity.

The lighting is bright here, maintained at levels suitable for precision work on fiber optic connections. The air is climate-controlled, cooler than the surrounding tunnels to prevent equipment overheating. A small HVAC unit mounted to the wall produces a constant background hum.

Access panels lead to even more infrastructure—cable vaults that extend in directions the passage doesn't follow. The telecommunications network is larger than the physical tunnels, its cables threading through spaces too small for human passage.`,
  x: 12,
  y: 7,
  z: -2,
  population: 0,
  ambientNoise: 30,
  lighting: 35,
  waterLevel: 0,
  outdoor: false,
  exits: {
    south: {
      to: 'underground/upper-tunnels/x12-y6.ts',
      description: 'The passage leads south through the cable corridor',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y7.ts',
      description: 'A passage leads west toward the slope',
    },
    northeast: {
      to: 'buildings/yesler-underground/z-2.ts',
      room: '%FOURTH_NORTH',
      description: 'A passage leads northeast toward Fourth Avenue North',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'network equipment',
      description: 'Racks of network switches and fiber amplifiers fill equipment cabinets. Status lights blink in patterns that indicate traffic flow.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'HVAC unit',
      description: 'A small climate control unit keeps the equipment cool. It hums continuously, fighting the natural warmth of the underground.',
      boltedDown: true,
    },
  ],
};
