// Arterial Tunnel - Level z=-3 (North-South Express Route)
// Major underground artery running from Yesler Way (y=+12) to King Street (y=-12)
// A faster, less-trafficked route for those who know it exists

export const building = {
  name: 'Arterial Tunnel',
  x: 0,
  y: 0,
  width: 3,
  height: 25,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // NORTHERN SECTION (y=+10 to y=+6) - Connects to Yesler Underground
    // ═══════════════════════════════════════════════════════════════════════

    '%ARTERY_N1': {
      name: 'Northern Arterial Access',
      description: `A vertical shaft descends from the Yesler underground into a passage that feels different from the tunnels above—wider, more deliberately constructed, the walls showing the marks of professional excavation rather than opportunistic expansion. This is infrastructure, not adaptation.

The shaft is hidden behind what appears to be a collapsed section of the Yesler network, the rubble carefully arranged to conceal the opening while allowing passage. Those who know look for the ventilation—fresh air rises from below, betraying the route to anyone who pays attention.

The passage below runs straight south, a remarkable feature in an underground where every route seems to twist and turn. Someone built this for speed. Someone needed to move quickly between north and south.`,
      x: 0,
      y: 10,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/yesler-underground/z-2.ts',
          room: '%SECOND_YESLER',
          description: 'A concealed shaft rises toward the Yesler underground',
          hidden: true
        },
        south: '%ARTERY_N2'
      },
      objects: [
        { prototype: 'sign', name: 'a chalk arrow', description: 'A simple chalk arrow points south, the mark fresh. Someone maintains this waypoint.', boltedDown: true },
      ]
    },

    '%ARTERY_N2': {
      name: 'Northern Arterial',
      description: `The tunnel runs straight south through the earth, the construction professional and consistent. The walls are reinforced with steel beams at regular intervals, the ceiling arched to distribute pressure, the floor smooth enough for wheeled carts. This passage was built for logistics, not exploration.

The air moves steadily, drawn south by ventilation that creates a constant draft. The movement provides orientation in the darkness—follow the airflow to know your direction. The builders thought of everything.`,
      x: 0,
      y: 9,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%ARTERY_N1',
        south: '%ARTERY_N3'
      }
    },

    '%ARTERY_N3': {
      name: 'Northern Arterial',
      description: `The passage continues its relentless south course, the walls showing the same professional construction throughout. Distance markers appear at intervals—scratched numbers indicating progress along the route. The numbers count down as you travel south, suggesting a destination rather than an origin.`,
      x: 0,
      y: 8,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%ARTERY_N2',
        south: '%ARTERY_N4'
      }
    },

    '%ARTERY_N4': {
      name: 'Northern Arterial Junction',
      description: `The tunnel opens slightly here, the walls receding to create a junction where the arterial meets a cross-passage. The intersection is marked with symbols that combine directional arrows with territorial codes—a language that requires knowledge to read.

The cross-passage leads east and west, connecting the arterial to the transitional z=-3 network. The routes are less finished than the main tunnel, showing the rougher construction of later additions. The arterial came first. The connections came after.`,
      x: 0,
      y: 7,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_N3',
        south: '%ARTERY_N5',
        east: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%CABLE_VAULT',
          description: 'A rough passage leads east toward the cable vault'
        }      },
      objects: [
        { prototype: 'sign', name: 'directional markers', description: 'Chalk marks indicate: "↑YESLER ↓KING ←JUNCTION →CABLES". Someone has added a skull next to the western arrow.', boltedDown: true },
      ]
    },

    '%ARTERY_N5': {
      name: 'Northern Arterial',
      description: `The tunnel continues south past the junction, the construction returning to its consistent professional quality. The walls here show fewer marks—less traffic on this section, fewer hands touching the stone. The route is known but not heavily used.`,
      x: 0,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%ARTERY_N4',
        south: '%ARTERY_CENTER_N'
      }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CENTRAL SECTION (y=+5 to y=-5) - The main artery through Pioneer Square
    // ═══════════════════════════════════════════════════════════════════════

    '%ARTERY_CENTER_N': {
      name: 'Central Arterial North',
      description: `The tunnel reaches the northern edge of the central section, where the construction shows signs of greater investment. The walls are smoother here, the ceiling higher, the passage wide enough for two people to walk abreast. This section runs beneath the heart of Pioneer Square.

Sound carries strangely—footsteps from the networks above filter down as distant echoes, the vibration of the surface world transmitted through the earth. The arterial runs beneath it all, a hidden spine connecting the fragments of the underground.`,
      x: 0,
      y: 5,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_N5',
        south: '%ARTERY_CENTER_N2'      }
    },

    '%ARTERY_CENTER_N2': {
      name: 'Central Arterial',
      description: `The passage runs through what feels like the geographic center of the underground—equidistant from Yesler to the north and King Street to the south. The walls show the accumulated marks of decades, territorial symbols layered over distance markers over construction notations. The history of the underground is written here in chalk and scratch.`,
      x: 0,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_N',
        south: '%ARTERY_CENTER_N3'
      }
    },

    '%ARTERY_CENTER_N3': {
      name: 'Central Arterial',
      description: `The tunnel continues its steady course south, the walls showing increasing signs of moisture as the route descends slightly. Water seeps through hairline cracks, running in thin streams that pool in the floor's low points. The drainage is inadequate here—someone's maintenance has lapsed.`,
      x: 0,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_N2',
        south: '%ARTERY_HUB'
      }
    },

    '%ARTERY_HUB': {
      name: 'Arterial Hub',
      description: `The tunnel opens into a chamber that serves as the arterial's central junction—a space large enough to feel almost like a room, the ceiling domed overhead, the walls receding to create a gathering space in the otherwise linear passage. This is the heart of the route.

Passages branch in multiple directions: north and south along the main arterial, east toward the commercial underground, west toward the Gray Cartel territory. The east-west transit corridor also connects here, creating a true crossroads at the heart of the z=-3 network. The junction is neutral ground, the territorial marks carefully balanced to indicate shared space.

A ventilation shaft rises toward the surface, its grating hidden somewhere in Occidental Square. The shaft provides fresh air and, for those who can climb it, an emergency exit. The architects thought of everything.`,
      x: 0,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_N3',
        south: '%ARTERY_CENTER_S1',
        east: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%SLUICE_CHANNEL',
          description: 'A passage leads east toward the sluice channel'
        },
        west: {
          to: 'buildings/transit-corridor/z-3.ts',
          room: '%TRANSIT_CENTER',
          description: 'A passage leads west along the transit corridor'
        },
        up: {
          to: 'buildings/occidental-square/z0.ts',
          room: '%GALLERY',
          description: 'A narrow shaft rises toward the surface',
          hidden: true
        }
      },
      objects: [
        { prototype: 'bench', name: 'a stone bench', description: 'A rough stone bench carved from the wall, worn smooth by countless travelers resting here.', boltedDown: true },
        { prototype: 'sign', name: 'a route map', description: 'A detailed map is scratched into the wall, showing the arterial and its connections. Regular updates have created layers of information.', boltedDown: true },
        { prototype: 'sign', name: 'territorial markers', description: 'Carefully balanced symbols mark this as neutral ground. Cartel grey, Continuum blue, and independent marks all appear in equal measure.', boltedDown: true },
      ]
    },

    '%ARTERY_CENTER_S1': {
      name: 'Central Arterial',
      description: `The tunnel continues south from the hub, the passage returning to its standard dimensions. The walls show less traffic wear here—fewer people take the southern route, the attractions concentrated in the northern and central sections.

An iron ladder descends through a shaft in the floor, leading to the cistern network below.`,
      x: 0,
      y: 1,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_HUB',
        south: '%ARTERY_CENTER_S2',
        down: {
          to: 'buildings/deep-connector/z-4.ts',
          room: '%CISTERN_SHAFT',
          description: 'An iron ladder descends to the cistern network'
        }
      }
    },

    '%ARTERY_CENTER_S2': {
      name: 'Central Arterial',
      description: `The passage runs through a section where the construction shows stress—the ceiling supported by additional beams, the walls showing cracks that have been repeatedly patched. Something happened here. The structure was compromised and repaired. The scars remain.

A rough shaft descends through the damaged section, leading to the cistern north passage below.`,
      x: 0,
      y: 0,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_S1',
        south: '%ARTERY_CENTER_S3',
        down: {
          to: 'buildings/deep-connector/z-4.ts',
          room: '%CISTERN_N_PASSAGE',
          description: 'A rough shaft descends to the cistern passages'
        }
      }
    },

    '%ARTERY_CENTER_S3': {
      name: 'Central Arterial',
      description: `The tunnel continues south through stable construction, the stress of the section above left behind. The walls return to their professional smoothness, the ceiling arched and secure. The damaged section was an anomaly, not a pattern.`,
      x: 0,
      y: -1,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_S2',
        south: '%ARTERY_CENTER_S4'
      }
    },

    '%ARTERY_CENTER_S4': {
      name: 'Central Arterial Junction',
      description: `The passage opens into another junction, where the arterial meets routes connecting to the eastern and western underground networks. The intersection is smaller than the hub to the north, more functional, less communal. This is a transit point, not a gathering place.

A natural shaft descends through a crack in the floor, leading to caverns below.`,
      x: 0,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_S3',
        south: '%ARTERY_CENTER_S5',
        east: {
          to: 'buildings/chinatown-underground/z-2.ts',
          room: '%DEEP_PASSAGE',
          description: 'A passage leads east toward the Chinatown deep passage'
        },
        down: {
          to: 'buildings/deep-connector/z-4.ts',
          room: '%DEEP_CAVERN_N',
          description: 'A natural shaft descends into caverns',
          hidden: true
        }
      },
      objects: [
        { prototype: 'sign', name: 'direction markers', description: 'Chalk marks indicate routes: "↑HUB ↓KING →CHINATOWN". The Chinatown arrow has been reinforced with red paint.', boltedDown: true },
      ]
    },

    '%ARTERY_CENTER_S5': {
      name: 'Central Arterial',
      description: `The passage continues south toward the industrial sections, the walls showing the transition from commercial to freight infrastructure. The construction grows heavier, the passages wider, the dimensions scaled for cargo rather than people.`,
      x: 0,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_S4',
        south: '%ARTERY_S1'
      }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN SECTION (y=-4 to y=-10) - Connects to King Street Underground
    // ═══════════════════════════════════════════════════════════════════════

    '%ARTERY_S1': {
      name: 'Southern Arterial',
      description: `The tunnel enters the southern section, where the character shifts from mixed-use to industrial. The walls show the marks of heavy loads—scratches at cart height, worn patches where equipment has scraped past. This section serves freight as much as foot traffic.`,
      x: 0,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_CENTER_S5',
        south: '%ARTERY_S2',
        west: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%KV',
          description: 'A secured passage leads west toward the vault',
          hidden: true
        }
      }
    },

    '%ARTERY_S2': {
      name: 'Southern Arterial',
      description: `The passage runs through territory that vibrates with the rumble of trains overhead—the rail yards above making their presence felt through the earth. The walls hum at irregular intervals, the passage filling with subsonic pressure when heavy loads pass on the tracks.`,
      x: 0,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 30,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_S1',
        south: '%ARTERY_S3'
      }
    },

    '%ARTERY_S3': {
      name: 'Southern Arterial',
      description: `The tunnel continues south through the rail infrastructure zone, the construction showing the influence of industrial engineering. The steel beams are heavier here, the concrete thicker, the passage built to withstand the concentrated weight of the rail yards above.`,
      x: 0,
      y: -6,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%ARTERY_S2',
        south: '%ARTERY_S4'
      }
    },

    '%ARTERY_S4': {
      name: 'Southern Arterial Junction',
      description: `The passage opens into a junction where the arterial meets the deep sections of the King Street underground. The intersection is industrial in character—wide passages, heavy construction, the geometry of freight logistics rather than pedestrian movement.

Routes branch east toward the deep rail access and west toward the freight infrastructure. The arterial continues south toward its terminus beneath King Street.`,
      x: 0,
      y: -7,
      z: -3,
      population: 0,
      ambientNoise: 38,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ARTERY_S3',
        south: '%ARTERY_S5',
        east: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%DEEP_KING_MID',
          description: 'A passage leads east toward the deep King Street corridor'
        },
        west: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%DEEP_FREIGHT_MAIN',
          description: 'A passage leads west toward the freight infrastructure'
        }
      },
      objects: [
        { prototype: 'sign', name: 'a railway warning', description: 'A painted sign reads: "CAUTION - RAIL OPERATIONS OVERHEAD - EXPECT VIBRATION". The paint is industrial yellow, official.', boltedDown: true },
      ]
    },

    '%ARTERY_S5': {
      name: 'Southern Arterial',
      description: `The tunnel approaches its southern terminus, the passage narrowing as it reaches the limits of the arterial construction. The walls show the marks of unfinished work—tool marks that stop abruptly, supports that were never installed, the evidence of a project that was curtailed.`,
      x: 0,
      y: -8,
      z: -3,
      population: 0,
      ambientNoise: 30,
      lighting: 10,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%ARTERY_S4',
        south: '%ARTERY_TERMINUS'
      }
    },

    '%ARTERY_TERMINUS': {
      name: 'Southern Arterial Terminus',
      description: `The arterial ends here in a chamber that was clearly meant to continue but never did. The south wall shows the marks of excavation that stopped mid-work—picks left embedded in the stone, supports half-installed, the project abandoned for reasons the walls don't explain.

A shaft rises toward the King Street underground, connecting the arterial to the z=-2 network above. The shaft is the arterial's southern access point, the mirror of the concealed entrance beneath Yesler Way to the north.

Water seeps through the unfinished walls more heavily here, the incomplete construction offering less resistance to the water table. Pumps hum in the corners, fighting a constant battle to keep the terminus passable.`,
      x: 0,
      y: -9,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%ARTERY_S5',
        up: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%SECOND_AVE_SOUTH',
          description: 'A shaft rises toward the King Street underground'
        }
      },
      objects: [
        { prototype: 'sign', name: 'abandoned tools', description: 'Rusted picks and shovels lean against the wall, left where workers dropped them decades ago.', boltedDown: true },
        { prototype: 'furniture', name: 'a sump pump', description: 'An electric pump hums steadily, drawing water from a collection basin and pushing it into drainage pipes.', boltedDown: true },
        { prototype: 'sign', name: 'a construction date', description: 'Carved into the wall: "WPA 1937 - SUSPENDED". The Works Progress Administration built this. The Depression ended it.', boltedDown: true },
      ]
    }
  }
};
