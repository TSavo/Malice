// Underground passage - factory district connector

export const room = {
  name: 'Factory Tunnel',
  description: `The passage continues through the factory underground, approaching the main Factory Connector junction. The construction is industrial—heavy timber supports, iron reinforcement, floors designed to bear the weight of loaded carts.

A junction with the main corridor lies ahead, where multiple factory tunnels converge. The sound of dripping water echoes from somewhere in the darkness, the drainage systems overwhelmed by decades of seepage.

Old machinery sits abandoned in an alcove—gears and pulleys from some forgotten mechanism, too heavy to move and too worthless to salvage.`,
  x: 9,
  y: -11,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 12,
  waterLevel: 10,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x8-y-11.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%FACTORY_CONNECTOR',
      description: 'The passage leads east to Factory Connector',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'abandoned machinery',
      description: 'Rusted gears and pulleys from some forgotten mechanism. Too heavy to move, too worthless to salvage.',
      boltedDown: true,
    },
  ],
};
