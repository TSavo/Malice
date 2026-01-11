// Waterfront - between Yesler Way and S. Washington St

export const room = {
  name: 'Alaskan Way',
  description: `The waterfront stretches along the edge of Elliott Bay, a narrow strip of concrete and decay between the water and the city. The seawall here is holding, mostly. Cracks spider across its surface but the fill behind it hasn't slumped yet. Small victories.

A derelict pier juts into the bay, its planks rotted through in places, its pilings wrapped in barnacles and rust. A sign advertises harbor tours. The tour boats are gone, sunk or stolen or simply drifted away.

The elevated highway that once shadowed this stretch was torn down years ago. The city called it progress. Now the open sky just means there's nothing between you and the grey clouds rolling in off the Sound.

To the east, the Fabrication Factory looms—a massive industrial complex that converted an old transport warehouse into AI-controlled infrastructure manufacturing. Glass doors mark the public entrance, where citizens can order replacement pipes, electrical panels, and the endless components that keep the city's systems running. The factory never sleeps; the hum of machinery is audible even from here. Beyond it, Smith Tower rises above the brick buildings of Pioneer Square, watching as it always has.

To the west, Elliott Bay offers nothing but grey water and the distant promise of shores you cannot reach—not without a boat, and the boats are gone or sunk or someone else's problem now.`,
  x: -21,
  y: 10,
  z: 0,
  // Environmental properties

  imageOnDisk: 'alaskan-way-x-21-y10-z0.png',
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  exits: {
    east: {
      to: 'buildings/fabrication-factory/z0.ts#%PUBLIC_SERVICES',
      prototype: 'guardedExit',
      allowedFaction: 'Citizen',
      denyMessage:
        'The glass doors remain locked. A speaker crackles: "Citizens only."',
      description: 'Glass doors lead into the Fabrication Factory',
    },
  },
};
