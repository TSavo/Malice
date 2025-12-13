// 3rd Ave S & S. Jackson St intersection

export const room = {
  name: '3rd Ave S & S. Jackson St',
  description: `Third Avenue intersects S. Jackson Street at the eastern edge of the Corp Construction zone, the maintained fence terminating at the cross-street. East of here, the International District continues in its abandoned form—the contrast between Corp's active site and the neighborhood's decay creating a sharp visual boundary. One side alive with construction noise. The other side silent.

A Metro bus stop occupies the northeast corner, the standard infrastructure of Seattle's transit system: a shelter with transparent walls clouded by age, a bench inside, the route information panel listing buses that haven't run in fifty-five years. The location connected the International District to the rest of the city—Chinatown to Capitol Hill, the U District, neighborhoods beyond. All equally empty now, connected by routes no bus travels.

The buildings at this intersection span eras, all arriving at the same destination: a 1920s brick structure on the southwest corner, decorative detail weathered but visible; a 1970s concrete box to the northeast, functional and crumbling; and the Corp Construction fence to the northwest, new and maintained, the only thing here that isn't dying.`,
  x: 7,
  y: -6,
  z: 0,
  intersection: ['3rd Ave S', 'S. Jackson St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
