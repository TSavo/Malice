// Smith Tower - Floor 3 (z=3)
// Unfinished floor - infrastructure pending

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%P' },
    },

    '%P': {
      name: 'Smith Tower - 3rd Floor - Under Construction',
      description: `An unfinished floor with exposed concrete and hanging cables. The space is empty, echoing. Plastic sheeting covers unfinished walls. Construction materials stacked in corners - unopened, waiting for workers who haven't arrived.

The floor is bare concrete, dusty. Overhead, fluorescent work lights cast harsh shadows. The air smells of sawdust and drywall compound. Everything is paused mid-construction.

A sign on the wall reads: FLOOR 3 - COMPLETION PENDING - CONTINUUM DEVELOPMENT.`,
      x: -12,
      y: 10,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        in: '%E',
      },
      elevatorId: '%E',
    },
  },
};
