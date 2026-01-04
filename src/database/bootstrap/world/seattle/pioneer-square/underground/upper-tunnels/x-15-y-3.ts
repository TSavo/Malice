// Underground Tour - Base of Stairs - with access to Merchant's Cafe basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Tour - Base of Stairs',
      description: `The bottom of the stairwell opens into a small chamber where tour groups once gathered before continuing into the underground proper. The space served as an airlock of sorts—a place to pause, to let eyes adjust to the darkness, to absorb the first impression of being beneath the modern city.

The walls here are the oldest construction in the building sequence—massive foundation stones from the 1880s, predating the fire that would reshape Seattle. The stones were meant to support buildings that would never be completed in their original form. When the city rebuilt a level higher, these foundations became basements. When the basements were sealed, they became tombs.

A wooden sign—old tourist infrastructure—still hangs on the wall: YOU ARE NOW 12 FEET BENEATH THE MODERN SIDEWALK. The sign is informative. The sidewalk above is still there. The modern world continues overhead while the buried world waits in darkness.

A recently excavated passage leads north, climbing slightly toward what appears to be a building's old foundation.`,
      x: -15,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: {
          to: 'buildings/merchants-cafe/z-1.ts:%OLD_FOUNDATION',
          description: 'An excavated passage leads up toward a building foundation',
        },
      },
    },
  },
};
