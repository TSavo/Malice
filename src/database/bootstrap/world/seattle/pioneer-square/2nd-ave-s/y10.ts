// 2nd Ave S - beside Smith Tower

export const room = {
  name: '2nd Ave S',
  description: `SMITH TOWER rises to the west, its white glazed brick facade gleaming even in overcast light. The building's ornate terra cotta ornamentation—eagles, scrollwork, classical motifs—decorates the lower floors, while the upper stories climb in graduated setbacks to the distinctive terracotta pyramid crown. Glass doors on the west side of the street lead into the tower's ground floor bank.

A fire truck sits at the edge of the debris field to the north, Ladder Company 10's rig, its cherry-red paint dulled by dust but still visible. The ladder is extended at full reach, pointing at the rubble pile that blocks Yesler Way. The cab doors are open. The engine is silent. The firefighters left their equipment behind when they left.

Orange plastic fencing stretches across the northern part of the street, zip-tied to T-posts. DANGER KEEP OUT the fence says in repeated white letters. UNSTABLE STRUCTURE. The rubble from collapsed buildings still blocks the way to downtown.`,
  x: 0,
  y: 10,
  z: 0,
  // Environmental properties

  imageOnDisk: '2nd-ave-s-x0-y10-z0.png',
  population: 0, // Empty (post-Event)
  ambientNoise: 10, // Wind against tower
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  exits: {
    north: '2nd-ave-s/y11.ts',
    south: '2nd-ave-s/y9.ts',
    west: {
      to: 'buildings/smith-tower/z0.ts',
      room: '%4',
      description: 'Glass doors lead into Smith Tower',
    },
  },
};
