// The Junction - main hub on West Spine
// Central point of the underground network

export const room = {
  name: 'The Junction',
  description: `Three tunnels converge here in what was once an underground intersection—the buried crossing of two forgotten streets that the city paved over more than a century ago. The ceiling rises higher here, nearly twelve feet, the additional clearance created when workers removed the wooden decking that once formed the new street level above. Brick pillars support the weight of modern Seattle overhead, their surfaces worn smooth by generations of hands brushing past in the darkness.

The walls retain fragments of their commercial past. Faded paint advertises businesses that burned in 1889: a hardware store, a dry goods merchant, a boarding house. The signs were preserved by the darkness, protected from the sun that bleached their cousins on the surface. Now they're the only record that these places existed at all—ghost advertisements for ghost businesses, selling nothing to no one.

Chalk marks cluster in the corners—directional symbols, territorial indicators, warnings in codes that require knowing. The marks overlap in layers, older symbols partially obscured by newer ones, a palimpsest of passage and purpose. Someone uses this space. Many someones, over many years.`,
  x: -14,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 20,
  waterLevel: 0,
  outdoor: false,
  exits: {
    down: {
      prototype: 'guardedExit',
      allowedFaction: 'Gray Cartel',
      denyMessage: 'A heavy padlock secures the hasp. You lack the combination.',
      description: 'A heavy iron grate covers a vertical shaft.',
    },
  },
};
