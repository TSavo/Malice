// 3rd Ave S - between S. Washington St and S. Main St

export const room = {
  name: '3rd Ave S',
  description: `The Corp Construction zone's eastern edge meets 3rd Avenue here. The main gate stands to the west, a double-wide chain-link entrance meant for vehicle access, topped with razor wire that catches the light. A billboard visible inside the fence announces "FUTURE HOME OF CONTINUUM CIVIC CENTER - A Better Tomorrow, Today." Armed guards patrol inside the perimeter, their weapons and posture suggesting military training rather than rent-a-cop boredom.

The courthouse steps rise across the avenue, granite worn smooth by generations of defendants and lawyers and witnesses and everyone else who passed through the justice system. The steps lead to bronze doors that stand slightly ajar. Someone went inside. Whether they came out is unknown.

A statue stands at the base of the steps, a robed figure holding scales. The scales are balanced. They were always balanced. That was the promise. The statue's bronze has gone green with verdigris, giving the figure a sickly pallor.

Main Street stretches east and west, empty and wide.`,
  x: 7,
  y: 1,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  exits: {
    west: {
      to: 'buildings/corp-construction/z0.ts:%GATE_ENTRANCE',
      description: 'The Corp Construction gate looms on the west side of the avenue',
    },
  },
};
