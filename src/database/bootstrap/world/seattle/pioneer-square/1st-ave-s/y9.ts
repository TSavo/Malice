// 1st Ave S - south of Smith Tower entrance

export const room = {
  name: '1st Ave S',
  description: `Smith Tower's white terra cotta facade rises to the north, its ground floor windows dark and unwelcoming. This stretch of 1st Ave runs along the tower's western face—thirty-eight stories of Edwardian ambition casting a permanent shadow over the street below.

The sidewalk here is cracked but clear, the debris from the collapse having been pushed aside at some point to create a narrow passage. A service entrance to the tower is visible nearby, utilitarian compared to the grand lobbies on the north side. CONTINUUM BANKING reads a small placard beside the door.

To the west, City Services occupies what was once a bank building—the kind of early twentieth century architecture that Seattle built when it still believed in permanence. CITY SERVICES is painted on the glass in municipal lettering. The lights are on inside.`,
  x: -14,
  y: 9,
  z: 0,
  // Environmental properties

  imageOnDisk: '1st-ave-s-x-14-y9-z0.png',
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
  exits: {
    west: {
      to: 'buildings/city-services/z0.ts#%ENTRY',
      description: 'Glass doors lead into City Services',
    },
  },
};
