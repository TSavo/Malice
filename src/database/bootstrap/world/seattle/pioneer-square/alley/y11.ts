// Alley - north end near Yesler Way

export const room = {
  name: 'Alley',
  description: `The alley's north end, where the passage opens toward Yesler Way. Light returns here, the gap between buildings widening as rooflines step back. The pavement is less damaged, the debris less accumulated—closer to the main street, closer to whatever passes for maintenance in this part of the city.

A faded mural covers the Immigration Services wall, barely visible beneath decades of grime and newer graffiti. The original image might have been civic—figures shaking hands, a ship in harbor, the promise of arrival. Now it's just shapes and suggestions, history painted over by history.

The Fabrication Factory's loading bay is visible through a gap in the fence to the west, trucks and conveyors moving materials in and out. The factory doesn't sleep. The alley catches the runoff of its operations—noise, heat, the occasional worker taking a shortcut. Life passes through. Nothing stays.`,
  x: -17,
  y: 11,
  z: 0,
  population: 0,
  ambientNoise: 30,
  lighting: 70,
  waterLevel: 0,
  outdoor: true,
  exits: {
    west: {
      to: 'buildings/fabrication-factory/z0.ts#%SECURITY',
      prototype: 'guardedExit',
      allowedFaction: 'Citizen',
      denyMessage:
        'A retinal scanner beside the reinforced door flashes red. "Security personnel only."',
      description: 'A reinforced security door leads into the Fabrication Factory',
    },
  },
};
