// Underground passage - between Junction Box Chamber (12,5) and Cable Hub North (12,7)

export const room = {
  name: 'Cable Corridor',
  description: `The passage runs north from the Junction Box Chamber through the heart of the cable infrastructure, fiber and copper bundles running along both walls in organized trays. The installation is professional, the work of contractors who knew what they were doing and took pride in it.

The corridor is wider here, sized to accommodate the equipment and technicians who maintain the network. Emergency lighting provides a backup to the main fixtures, red bulbs waiting in alcoves to activate if the primary power fails.

A small alcove cut into the wall contains a technician's stash—a folding chair, a thermos, a dog-eared paperback. Someone spends time here, perhaps during long maintenance windows, making themselves comfortable in the underground.`,
  x: 12,
  y: 6,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 25,
  waterLevel: 0,
  outdoor: false,
  exits: {
    south: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%JUNCTION_BOX',
      description: 'The passage leads south toward the Junction Box Chamber',
    },
    north: {
      to: 'underground/upper-tunnels/x12-y7.ts',
      description: 'The passage continues north',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y6.ts',
      description: 'A passage leads west',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'technician stash',
      description: 'A small alcove contains a folding chair, an old thermos, and a battered copy of a science fiction novel. Someone makes themselves comfortable here during maintenance windows.',
      boltedDown: true,
    },
  ],
};
