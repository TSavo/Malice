// Transit Corridor - Level z=-3 (East-West Express Route)
// Parallel route connecting western Gray Cartel territory to eastern underground
// Bypasses the congested z=-2 Occidental corridor

export const building = {
  name: 'Transit Corridor',
  x: -10,
  y: 2,
  width: 18,
  height: 1,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // WESTERN SECTION (x=-16 to x=-10) - Gray Cartel Territory Access
    // ═══════════════════════════════════════════════════════════════════════

    '%TRANSIT_W1': {
      name: 'Western Transit Access',
      description: `A narrow passage branches from the Cartel's supply routes, descending slightly as it runs east. The construction here bears the marks of Cartel engineering—professional excavation, reinforced supports, the infrastructure of an organization that plans for permanence.

The passage is monitored but not guarded, the territorial marks subtle rather than aggressive. This is a transit route, not a defensive position. Movement is expected. Movement is permitted, for those who belong.

The air carries the chemical scent of the workshop to the north—solder and heated metal drifting through ventilation that connects the spaces.`,
      x: -16,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%SW',
          description: 'A shaft rises toward the Spark Workshop',
          hidden: true
        },
        east: '%TRANSIT_W2'
      },
      objects: [
        { prototype: 'sign', name: 'Cartel markers', description: 'Subtle grey chalk marks indicate Cartel territory. The marks are maintained, refreshed regularly.', boltedDown: true },
      ]
    },

    '%TRANSIT_W2': {
      name: 'Western Transit Corridor',
      description: `The corridor runs straight east through territory that feels abandoned despite the Cartel presence. The walls show older construction beneath the Cartel modifications—Victorian brick emerging through poured concrete, the layered history of Seattle's underground.

Sound carries strangely here, footsteps echoing in ways that make distance hard to judge. The acoustic properties are probably natural, but they serve security purposes regardless.`,
      x: -15,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRANSIT_W1',
        east: '%TRANSIT_W3'
      }
    },

    '%TRANSIT_W3': {
      name: 'Western Transit Corridor',
      description: `The corridor continues through a section where the ceiling is higher, the walls farther apart—a natural cavern that the tunneling happened to intersect. The excavators incorporated the space rather than filling it, using the extra room for a staging area that shows evidence of regular use.

Crates and containers line the walls, their contents unknown but their presence indicating logistics. Things move through here. Things are stored here, temporarily, between movements.`,
      x: -14,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%TRANSIT_W2',
        east: '%TRANSIT_W4'
      },
      objects: [
        { prototype: 'crate', name: 'unmarked crates', description: 'Wooden crates without markings, their contents sealed and unknown. The crates show handling marks—moved frequently, stored briefly.', boltedDown: false },
      ]
    },

    '%TRANSIT_W4': {
      name: 'Transit Junction West',
      description: `The corridor reaches a junction where the east-west route intersects with passages running north and south. The intersection is marked with direction symbols—arrows and codes that guide those who know how to read them.

The junction shows heavier traffic than the corridor, the floor worn smooth by feet traveling in multiple directions. This is a crossroads, a node in a network that spans the underground.`,
      x: -12,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 22,
      lighting: 18,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%TRANSIT_W3',
        east: '%TRANSIT_W5',
        north: {
          description: 'A shaft rises toward the Yesler deep passage'
        }
      },
      objects: [
        { prototype: 'sign', name: 'direction codes', description: 'Chalk symbols indicate routes: arrows with numbers, letters that mean something to someone. The code is maintained but not explained.', boltedDown: true },
      ]
    },

    '%TRANSIT_W5': {
      name: 'Western Transit Corridor',
      description: `The corridor runs through a section of older construction, the walls showing the rough-hewn character of nineteenth-century excavation. The transit route appropriated this older passage, widening it where necessary but preserving the original architecture where possible.

Water seeps through the walls at this depth, the moisture collected in channels that run along the floor toward drainage points. The water management is functional but not elegant—an ongoing battle against the water table.`,
      x: -10,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%TRANSIT_W4',
        east: '%TRANSIT_CENTER'
      }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CENTRAL SECTION (x=-8 to x=-4) - Neutral Zone
    // ═══════════════════════════════════════════════════════════════════════

    '%TRANSIT_CENTER': {
      name: 'Transit Hub',
      description: `The corridor opens into a larger chamber that serves as the central hub of the east-west transit route. The space is deliberately neutral, the territorial markers carefully balanced—Cartel grey on one wall, Continuum blue on another, independent symbols scattered between. This is shared space.

The hub connects to the north-south arterial, creating a crossroads at the heart of the z=-3 network. Travelers moving in any direction pass through here, making it both valuable and vulnerable. Conflicts would close the routes for everyone.

A notice board on one wall holds papers that flutter in the ventilation draft—messages, announcements, the written communication of the underground. The papers are changed regularly. The information flows.`,
      x: -8,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 28,
      lighting: 22,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%TRANSIT_W5',
        east: '%TRANSIT_E1',
        north: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_HUB',
          description: 'A passage leads north to the arterial hub'
        },
        south: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_CENTER_S1',
          description: 'A passage leads south along the arterial'
        }
      },
      objects: [
        { prototype: 'sign', name: 'a notice board', description: 'A board covered with papers: messages, announcements, requests for trade. The papers are dated, removed when outdated. Someone curates this.', boltedDown: true },
        { prototype: 'bench', name: 'a waiting bench', description: 'A rough wooden bench against the wall, worn smooth by travelers resting between routes.', boltedDown: true },
        { prototype: 'sign', name: 'balanced territorial markers', description: 'Chalk marks on opposing walls: grey Cartel symbols, blue Continuum marks, neutral independent tags. The balance is deliberate, maintained.', boltedDown: true },
      ]
    },

    '%TRANSIT_E1': {
      name: 'Eastern Transit Corridor',
      description: `The corridor continues east from the hub, the construction transitioning from Cartel-influenced to independent. The walls show less organization, more improvisation—passages widened by whoever needed them wider, supports added where failures threatened.

The traffic here is lighter than at the hub, the eastern routes less traveled than the western. The underground is denser to the west, sparser to the east. The traffic patterns reflect the population.`,
      x: -6,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRANSIT_CENTER',
        east: '%TRANSIT_E2'
      }
    },

    '%TRANSIT_E2': {
      name: 'Eastern Transit Corridor',
      description: `The corridor runs through a section where utility infrastructure crosses the passage—pipes and conduits emerging from one wall and disappearing into another, the buried infrastructure of the city intersecting the underground network.

The utility crossing creates a natural landmark, a reference point in passages that otherwise blur together. Travelers describe locations relative to "the pipe junction" or "where the cables cross."`,
      x: -4,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 22,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRANSIT_E1',
        east: '%TRANSIT_E3'
      },
      objects: [
        { prototype: 'furniture', name: 'utility crossing', description: 'Pipes and conduits cross the passage, emerging from one wall and entering the other. The infrastructure predates the tunnel—the tunnel was cut around it.', boltedDown: true },
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN SECTION (x=-2 to x=+6) - Connects to Eastern Underground
    // ═══════════════════════════════════════════════════════════════════════

    '%TRANSIT_E3': {
      name: 'Transit Junction East',
      description: `The corridor reaches an eastern junction where routes branch toward different sections of the underground. The junction is smaller than the central hub, more functional, a transit point rather than a gathering place.

Routes lead east toward the commercial underground and south toward the Chinatown network. The junction serves as the gateway between the transit corridor and the established eastern passages.`,
      x: -2,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRANSIT_E2',
        east: '%TRANSIT_E4',
        south: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%CABLE_VAULT',
          description: 'A passage leads south toward the cable vault'
        }
      }
    },

    '%TRANSIT_E4': {
      name: 'Eastern Transit Corridor',
      description: `The corridor approaches the connection with the established eastern underground, the construction showing the influence of more recent modification. The walls are smoother, the passage more regular, the infrastructure of the twentieth century replacing the improvisation of the nineteenth.`,
      x: 0,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%TRANSIT_E3',
        east: '%TRANSIT_E5',
        north: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_CENTER_N2',
          description: 'A passage connects to the arterial'
        }
      }
    },

    '%TRANSIT_E5': {
      name: 'Eastern Transit Corridor',
      description: `The corridor runs through the final section before the eastern terminus, the passage descending slightly as it approaches the connection with the steam tunnel network. The air grows warmer here, heated by the industrial infrastructure that still functions beneath the eastern hill.`,
      x: 2,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRANSIT_E4',
        east: '%TRANSIT_TERMINUS'
      }
    },

    '%TRANSIT_TERMINUS': {
      name: 'Eastern Transit Terminus',
      description: `The transit corridor ends here at a connection with the eastside underground steam tunnels. The terminus is marked by the transition from excavated passage to industrial infrastructure—rough stone giving way to concrete and steel, the underground network meeting the utility systems.

A vertical shaft rises toward the steam tunnels at z=-2, providing access to the eastern network. The shaft is warm, heated by the steam pipes that give the eastern tunnels their name.

The construction here is newer than the transit corridor, added to connect the transit route to the established eastern infrastructure. The connection was intentional, planned, part of an expansion that linked previously separate networks.`,
      x: 4,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 30,
      lighting: 18,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%TRANSIT_E5',
        up: {
          description: 'A warm shaft rises toward the steam tunnels'
        }
      },
      objects: [
        { prototype: 'sign', name: 'a connection plaque', description: 'A small metal plaque reads: "TRANSIT EXTENSION - COMPLETED 2019". Someone documented their work.', boltedDown: true },
        { prototype: 'furniture', name: 'a steam vent', description: 'A vent in the wall releases warmth from the steam tunnels above. The heat makes this corner comfortable in winter.', boltedDown: true },
      ]
    }
  }
};
