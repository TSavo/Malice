// Yesler Way at the Waterfront Edge
// Western terminus where the street meets Elliott Bay

export const room = {
  name: 'Yesler Way at Waterfront',
  description: `Yesler Way ends here at a crumbling seawall. Or maybe it begins here. Hard to say. The water beyond is grey and still, broken only by the rusted hulks of cargo ships listing in the harbor. They have been there a long time.

The seawall itself is cracked, chunks of concrete tumbled down into the water. Rebar pokes out at angles like broken bones. A faded sign warns of unstable ground, but the sign itself is barely standing.

This is where Seattle began. Henry Yesler built his sawmill here in 1853. The mill is long gone. So is most everything else. A historical marker lies face-down in the weeds, its post snapped at the base.

The street rises eastward, climbing into what remains of Pioneer Square.

To the north, a narrow gap where the seawall cracked and the fill subsided. It is the only way through to Downtown now. The other crossings are gone, buried under rubble or blocked by collapsed buildings where the two street grids collided and failed together. This gap along the water is all that remains. Fitting. The city began here. It ends here too.`,
  x: -15,
  y: 10,
  z: 0,
  intersection: ['Waterfront', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
