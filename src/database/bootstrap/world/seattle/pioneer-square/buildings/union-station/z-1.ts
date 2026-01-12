// Union Station - Platform Level (z=-1)
// Train platforms below the main hall

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // PLATFORM LEVEL (z=-1) - TRAIN PLATFORMS
    // ═══════════════════════════════════════════════════════════════════

    '%PLATFORM_STAIRS': {
      name: 'Union Station - Platform Stairs',
      description: `A wide staircase descends from the grand hall to the platform level, its treads of concrete worn smooth by generations of travelers. The walls are tiled in white ceramic, subway-style, practical rather than decorative. The contrast with the Beaux-Arts grandeur above is stark—down here, function trumped form.

Emergency lights are mounted at intervals, their batteries long dead, their purpose obsolete. The lighting that remains comes from skylights set into the platform ceiling, grimy windows that admit gray filtered light from the street level above.

A sign at the top of the stairs once listed destinations: PORTLAND, SPOKANE, CHICAGO. The sign is faded now, its letters barely visible, pointing the way to trains that no longer run.`,
      x: -5,
      y: -6,
      z: -1,
      imageOnDisk: 'union-station-platform-stairs-x-5-y-6-z-1.png',
      population: 0,
      ambientNoise: 10,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%GRAND_HALL_N',
        south: '%PLATFORM_C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'destination sign',
          aliases: ['sign', 'destinations'],
          description: `A faded sign listing destinations reachable from Union Station: PORTLAND, SPOKANE, CHICAGO, MINNEAPOLIS, and more. The letters are hand-painted, their colors muted by decades of grime. The sign promised connections to the nation. The promises faded with the paint.`,
        },
      ],
    },

    '%PLATFORM_W': {
      name: 'Union Station - West Platform',
      description: `The western platform, where tracks once received trains from the south. The platform is concrete, cracked and stained, with a yellow safety line painted along its edge—the line faded to cream, the safety it warned of no longer relevant.

The track bed is visible below, its rails rusted to a dark brown, weeds growing between the ties. No train has passed this way in years. The infrastructure of the railroad remains—signals, switches, the overhead catenary for electric locomotives—but all of it is dead, frozen at whatever position it held when the power failed.

Benches line the platform, their wooden slats rotted through in places. Passengers once sat here, watching for the headlight that announced their train's arrival. The watching has stopped. The benches remain.`,
      x: -7,
      y: -7,
      z: -1,
      imageOnDisk: 'union-station-west-platform-x-7-y-7-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%SERVICE_CORRIDOR',
        east: '%PLATFORM_C',
        north: '%PLATFORM_END_W',
      },
      sittables: [
        {
          name: 'a platform bench',
          capacity: 4,
          emptyMsg:
            'Wooden benches line the platform, their slats rotted in places but still usable.',
          occupiedMsg:
            '%s sitting on a platform bench, facing the empty tracks',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'rusted tracks',
          aliases: ['tracks', 'rails', 'railroad'],
          description: `Railroad tracks stretch into the darkness of the tunnel, their rails rusted to a deep brown, weeds growing between the wooden ties. The tracks once carried passengers to Portland, to San Francisco, to destinations across the nation. The destinations still exist. The tracks no longer connect to them.`,
        },
        {
          prototype: 'describable',
          name: 'dead signals',
          aliases: ['signals', 'railroad signals'],
          description: `Railroad signals stand at intervals along the platform, their lights dark, their mechanisms frozen. The signals once told engineers when to proceed, when to slow, when to stop. The commands they gave were absolute. Now they give no commands at all, monuments to a system that no longer operates.`,
        },
      ],
    },

    '%PLATFORM_C': {
      name: 'Union Station - Central Platform',
      description: `The central platform, the main waiting area for passengers boarding trains. The platform is wide here, designed to handle the crowds that once gathered for departures. A clock hangs overhead, its hands frozen at 11:47, the moment when it stopped counting time.

Information boards line the walls, their split-flap displays frozen mid-rotation. TRACK 3 - PORTLAND - ON TIME reads one. TRACK 5 - CHICAGO - DELAYED reads another. The delays became permanent. The departures never came.

A newsstand kiosk occupies one corner, its windows dark, its merchandise rotted or looted. The stand sold newspapers, magazines, snacks—the provisions for long journeys. The journeys ended. The kiosk remains, a shell of commercial convenience.`,
      x: -5,
      y: -7,
      z: -1,
      imageOnDisk: 'union-station-central-platform-x-5-y-7-z-1.png',
      population: 0,
      ambientNoise: 8,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PLATFORM_STAIRS',
        west: '%PLATFORM_W',
        east: '%PLATFORM_E',
        south: '%PLATFORM_END_C',
      },
      sittables: [
        {
          name: 'a central platform bench',
          capacity: 6,
          emptyMsg:
            'Long benches line the platform center, positioned for viewing the departure boards.',
          occupiedMsg:
            '%s sitting on the central platform, watching the frozen departure boards',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'frozen clock',
          aliases: ['clock', 'station clock'],
          description: `A large clock hangs from the platform ceiling, its face round and white, its hands frozen at 11:47. The clock was the platform's heartbeat, marking the minutes until departure, counting down the seconds until trains arrived. The heartbeat stopped. The hands point at a moment that no longer matters.`,
        },
        {
          prototype: 'describable',
          name: 'departure boards',
          aliases: ['boards', 'information boards', 'split-flap'],
          description: `Split-flap departure boards, their letters and numbers frozen mid-rotation. TRACK 3 - PORTLAND - ON TIME. TRACK 5 - CHICAGO - DELAYED. The boards were the voice of the railroad, announcing arrivals and departures, guiding passengers to their trains. The voice went silent. The messages remain, promising trains that will never come.`,
        },
        {
          prototype: 'describable',
          name: 'abandoned kiosk',
          aliases: ['kiosk', 'newsstand'],
          description: `A newsstand kiosk, its windows dark, its interior visible through grimy glass. Empty racks that held magazines. Shelves where candy bars displayed. A cash register, its drawer open and empty. The kiosk served travelers' last-minute needs. The travelers stopped coming. The needs went unmet.`,
        },
      ],
    },

    '%PLATFORM_E': {
      name: 'Union Station - East Platform',
      description: `The eastern platform, serving tracks that connected to the Great Northern route—the empire builder line that once ran to Chicago. The platform is narrower here, designed for secondary traffic, though "secondary" still meant thousands of passengers per day.

A baggage cart sits abandoned near the platform edge, its wheels rusted in place, its bed empty. Porters once pushed these carts, hauling trunks and suitcases between trains and the baggage claim above. The porters are gone. The cart waits for luggage that won't arrive.

The tunnel mouth is visible at the platform's north end, a dark arch leading to tracks that run beneath the city. The darkness is complete—no lights, no signals, just the void where trains once emerged.`,
      x: -4,
      y: -7,
      z: -1,
      imageOnDisk: 'union-station-east-platform-x-4-y-7-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PLATFORM_C',
        north: '%PLATFORM_END_E',
      },
      sittables: [
        {
          name: 'an east platform bench',
          capacity: 3,
          emptyMsg:
            'Wooden benches offer seating along the narrower eastern platform.',
          occupiedMsg: '%s sitting on the eastern platform bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'abandoned baggage cart',
          aliases: ['cart', 'baggage cart', 'luggage cart'],
          description: `A metal baggage cart, its wheels rusted in place, its bed empty. The cart is industrial—built for heavy loads, for the trunks and suitcases that travelers once brought on long journeys. Porters pushed these carts at a near-run, racing to transfer bags between trains. The racing stopped. The cart rusted.`,
        },
        {
          prototype: 'describable',
          name: 'tunnel entrance',
          aliases: ['tunnel', 'dark tunnel'],
          description: `The tunnel mouth opens at the platform's end, a dark arch perhaps thirty feet wide and twenty feet tall. Rails lead into the darkness, their surfaces visible for a few yards before the light fails. Trains once emerged from this darkness, their headlights announcing arrival. No lights shine now. The darkness is complete.`,
        },
      ],
    },

    '%PLATFORM_END_W': {
      name: 'Union Station - West Platform End',
      description: `The northern end of the west platform, where the concrete narrows to a service walkway. The tracks continue into the tunnel, disappearing into darkness that swallows light and sound. A maintenance door is set into the tunnel wall, its surface covered in warning signs: AUTHORIZED PERSONNEL ONLY, DANGER - ELECTRIFIED RAIL.

The electrified rail warning is obsolete—no power has run through the third rail in years—but the danger signs remain, warnings against a hazard that no longer exists. The tunnel beyond leads to the rail yards south of the city, miles of track and switching infrastructure that connected Union Station to the national rail network.

Water stains mark the tunnel walls, mineral deposits tracing the paths of decades of seepage. The tunnel is damp, the air cool, the smell of old stone and rusted metal.`,
      x: -7,
      y: -6,
      z: -1,
      imageOnDisk: 'union-station-west-platform-end-x-7-y-6-z-1.png',
      population: 0,
      ambientNoise: 15,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PLATFORM_W',
        east: '%MAINTENANCE_TUNNEL',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'maintenance door',
          aliases: ['door', 'service door'],
          description: `A steel door set into the tunnel wall, its surface covered in warning signs and safety notices. The door leads to maintenance passages, the hidden infrastructure that kept the railroad running. The door is locked or jammed—it doesn't move when pushed. Whatever lies beyond is inaccessible without tools.`,
        },
        {
          prototype: 'describable',
          name: 'obsolete warnings',
          aliases: ['signs', 'warning signs', 'danger signs'],
          description: `Warning signs cover the maintenance door and nearby walls: AUTHORIZED PERSONNEL ONLY, DANGER - ELECTRIFIED RAIL, HARD HAT AREA. The warnings are obsolete—no electricity, no personnel, no need for hard hats. They warn against hazards that no longer exist, their authority undermined by the silence of the rails.`,
        },
      ],
    },

    '%PLATFORM_END_C': {
      name: 'Union Station - Central Platform South',
      description: `The southern end of the central platform, where the tracks curve away toward the yards. From here, both tunnel entrances are visible—dark mouths that once swallowed and disgorged trains on their endless journeys.

A dispatcher's booth stands at this end, its windows overlooking the platforms and tracks. The booth is a small structure, just large enough for one person and the equipment needed to coordinate train movements. The equipment is dead—radio silent, signals dark, the dispatcher's authority ended.

The view from here is of infrastructure—tracks, signals, catenary poles—all the hardware of a railroad, silent and still. The railroad is a fossil, its bones intact, its life extinct.`,
      x: -5,
      y: -8,
      z: -1,
      imageOnDisk: 'union-station-central-platform-south-x-5-y-8-z-1.png',
      population: 0,
      ambientNoise: 10,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PLATFORM_C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'dispatcher booth',
          aliases: ['booth', 'dispatch', 'control booth'],
          description: `A small booth of glass and steel, positioned to overlook the platforms and track approaches. Inside, a control panel is visible—radio equipment, signal controls, the tools a dispatcher used to coordinate train movements. The equipment is dark, the radios silent, the signals under the dispatcher's control frozen at their last positions. The booth is a monument to coordination, to the human effort that kept trains running safely. The effort ended. The booth remains.`,
        },
      ],
    },

    '%PLATFORM_END_E': {
      name: 'Union Station - East Platform End',
      description: `The northern end of the east platform, where the tracks enter the main tunnel leading under the city. The tunnel here is larger than the western one—the Great Northern's main line, designed for the heaviest traffic.

Graffiti covers the tunnel walls near the entrance, tags and murals applied in the years since the trains stopped. Some of the art is elaborate—full-color portraits, intricate lettering, the work of skilled hands with time to spare. The tunnel became a gallery when it stopped being a railway.

A ladder is bolted to the tunnel wall, leading up to a grating in the ceiling—emergency access to the street level above. The grating admits a shaft of gray light, the only illumination in the tunnel's entrance.`,
      x: -4,
      y: -6,
      z: -1,
      imageOnDisk: 'union-station-east-platform-end-x-4-y-6-z-1.png',
      population: 0,
      ambientNoise: 12,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PLATFORM_E',
        west: '%MAINTENANCE_TUNNEL',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'tunnel graffiti',
          aliases: ['graffiti', 'murals', 'art'],
          description: `Graffiti covers the tunnel walls, a gallery of street art accumulated since the trains stopped running. Some pieces are crude tags, territorial markers from the early days. Others are elaborate murals—portraits, landscapes, abstract designs—the work of artists who found canvas in abandoned infrastructure. The graffiti transformed the tunnel from industrial space to art gallery. The gallery has no curator. The art remains.`,
        },
        {
          prototype: 'describable',
          name: 'emergency ladder',
          aliases: ['ladder', 'escape ladder'],
          description: `A steel ladder bolted to the tunnel wall, leading up to an emergency grating in the ceiling. The ladder provides escape from the tunnel in case of emergency—fire, flood, the disasters that railroad engineers planned for. The grating above admits a shaft of gray light, the only direct connection to the street level above. The ladder is rusted but probably still climbable.`,
        },
      ],
    },

    '%MAINTENANCE_TUNNEL': {
      name: 'Union Station - Maintenance Tunnel',
      description: `A narrow service tunnel connecting the main track areas, used by maintenance workers to access equipment without crossing active tracks. The tunnel is cramped—perhaps six feet wide and seven feet tall—its walls of bare concrete, its floor of metal grating over cable runs and drainage channels.

Pipes and conduits line the ceiling, carrying utilities to the station above. Some pipes are labeled: STEAM, WATER, ELECTRICAL. Others are unmarked, their purpose known only to workers who no longer come.

Emergency lights are mounted at intervals, their batteries dead, their bulbs dark. The only light comes from distant skylights at either end—gray shafts that barely penetrate the tunnel's darkness.`,
      x: -5,
      y: -6,
      z: -1,
      imageOnDisk: 'union-station-maintenance-tunnel-x-5-y-6-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PLATFORM_END_W',
        east: '%PLATFORM_END_E',
        down: {
          description: 'A service shaft descends into the underground network',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'utility conduits',
          aliases: ['conduits', 'pipes', 'utilities'],
          description: `Pipes and conduits line the tunnel ceiling, the infrastructure that served the station above. Some are labeled in faded paint: STEAM, WATER, HIGH VOLTAGE. Others are unmarked, their purpose unclear. The utilities are dead—no steam, no water, no voltage—but the pipes remain, monuments to the systems that kept the station running.`,
        },
        {
          prototype: 'describable',
          name: 'metal grating',
          aliases: ['grating', 'floor grating', 'walkway'],
          description: `The floor is metal grating, its gaps revealing cable runs and drainage channels below. The grating was designed for maintenance access, letting workers walk above the infrastructure without disturbing it. Water drips through the gaps in places, collecting in the drainage channels below. The drainage still functions. The maintenance does not.`,
        },
      ],
    },
  },
};
