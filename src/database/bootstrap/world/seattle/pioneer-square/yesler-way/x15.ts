// 4th Ave S & Yesler Way
// Eastern boundary, gateway to the International District

export const room = {
  name: '4th Ave S & Yesler Way',
  description: `This is the edge of Pioneer Square, the boundary where one neighborhood ends and another begins. Fourth Avenue runs north and south, a river of cracked asphalt separating the historic district from the International District.

The difference is immediate. Signs in Chinese characters hang across the avenue, faded but still visible. Red lanterns are strung between buildings, their silk rotted to ribbons. The ornate Chinatown gate is visible a few blocks south, its paint peeling, its dragons watching the empty street with faded eyes.

A gas station occupies this corner. It has been here for decades, somehow surviving while everything around it changed. The pumps are old, the canopy stained, the convenience store dark behind security bars. A sign lists prices for gas that will never be pumped. The lottery machine inside still shows the jackpot from the last drawing. Nobody won.

Pioneer Square ends here. The International District begins. The boundary was always arbitrary, lines on a map drawn by people who are gone now. The neighborhoods have merged in their emptiness. One ruin is much like another.

The ornate Chinatown gate that once spanned the street lies across the intersection now, its dragons broken, its red paint scorched black. The posts that held it snapped during the Event. No one has moved it. It weighs tons. It will be here forever, blocking the way north, a monument to something that used to matter.`,
  x: 15,
  y: 10,
  z: 0,
  intersection: ['4th Ave S', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
