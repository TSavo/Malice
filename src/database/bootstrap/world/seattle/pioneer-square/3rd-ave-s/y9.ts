// 3rd Ave S - between S. Washington and Yesler Way

export const room = {
  name: '3rd Ave S',
  description: `Third Avenue dead-ends here at a wall of rubble. The collapsed building's debris has completely buried the road to the south—a two-story mountain of brick, concrete, and twisted steel blocking all passage toward Washington Street. The seven-story structure pancaked during the burning and spread outward, swallowing this entire stretch of Third Avenue.

To the west, the Pioneer Building rises in solid contrast—six stories of Richardsonian Romanesque sandstone and brick that survived the Great Fire, the earthquakes, and whatever brought down its less fortunate neighbors. The building's eastern facade shows the same rugged stonework as its famous entrance, though from this side you're looking at the back—the main triple-arched portal faces 2nd Ave S on the other side. The building's service corridor and loading dock are accessible from this direction.

To reach Washington or points south, you'll have to go around via Yesler Way and take 4th Avenue down. The detour adds blocks to any journey, but the alternative is climbing gear and questionable life choices.

The smell of old fire lingers in the debris, decades of rain unable to wash away completely the char and ash that permeated the rubble. Hardy shrubs have found purchase in the destruction, green life emerging from the grave of the building. Yesler Way lies just ahead to the north, still passable.`,
  x: 7,
  y: 9,
  z: 0,

  imageOnDisk: '3rd-ave-s-x7-y9-z0.png',
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
  exits: {
    west: {
      to: 'buildings/pioneer-building/z0.ts',
      room: '%SERVICE_CORRIDOR',
      description: 'A path through the debris leads to the Pioneer Building service entrance',
    },
  },
};
