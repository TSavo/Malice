// S. Washington St - east of 3rd Ave

export const room = {
  name: 'S. Washington St',
  description: `East of Third, Washington Street becomes a corridor cut alongside ruin. The north sidewalk is gone in places, replaced by a talus of brick and shattered concrete that has been settling for decades, every winter rain dragging a little more of the Collapsed Building down toward the street.

Someone once tried to tame the slope—sandbags, plywood, the kind of improvisation that made sense during the first years after The Burning when everyone thought this was temporary. The sandbags have rotted into grit. The plywood is soft with moss. The street is what remains: a narrow strip of asphalt where you can still walk, if you keep to the south side and don’t linger under the overhangs.

A row of dark storefronts faces the rubble, their plate glass long since broken out, interiors stripped down to studs. The emptiness feels curated by time: everything useful taken during the Long Dark, everything else left to weather into sameness.`,
  x: 8,
  y: 6,
  z: 0,
  // Environmental properties
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [
    { prototype: 'lamppost', name: 'Street Lamp' },
  ],
};
