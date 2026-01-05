// Underground passage - factory district

export const room = {
  name: 'Forge Access',
  description: `The passage approaches the Tool Room, the heat from the forge having left its mark on the surrounding earth. The brick walls are discolored by decades of exposure to high temperatures, the mortar darkened and the clay tinged with shades of red and black.

The floor here is made of firebrick—special construction designed to withstand the heat of the metalworking operations above. The bricks are cracked but stable, their heat-resistant properties no longer needed but still evident.

A slag heap occupies one corner of the passage, the waste product of countless forging operations dumped here and never removed.`,
  x: 12,
  y: -13,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 10,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x12-y-12.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x12-y-14.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y-13.ts',
      description: 'A passage leads west',
    },
    east: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%TOOL_ROOM',
      description: 'The passage leads east to Tool Room',
    },
  },
  objects: [
    {
      prototype: 'crate',
      name: 'slag heap',
      description: 'A pile of slag—the waste product of metalworking—dumped here decades ago and never removed. The material is black and glassy.',
      boltedDown: true,
    },
  ],
};
