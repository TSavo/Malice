// Underground passage - factory district

export const room = {
  name: 'Eastern Industrial',
  description: `The passage runs through the eastern edge of the factory underground, approaching the limit of the industrial development that once characterized this neighborhood. The construction here is minimal—barely reinforced, the tunnel dug through earth with only occasional brick lining.

The walls show the marks of hasty excavation—pickaxe gouges, rough surfaces, the work of laborers who dug quickly rather than carefully. The urgency that drove this construction is evident in every surface.

Water pools on the floor, the drainage inadequate for the seepage that pressures this section of the underground.`,
  x: 13,
  y: -14,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 8,
  waterLevel: 18,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%TOOL_ROOM',
      description: 'The passage leads north toward Tool Room',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-15.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x12-y-14.ts',
      description: 'A passage leads west',
    },
  },
};
