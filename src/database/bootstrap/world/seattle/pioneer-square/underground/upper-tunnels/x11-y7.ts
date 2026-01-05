// Underground passage - connecting Upper Slope (10,7) to cable infrastructure (12,7)

export const room = {
  name: 'Cable Hub North',
  description: `The passage runs through the northern section of the cable infrastructure, where multiple fiber runs converge before splitting toward their final destinations. The cable trays here are fuller, the bundles thicker, the infrastructure denser as it approaches the main hub.

The walls are lined with patch panels—rows of fiber connectors that allow technicians to reroute traffic as needed. The panels are maintained, their labels updated, their connections organized. Someone still tends this infrastructure, even if they never see the informal traffic that passes through their domain.

A maintenance log mounted to the wall records technician visits, the entries mundane: "Replaced failed transceiver, Port 47". "Cleaned fiber connectors, Cabinet 3". The log extends back decades, each technician adding their own handwriting to the record.`,
  x: 11,
  y: 7,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x10-y7.ts',
      description: 'The passage leads west toward the slope passage',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y7.ts',
      description: 'The passage leads east toward the main cable hub',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y6.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'maintenance log',
      description: 'A clipboard with handwritten maintenance entries spanning decades. Different handwriting styles mark the work of different technicians over the years.',
      boltedDown: true,
    },
  ],
};
