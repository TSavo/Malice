// Supply Depot Basement - z=-1 access point
// Connects depot loading dock (z=0) to underground tunnels (z=-2)

export const room = {
  name: 'Supply Depot Basement',
  description: `The basement of the Supply Depot was designed for cold storage—thick walls, minimal ventilation, a constant temperature maintained by the earth itself. The refrigeration units that once hummed along the ceiling have been silent for years, their copper coils green with oxidation, their compressors seized. The cold remains regardless, seeping up from the stone floor, settling into the walls like a permanent resident.

Dust coats the concrete floor in uneven patterns—thick in the corners, absent along certain paths that see regular traffic. The wear marks tell their own story, footprints leading toward the northwest corner where an iron hatch is set into the floor. The hatch's edges are swept clean. Its hinges gleam with recent oil. Whatever passes through here moves in secret.

The air that rises from below is colder still, carrying the mineral smell of deep earth and the faint undertone of water that has traveled through stone. The darkness beneath is absolute—the kind of dark that existed before electricity, before gas lamps, before the city learned to push back the night.`,
  x: -20,
  y: -5,
  z: -1,
  population: 0,
  ambientNoise: 15,
  lighting: 25,
  waterLevel: 0,
  outdoor: false,
};
