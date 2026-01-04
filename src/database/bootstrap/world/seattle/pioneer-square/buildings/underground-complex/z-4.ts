// Underground Complex - Merged building (z=-4 through z=-6)
// z=-4: Lower Passages - Operational level with cell bases, logistics, security
// z=-5: Deep Tunnels - Sister Gray's command level
// z=-6: The Blind - Ultra-secure Faraday-cage chamber

export const building = {
  name: 'Underground Complex',
  x: -16,
  y: -5,
  width: 13,
  height: 12,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY INFRASTRUCTURE - Level z=-4
    // ═══════════════════════════════════════════════════════════════════════

    '%INTERROG_DOOR': {
      prototype: 'door',
      name: 'Reinforced Door',
      description:
        'A heavy steel door with no visible handle or keyhole. The surface is featureless, designed to offer nothing to grip or pry.',
      locked: true,
      open: false,
    },

    '%VAULT_LOCK': {
      prototype: 'biometricLock',
      name: 'Vault Scanner',
      scanners: [{ type: 'palm', part: 'hand' }],
      authorizedUsers: {},
    },

    '%VAULT_DOOR': {
      prototype: 'door',
      name: 'Vault Door',
      description:
        'A reinforced steel door set into a concrete frame. A palm scanner glows faintly beside it.',
      locked: true,
      open: false,
      locks: ['%VAULT_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY INFRASTRUCTURE - Level z=-5
    // ═══════════════════════════════════════════════════════════════════════

    '%COMMAND_LOCK': {
      prototype: 'biometricLock',
      name: 'Command Scanner',
      scanners: [{ type: 'retinal', part: 'eye' }],
      authorizedUsers: {},
    },

    '%COMMAND_DOOR': {
      prototype: 'door',
      name: 'Command Access',
      description:
        'A reinforced door with a retinal scanner mounted beside it. The scanner glows faint red, waiting.',
      locked: true,
      open: false,
      locks: ['%COMMAND_LOCK'],
    },

    '%CELLS_LOCK': {
      prototype: 'biometricLock',
      name: 'Detention Scanner',
      scanners: [{ type: 'palm', part: 'hand' }],
      authorizedUsers: {},
    },

    '%CELLS_DOOR': {
      prototype: 'door',
      name: 'Detention Door',
      description:
        'A heavy steel door designed to contain rather than protect. A palm scanner glows beside it.',
      locked: true,
      open: false,
      locks: ['%CELLS_LOCK'],
    },

    '%VAULT5_LOCK': {
      prototype: 'biometricLock',
      name: 'Vault Scanner',
      scanners: [
        { type: 'retinal', part: 'eye' },
        { type: 'palm', part: 'hand' },
      ],
      authorizedUsers: {},
    },

    '%VAULT5_DOOR': {
      prototype: 'door',
      name: 'Vault Door',
      description:
        'The door is massive, industrial, designed for containment beyond mere security. Multiple scanners flank it—retinal and palm, requiring both.',
      locked: true,
      open: false,
      locks: ['%VAULT5_LOCK'],
    },

    '%QUARTERS_DOOR': {
      prototype: 'door',
      name: 'Private Door',
      description:
        'An unmarked door, deliberately anonymous, offering no indication of what lies beyond.',
      locked: true,
      open: false,
    },

    '%BLIND_DOOR': {
      prototype: 'door',
      name: 'Descent Access',
      description:
        'A narrow hatch set into the floor, reinforced beyond any reasonable structural need. The surface shows no handle, no mechanism—nothing that would suggest how to open it.',
      locked: true,
      open: false,
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 ENTRY POINTS (from z=-3 transitional shafts)
    // ═══════════════════════════════════════════════════════════════════════

    '%LJ': {
      name: 'Lower Junction',
      description: `The shaft opens into a chamber that feels constructed rather than inherited—reinforced walls of poured concrete over older brick, the ceiling low but the space wider than anything above. This is a threshold, and the architecture makes that clear. The passage narrows deliberately before it widens again, a chokepoint that funnels movement through a single observable space.

The concrete shows chalk marks in overlapping layers, symbols and scratched notations that form a language of territory and permission. Some are fresh, bright against the gray. Others have been scrubbed away, leaving pale ghosts on the stone. The walls remember who came before and who was erased.

Three passages branch from here: west toward the spine of the deeper network, south toward supply routes, and east along a cross-corridor that disappears into darkness. The air is warmer than above, carrying the mineral smell of deep earth and the faint ozone of electrical work.`,
      x: -14,
      y: 5,
      z: -4,
      population: 0,
      ambientNoise: 18,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'underground/transitional/junction-shaft.ts',
          description: 'A shaft leads up',
          prototype: 'guardedExit',
          allowedFaction: 'gray-cartel',
          denyMessage: 'The passage below is watched. You are not recognized.',
        },
        north: '%CB',
        south: '%Y4',
        west: '%X15Y5',
        east: '%X13Y5',
      },
    },

    '%SH': {
      name: 'Supply Hub',
      description: `The chamber serves as a vertical junction, passages arriving from above and descending further below. The walls show the stress of this function: reinforced frames around the shaft openings, the concrete cracked and patched where heavy loads have strained the structure over time. This is a place of movement, not rest—everything passes through, nothing stays.

The space is larger than most at this depth, sized for the logistics of supply rather than the economy of habitation. The ceiling rises higher here, allowing clearance for loads that can't navigate the cramped passages. The floor shows the concentrated wear of heavy traffic, polished smooth in the transit paths and rough where feet rarely fall.

The shaft downward is newer than the one above, the concrete still relatively bright, the construction more sophisticated. Whoever dug deeper did so with better resources or greater urgency. The descent continues. The network extends. Below lies something worth the effort of reaching.`,
      x: -14,
      y: -5,
      z: -4,
      population: 0,
      ambientNoise: 20,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'underground/transitional/supply-shaft.ts',
          description: 'A shaft leads up',
          prototype: 'guardedExit',
          allowedFaction: 'gray-cartel',
          denyMessage: 'The passage below is watched. You are not recognized.',
        },
        down: {
          room: '%TD',
          description: 'A reinforced shaft descends into darkness',
        },
        north: '%Y_4',
      },
    },

    '%RD': {
      name: `Runner's Den`,
      alias: 'runnersDen', // Register as $runnersDen for Cartel chargen spawn point
      description: `The passage ends here in a chamber that feels temporary despite its permanence—the walls reinforced with materials that could be stripped in hours, the space organized for rapid departure. This is a waystation, not a destination, sized for brief occupancy and quick evacuation. The architecture anticipates abandonment.

The room shows evidence of constant transit: the floor worn in paths that trace movement between the shaft above and the passage west, the walls smooth at hand-height where bodies have brushed past in the dark. The space accommodates passage more than presence, designed for people who don't stay.

Sound from the shaft above filters down clearly—footsteps, voices, the creak of wooden platforms under weight. The acoustic design is intentional, providing warning of approach from the only uncontrolled direction. Everything else connects to the deeper network, where sound means something different.`,
      x: -3,
      y: 2,
      z: -4,
      population: 0,
      ambientNoise: 14,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'underground/transitional/park-shaft.ts',
          description: 'A narrow shaft leads up toward the park',
          prototype: 'guardedExit',
          allowedFaction: 'gray-cartel',
          denyMessage: 'The passage below is watched. You are not recognized.',
        },
        south: '%X3Y1',
      },
      objects: [
        { prototype: 'bed', name: 'a salvaged cot', description: 'A cot pushed against the wall, ready to be abandoned at a moment\'s notice.', quality: 'cheap' },
        { prototype: 'bed', name: 'a salvaged cot', description: 'A cot near the exit, sleeping bag rolled at its foot.', quality: 'cheap' },
        { prototype: 'trunk', name: 'a battered footlocker', description: 'A dented metal footlocker, its lock missing.' },
        { prototype: 'crate', name: 'a supply crate', description: 'A crate marked "MRE" in faded stencil.' },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 NAMED LOCATIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%CB': {
      name: 'Cutter Barracks',
      description: `The chamber extends north from the junction in a long, low rectangle that might once have been a basement cistern—the walls curve slightly inward, the floor slopes toward a drain that no longer functions. Someone converted this space for habitation, reinforcing the ceiling with steel beams and dividing the length into sections with hanging barriers that move when the air shifts.

The walls show the marks of intensive use: scratched tallies, territorial symbols, the dark stains where hands have touched the same spots thousands of times. The floor is worn smooth in paths that trace habitual movement—entry to rest area, rest area to the passage south, the same routes walked until the concrete remembers.

The air here is different: warmer, more organic, carrying the accumulated presence of bodies in close quarters over time. Sound dampens in the fabric barriers, creating pockets of relative quiet in what should be an echoing space. The effect is deliberate. Privacy matters, even underground.`,
      x: -14,
      y: 6,
      z: -4,
      population: 0,
      ambientNoise: 20,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LJ',
      },
      objects: [
        { prototype: 'bed', name: 'a salvaged cot', description: 'An old military cot with a thin mattress, pushed against the curved wall.', quality: 'cheap' },
        { prototype: 'bed', name: 'a salvaged cot', description: 'A cot with a rolled sleeping bag on top.', quality: 'cheap' },
        { prototype: 'bed', name: 'a salvaged cot', description: 'A cot near the fabric partition, slightly more private than the others.', quality: 'cheap' },
        { prototype: 'bed', name: 'a salvaged cot', description: 'A cot by the entrance, positioned for quick exit.', quality: 'cheap' },
        { prototype: 'trunk', name: 'a battered footlocker', description: 'A dented metal footlocker, its lock mechanism worn smooth from use.' },
        { prototype: 'crate', name: 'a supply crate', description: 'A wooden crate stamped with faded shipping marks, repurposed as storage.' },
        { prototype: 'crate', name: 'a supply crate', description: 'A crate serving as an improvised side table between two cots.' },
      ],
    },

    '%SW': {
      name: 'Spark Workshop',
      description: `The passage widens here into a space that hums with contained electricity—the walls lined with conduit that snakes upward through drilled channels, drawing power from sources that the city doesn't know about. The air tastes of solder and heated metal, the acrid sweetness of components under stress. Someone works here. Someone builds things.

The chamber itself is older than its purpose, a brick basement from the original underground that's been repurposed with ruthless efficiency. Every surface shows adaptation: mounting points drilled into brick, cable runs secured with salvaged brackets, ventilation tubes that disappear into darkness overhead. The work is skilled but improvised, engineering without resources.

Scorch marks darken the concrete floor in irregular patterns—the evidence of failed experiments or controlled burns. The walls near these marks show additional ventilation, holes punched through brick and covered with mesh. Whatever happens here sometimes goes wrong. The builders planned for that.`,
      x: -16,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 30,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%X15Y1',
      },
      objects: [
        { prototype: 'desk', name: 'a salvaged workbench', description: 'A heavy workbench covered in burn marks and soldering residue. Tools hang from a pegboard above it.' },
        { prototype: 'desk', name: 'a salvaged workbench', description: 'A workbench with a vise bolted to one end, its surface scarred by countless repairs.' },
        { prototype: 'cabinet', name: 'a metal cabinet', description: 'A dented industrial cabinet, its doors secured with a simple padlock.' },
        { prototype: 'crate', name: 'a components crate', description: 'A crate overflowing with salvaged electronics—circuit boards, wire spools, capacitors.' },
        { prototype: 'crate', name: 'a tools crate', description: 'A heavy wooden crate holding hand tools and spare parts.' },
      ],
    },

    '%SF': {
      name: 'Safe House',
      description: `The chamber sits at a junction of passages, its walls showing the scars of multiple modifications—bricked-up doorways reopened, new passages cut through old walls, the architecture of escape layered over decades of revision. Every direction offers a route out. Every route offers a different destination. The geometry is deliberate: this is a place designed for disappearing.

The room itself is unremarkable, sized for waiting rather than living. The walls are bare concrete, the ceiling low, the air still. But the stillness is deceptive—sound carries through the multiple passages, bringing distant echoes that make the silence feel populated. Footsteps approach from everywhere and nowhere.

Scratched marks near each passage mouth indicate direction and distance in a code that requires knowing. The marks are maintained, the older ones traced over with fresh scratches that preserve the information while erasing the evidence of age. Someone updates this place. Someone keeps it ready.`,
      x: -12,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%X12Y1',
        west: '%X13Y0',
        east: '%X11Y0',
      },
      objects: [
        { prototype: 'couch', name: 'a threadbare couch', description: 'A sagging couch with springs visible through worn fabric. It has been here a long time.' },
        { prototype: 'chair', name: 'a folding chair', description: 'A metal folding chair positioned near one of the exits.' },
        { prototype: 'chair', name: 'a folding chair', description: 'A folding chair against the wall, its seat dented from use.' },
        { prototype: 'crate', name: 'a supply crate', description: 'A crate containing emergency supplies—water bottles, energy bars, first aid.' },
      ],
    },

    '%DD': {
      name: 'Dead Drop',
      description: `The passage widens slightly here into an alcove that might once have been a coal chute or ash dump—the walls still show the dark staining of a century's carbon, the floor sloped toward a depression that once collected refuse. The space is unremarkable, anonymous, the kind of place that exists in a thousand basements without anyone remembering.

That anonymity is the point. The alcove offers shelter from the passage without offering concealment from it—visible enough to monitor, private enough for brief transactions. The walls show no territorial marks, no chalk symbols, nothing to indicate ownership or purpose. The absence is conspicuous to anyone who knows what to look for.

The floor shows wear patterns that don't match transit—people stop here, turn, face the wall, then leave. The same movements repeated until the concrete remembers. The air holds a faint chemical smell, the residue of substances used to treat paper or purge digital traces. Information passes through here. Nothing stays.`,
      x: -8,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%X8Y1',
        south: '%X8Y_1',
        west: '%X9Y0',
        east: '%X7Y0',
      },
      objects: [
        { prototype: 'crate', name: 'a weathered crate', description: 'An old wooden crate tucked into the alcove, its purpose deliberately unclear.' },
      ],
    },

    '%IR': {
      name: 'Interrogation',
      description: `The chamber is set apart from the main passages, accessed through a narrow corridor that angles twice before arriving—a design that isolates sound and prevents direct lines of sight. The walls are thick here, older brick reinforced with poured concrete that absorbs echoes rather than returning them. What happens in this room stays in this room.

The space itself is small, oppressively so, the ceiling low enough to require ducking in places. The darkness feels intentional, the minimal lighting positioned to create shadows rather than eliminate them. The geometry disorients: corners that don't quite meet at right angles, walls that seem to lean inward, a floor that slopes almost imperceptibly toward a drain.

The air is still and close, carrying the mineral smell of old concrete and something else—the chemical residue of cleaning agents applied thoroughly and often. The room has been sanitized. The room needs to be sanitized. The implications hang in the darkness like humidity.`,
      x: -14,
      y: -2,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%Y_1', door: '%INTERROG_DOOR' },
      },
      objects: [
        { prototype: 'chair', name: 'a metal chair', description: 'A cold metal chair bolted to the floor in the center of the room.' },
        { prototype: 'desk', name: 'a battered desk', description: 'A small desk pushed against the wall, its surface scarred and stained.' },
      ],
    },

    '%KV': {
      name: `Keeper's Vault`,
      description: `The passage opens into a chamber that was built for security—the walls reinforced with steel plate over concrete over brick, the layers visible where modifications have been made over decades. The original structure might have been a bank vault or a cold storage unit; whatever it was, someone recognized its potential and enhanced it. The room resists entry by design.

The air here is different: drier, cooler, climate-controlled by systems that hum quietly in the walls. The temperature stability matters for whatever this space contains, matters enough to justify the power expenditure in a place where every watt is counted. The investment speaks to value.

The walls show organizational marks—zones indicated by paint that was once bright and has faded to suggestion, numbered sections that follow a system requiring knowledge to decode. The floor shows wear patterns concentrated near specific areas, heavy traffic to certain positions and neglect of others. Whatever is kept here follows a hierarchy. Some things matter more than others.`,
      x: -14,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%Y_3',
        south: '%SH',
        west: { room: '%X15Y_4', door: '%VAULT_DOOR' },
        east: '%X13Y_4',
      },
      objects: [
        { prototype: 'cabinet', name: 'a reinforced cabinet', description: 'A heavy steel cabinet with a combination lock, its surface scratched from years of use.' },
        { prototype: 'cabinet', name: 'a reinforced cabinet', description: 'A cabinet with reinforced hinges, the paint chipped but the structure solid.' },
        { prototype: 'crate', name: 'a numbered crate', description: 'A crate marked with faded numbers, its contents unknown.' },
        { prototype: 'crate', name: 'a numbered crate', description: 'A sealed crate with a manifest tag wired to the handle.' },
        { prototype: 'crate', name: 'a numbered crate', description: 'A heavy crate positioned against the reinforced wall.' },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 WEST SPINE (x=-14, y=+5 to y=-5)
    // ═══════════════════════════════════════════════════════════════════════

    '%Y4': {
      name: 'Lower Passage',
      description: `The passage narrows here between the junction above and the barracks beyond, the walls pressing close enough that two people cannot walk abreast. The constriction is architectural security—anyone moving through must move single file, vulnerable to observation from either end. The builders understood defense. They built it into the geometry.`,
      x: -14,
      y: 4,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%LJ', south: '%Y3' },
    },

    '%Y3': {
      name: 'Lower Passage',
      description: `The passage runs straight here through what was once the basement of a hotel—the dimensions suggest the utilitarian architecture of service corridors, spaces designed for staff rather than guests.`,
      x: -14,
      y: 3,
      z: -4,
      population: 0,
      ambientNoise: 14,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%Y4', south: '%Y2' },
    },

    '%Y2': {
      name: 'Lower Passage',
      description: `The passage shows evidence of intersection ahead—the lighting slightly brighter where corridors meet, the sound changing quality as echoes find new paths.`,
      x: -14,
      y: 2,
      z: -4,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%Y3', south: '%Y1' },
    },

    '%Y1': {
      name: 'Lower Passage',
      description: `The passage crosses another here, forming a junction that opens the space briefly before the walls close in again. The intersection creates a moment of decision—continue south along the spine, turn east toward the technical sectors, turn west toward the workshop.`,
      x: -14,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 22,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%Y2', south: '%Y0', west: '%X15Y1', east: '%X13Y1' },
    },

    '%Y0': {
      name: 'Lower Passage',
      description: `Another intersection breaks the passage here, a corridor extending east toward shelter and shadow. The junction is smaller than the one above, designed for utility rather than traffic.`,
      x: -14,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%Y1', south: '%Y_1', east: '%X13Y0' },
    },

    '%Y_1': {
      name: 'Lower Passage',
      description: `The passage grows quieter here, the ambient noise of the upper sections fading as the corridor descends into more restricted territory. The lighting is dimmer, the fixtures fewer, the shadows deeper.`,
      x: -14,
      y: -1,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%Y0', south: { room: '%IR', door: '%INTERROG_DOOR' } },
    },

    '%Y_3': {
      name: 'Lower Passage',
      description: `The passage runs through absolute silence here, the sound-dampening architecture creating a dead zone where echoes go to die. The effect is disorienting—footsteps produce no reverberation, voices seem to stop at arm's length.`,
      x: -14,
      y: -3,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%IR', south: '%KV' },
    },

    '%Y_4': {
      name: 'Lower Passage',
      description: `The passage approaches the supply hub, the corridor widening slightly as it nears the vertical junction. The walls show the marks of heavy traffic—scratches at hip height where loads have scraped past.`,
      x: -14,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 16,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%Y_3', south: '%SH' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 UPPER CROSS CORRIDOR (y=+1, x=-16 to x=-4)
    // ═══════════════════════════════════════════════════════════════════════

    '%X15Y1': {
      name: 'Lower Passage',
      description: `The passage here carries the residual hum of electrical work from the workshop to the west, a low frequency vibration that travels through the concrete walls rather than the air.`,
      x: -15,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 25,
      lighting: 28,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%SW', east: '%Y1' },
    },

    '%X15Y5': {
      name: 'Lower Passage',
      description: `A short passage connects the main junction to a western alcove, the corridor narrowing as it approaches the network's edge.`,
      x: -15,
      y: 5,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { east: '%LJ', west: '%ARMORY' },
    },

    '%ARMORY': {
      name: 'The Armory',
      description: `The passage opens into a reinforced chamber that serves as the Cartel's primary weapons cache—a space designed for containment as much as storage. The walls are lined with steel plate, the floor poured thick with concrete, the entire structure built to survive the detonation of its contents if something goes wrong.

The armory is organized with military precision: racks for long arms, lockers for sidearms, cages for explosives, cabinets for ammunition. The organization reflects necessity rather than preference, the limited space requiring efficiency. Every weapon has a place. Every place has a weapon.

A reinforced workbench occupies one corner, its surface scarred by cleaning and maintenance. The tools of the trade hang on pegboards: cleaning rods, bore brushes, wrenches, files, the equipment needed to keep weapons functional in the damp underground environment.

The air smells of oil and solvent, the residue of constant maintenance. Weapons don't survive the underground without care. The Cartel cares.`,
      x: -16,
      y: 5,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: { east: '%X15Y5' },
      objects: [
        { prototype: 'cabinet', name: 'a weapons locker', description: 'A tall steel locker with a heavy padlock. Slots inside hold long arms in vertical racks.' },
        { prototype: 'cabinet', name: 'a weapons locker', description: 'A locker marked with a faded number. The lock mechanism shows wear from frequent access.' },
        { prototype: 'cabinet', name: 'an ammunition cabinet', description: 'A reinforced cabinet with blast-resistant construction, its shelves organized by caliber.' },
        { prototype: 'crate', name: 'an equipment crate', description: 'A crate containing tactical gear: vests, holsters, pouches, the accoutrements of armed operations.' },
        { prototype: 'desk', name: 'a maintenance bench', description: 'A heavy workbench with a vise, cleaning supplies, and spare parts organized in labeled bins.' },
        { prototype: 'sign', name: 'an inventory board', description: 'A chalkboard tracking weapon allocation and maintenance schedules. The chalk is fresh.' },
      ],
    },

    '%X13Y5': {
      name: 'Lower Passage',
      description: `The passage extends east from the lower junction, connecting to corridors that serve the network's operational areas.`,
      x: -13,
      y: 5,
      z: -4,
      population: 0,
      ambientNoise: 16,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%LJ', east: '%X12Y5' },
    },

    '%X12Y5': {
      name: 'Lower Passage',
      description: `The passage continues east toward specialized operational areas, the corridor showing the marks of heavy traffic—carts, equipment, the logistics of underground operations.`,
      x: -12,
      y: 5,
      z: -4,
      population: 0,
      ambientNoise: 18,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X13Y5', east: '%COMMS_CENTER', north: '%MEDICAL_BAY' },
    },

    '%COMMS_CENTER': {
      name: 'Communications Center',
      description: `The chamber hums with the white noise of active electronics—a space dedicated to the invisible infrastructure of communication. The walls are lined with equipment racks, their blinking lights indicating systems that monitor, relay, and intercept the radio and data traffic that flows through the city above.

The construction includes Faraday shielding, the walls lined with mesh that contains the center's own emissions while blocking external signals. The isolation is deliberate—what happens here cannot be detected from outside, and outside signals cannot compromise what happens here.

A central console dominates the space, its multiple screens showing data flows, frequency monitors, and communication logs. The operator's chair is worn but functional, positioned for hours of observation. Someone watches the city from here. Someone listens.

Antenna cables run upward through conduit, connecting to hidden receivers on the surface. The Cartel's ears extend throughout Pioneer Square, hearing what others think is private.`,
      x: -11,
      y: 5,
      z: -4,
      population: 0,
      ambientNoise: 35,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X12Y5' },
      objects: [
        { prototype: 'desk', name: 'a communications console', description: 'A curved console with multiple monitors, radio equipment, and spectrum analyzers. The screens show real-time data.' },
        { prototype: 'chair', name: 'an operator\'s chair', description: 'A heavy-duty office chair, its armrests worn from long hours of monitoring.' },
        { prototype: 'cabinet', name: 'an equipment rack', description: 'A tall rack of radio equipment—transceivers, amplifiers, signal processors—their indicator lights blinking in coded patterns.' },
        { prototype: 'cabinet', name: 'a server rack', description: 'A rack of servers humming with activity, processing intercepted data and managing secure communications.' },
        { prototype: 'crate', name: 'a spare parts bin', description: 'A crate containing backup components: circuit boards, cables, antennas, the supplies needed to maintain the systems.' },
        { prototype: 'sign', name: 'frequency charts', description: 'Laminated charts on the wall list frequencies to monitor, encryption protocols, and signal codes.' },
      ],
    },

    '%MEDICAL_BAY': {
      name: 'Medical Bay',
      description: `The chamber is cleaner than anywhere else at this depth—surfaces scrubbed, air filtered, the environment maintained to standards that the rest of the underground cannot achieve. This is the Cartel's medical facility, a space designed for treatment when the surface hospitals cannot be trusted.

The equipment is salvaged but functional: an operating table with adjustable lighting, cabinets of medical supplies, monitoring equipment that still works despite its age. The facility lacks the resources of a proper hospital but exceeds what most field medics could hope for.

The walls show the marks of hasty construction—this space was carved from the network specifically for its purpose, the dimensions designed to accommodate medical procedures. The ceiling is lower here, the lighting brighter, the atmosphere clinical despite the surrounding darkness.

Stains on the floor have been scrubbed but not entirely eliminated. Operations have been performed here. Wounds have been treated. Not everyone survived.`,
      x: -12,
      y: 6,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: { south: '%X12Y5' },
      objects: [
        { prototype: 'bed', name: 'an operating table', description: 'A metal table with adjustable height and an overhead surgical light. The surface is stainless steel, worn but clean.', quality: 'standard' },
        { prototype: 'bed', name: 'a recovery cot', description: 'A cot with clean sheets, positioned for post-operative recovery.', quality: 'standard' },
        { prototype: 'cabinet', name: 'a medical supply cabinet', description: 'A locked cabinet containing bandages, sutures, antibiotics, and other medical supplies.' },
        { prototype: 'cabinet', name: 'a surgical instrument cabinet', description: 'A glass-fronted cabinet displaying surgical instruments, organized by procedure type.' },
        { prototype: 'desk', name: 'a workstation', description: 'A desk with a computer terminal for patient records and medical references.' },
        { prototype: 'crate', name: 'an IV supply crate', description: 'A crate containing IV bags, tubing, and associated supplies.' },
        { prototype: 'sign', name: 'a sterilization chart', description: 'A laminated chart detailing sterilization procedures and emergency protocols.' },
      ],
    },

    '%X13Y1': {
      name: 'Lower Passage',
      description: `The passage stretches east from the main spine intersection, running through older infrastructure that predates the current network.`,
      x: -13,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%Y1', east: '%X12Y1' },
    },

    '%X12Y1': {
      name: 'Lower Passage',
      description: `The passage passes near a junction to the south, the corridor branching toward shelter and escape routes.`,
      x: -12,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 16,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%SF', west: '%X13Y1', east: '%X11Y1' },
    },

    '%X11Y1': {
      name: 'Lower Passage',
      description: `The passage runs straight here through what might have been a commercial basement, the dimensions suggesting retail storage or light manufacturing.`,
      x: -11,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X12Y1', east: '%X10Y1' },
    },

    '%X10Y1': {
      name: 'Lower Passage',
      description: `The passage begins to show the influence of intersecting routes, the traffic patterns on the floor indicating that some travelers turn south toward the exchange points.`,
      x: -10,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 14,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X11Y1', east: '%X9Y1' },
    },

    '%X9Y1': {
      name: 'Lower Passage',
      description: `The passage shows signs of deliberate obscurity here, the walls bare of the territorial marks that appear elsewhere in the network.`,
      x: -9,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X10Y1', east: '%X8Y1' },
    },

    '%X8Y1': {
      name: 'Lower Passage',
      description: `The passage intersects with a route leading south, creating a junction that connects the main cross-corridor to the deeper sections of the eastern network.`,
      x: -8,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 16,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%DD', south: '%X8Y0', west: '%X9Y1', east: '%X7Y1' },
    },

    '%X7Y1': {
      name: 'Lower Passage',
      description: `The passage continues east through older construction, the walls showing the rough brick of original underground development.`,
      x: -7,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X8Y1', east: '%X6Y1' },
    },

    '%X6Y1': {
      name: 'Lower Passage',
      description: `The passage narrows further as it approaches its eastern extent, the walls closing in as the network reaches the edge of the original underground development.`,
      x: -6,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X7Y1', east: '%X5Y1' },
    },

    '%X5Y1': {
      name: 'Lower Passage',
      description: `The passage shows signs of active maintenance here, the walls cleaner than in the transit sections, the floor swept of debris.`,
      x: -5,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 14,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X6Y1', east: '%X4Y1' },
    },

    '%X4Y1': {
      name: 'Lower Passage',
      description: `The passage reaches its eastern terminus here, the corridor ending at a junction with the vertical route to the park access above.`,
      x: -4,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 14,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: { east: '%X3Y1', west: '%X5Y1' },
    },

    '%X3Y1': {
      name: 'Lower Passage',
      description: `The passage ends at the base of the park shaft, a cramped junction where the vertical route meets the horizontal network.`,
      x: -3,
      y: 1,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%RD', west: '%X4Y1' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 SAFE HOUSE CORRIDOR (y=0)
    // ═══════════════════════════════════════════════════════════════════════

    '%X13Y0': {
      name: 'Lower Passage',
      description: `The passage branches east from the main spine, a secondary corridor that runs parallel to the busier routes above and below.`,
      x: -13,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%Y0', east: '%SF' },
    },

    '%X11Y0': {
      name: 'Lower Passage',
      description: `The passage continues east from the junction, the corridor narrowing as it moves away from the established escape routes.`,
      x: -11,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%SF', east: '%X10Y0' },
    },

    '%X10Y0': {
      name: 'Lower Passage',
      description: `The passage runs through darkness here, the lighting reduced to intervals that create pools of visibility separated by shadow.`,
      x: -10,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 6,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X11Y0', east: '%X9Y0' },
    },

    '%X9Y0': {
      name: 'Lower Passage',
      description: `The passage nears its terminus, the corridor ending at an alcove that serves purposes requiring discretion.`,
      x: -9,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 5,
      lighting: 6,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X10Y0', east: '%DD' },
    },

    '%X7Y0': {
      name: 'Lower Passage',
      description: `The passage continues east from the dead drop, a corridor that few have reason to travel.`,
      x: -7,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 4,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%DD' },
    },

    '%X8Y0': {
      name: 'Lower Passage',
      description: `A short passage connects the upper cross corridor to the dead drop alcove, the route angled slightly downward.`,
      x: -8,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%X8Y1', south: '%DD' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 EASTERN SPUR (x=-8, y=+1 to y=-4)
    // ═══════════════════════════════════════════════════════════════════════

    '%X8Y_1': {
      name: 'Lower Passage',
      description: `The passage descends from the exchange point above, angling downward toward the secured sections of the network.`,
      x: -8,
      y: -1,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%DD', south: '%X8Y_2' },
    },

    '%X8Y_2': {
      name: 'Lower Passage',
      description: `The passage continues its descent through what was once solid earth, the excavation visible in the raw walls.`,
      x: -8,
      y: -2,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 14,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%X8Y_1', south: '%X8Y_3' },
    },

    '%X8Y_3': {
      name: 'Lower Passage',
      description: `The passage levels out as it approaches the junction below, the descent complete.`,
      x: -8,
      y: -3,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%X8Y_2', south: '%X8Y_4' },
    },

    '%X8Y_4': {
      name: 'Lower Passage',
      description: `The passage reaches the lower cross-corridor here, the eastern spur terminating at an intersection.`,
      x: -8,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 14,
      lighting: 16,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%X8Y_3', west: '%X9Y_4' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-4 LOWER CROSS CORRIDOR (y=-4)
    // ═══════════════════════════════════════════════════════════════════════

    '%X15Y_4': {
      name: 'Lower Passage',
      description: `A short passage extends west from the vault, connecting to storage and staging areas that serve the secured section's logistics.`,
      x: -15,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: { east: { room: '%KV', door: '%VAULT_DOOR' } },
    },

    '%X13Y_4': {
      name: 'Lower Passage',
      description: `The passage runs east from the armored vault, a corridor that serves the secured section's logistics.`,
      x: -13,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%KV', east: '%X12Y_4' },
    },

    '%X12Y_4': {
      name: 'Lower Passage',
      description: `The passage continues through the secured section, the reinforced walls creating an armored corridor between protected locations.`,
      x: -12,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X13Y_4', east: '%X11Y_4' },
    },

    '%X11Y_4': {
      name: 'Lower Passage',
      description: `The passage runs straight here, the corridor maintaining its armored character through the center of the secured section.`,
      x: -11,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X12Y_4', east: '%X10Y_4' },
    },

    '%X10Y_4': {
      name: 'Lower Passage',
      description: `The passage approaches the junction with the eastern spur, the secured corridor meeting the route that connects to the upper network.`,
      x: -10,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 14,
      lighting: 16,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X11Y_4', east: '%X9Y_4' },
    },

    '%X9Y_4': {
      name: 'Lower Passage',
      description: `The passage nears the eastern junction, the corridor transitioning from the secured construction of the vault section to more utilitarian passages.`,
      x: -9,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 13,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%X10Y_4', east: '%X8Y_4' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-5 ENTRY POINT (from z=-4 Supply Hub)
    // ═══════════════════════════════════════════════════════════════════════

    '%TD': {
      name: 'The Descent',
      description: `The shaft from above terminates here in a chamber that feels like a throat—narrow, vertical, designed to control the flow of bodies between levels. The walls are reinforced with steel plate that shows the marks of professional installation, the work of people who understood structural engineering and had access to industrial materials.

The air pressure is noticeably different at this depth, the ears registering the change before the mind processes it. The atmosphere is warmer, damper, the climate control systems fighting a constant battle against the water table that lies not far below. Seepage darkens the corners where walls meet floor, the moisture managed but not eliminated.

Sound from above is muffled by the shaft's length and the chamber's construction. Sound from below—from the command sections that extend north—carries clearly, mechanical hums and the occasional echo of purposeful movement. This is the entrance to something. The architecture makes that significance clear.`,
      x: -14,
      y: -5,
      z: -5,
      population: 0,
      ambientNoise: 18,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: '%SH',
        north: '%5Y_4',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-5 COMMAND SECTION
    // ═══════════════════════════════════════════════════════════════════════

    '%WR': {
      name: 'War Room',
      description: `The chamber opens from the main spine into a space designed for planning—the ceiling higher than in the passages, the walls smooth and pale, the surfaces prepared to receive information. The room serves as mind rather than muscle, a place where strategy is formulated and decisions are made.

The walls show the faint marks of displayed information, the outlines of things that have been posted and removed, the ghosts of plans that were executed or abandoned. The surfaces are clean now, deliberately emptied, but the marks remain as evidence of process. Decisions were made here. Consequences followed.

The lighting is brighter than elsewhere at this depth, the visibility serving the room's purpose. Plans require seeing. Strategy requires clarity. The illumination is a resource expenditure justified by function.

The air carries the hum of powered systems, electronics that serve purposes beyond mere lighting. Information flows through this room. The hum is its pulse.`,
      x: -14,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 20,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%5Y_2',
        south: '%5Y_4',
        west: '%5X15Y_3',
        east: { room: '%5X13Y_3', door: '%COMMAND_DOOR' },
      },
      objects: [
        { prototype: 'desk', name: 'a planning table', description: 'A large table dominates the room\'s center, its surface scarred by years of maps and diagrams.' },
        { prototype: 'chair', name: 'a metal chair', description: 'A sturdy metal chair at the head of the planning table.' },
        { prototype: 'chair', name: 'a metal chair', description: 'A chair positioned for viewing the wall displays.' },
        { prototype: 'chair', name: 'a metal chair', description: 'A chair at the table\'s edge, slightly askew.' },
        { prototype: 'chair', name: 'a metal chair', description: 'A chair pushed back from the table.' },
        { prototype: 'cabinet', name: 'a locked cabinet', description: 'A steel cabinet with a heavy padlock, its contents restricted.' },
        { prototype: 'cabinet', name: 'a map cabinet', description: 'A flat-file cabinet for storing maps and blueprints.' },
      ],
    },

    '%AR': {
      name: 'Archive',
      description: `The chamber extends west from the command corridor, its walls showing the infrastructure of organized information—mounting points, cable runs, the evidence of systems designed to store and retrieve. The room exists to remember, to accumulate knowledge that serves power.

The air is carefully controlled, drier than elsewhere at this depth, the humidity managed to preserve whatever information the room contains. The climate control represents continuous investment, power devoted to maintenance rather than action. Memory requires resources.

The walls show organizational marks—zones indicated by numbers and symbols that create a geography of information. The system requires knowing to navigate, the codes serving as both organization and security. What the archive contains is accessible only to those who understand how to access it.

The silence here is deeper than elsewhere, the room designed to absorb sound. Secrets require quiet. The architecture provides it.`,
      x: -16,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 5,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%5X15Y_3',
      },
      objects: [
        { prototype: 'cabinet', name: 'a file cabinet', description: 'A tall filing cabinet with numbered drawers, each secured with its own lock.' },
        { prototype: 'cabinet', name: 'a file cabinet', description: 'A cabinet labeled with zone codes, its contents organized by a system that requires knowing.' },
        { prototype: 'cabinet', name: 'a file cabinet', description: 'A cabinet with wear marks around certain drawers—frequently accessed information.' },
        { prototype: 'cabinet', name: 'a file cabinet', description: 'A cabinet pushed against the far wall, its locks showing no signs of recent use.' },
        { prototype: 'desk', name: 'a research desk', description: 'A small desk with a reading lamp, positioned for reviewing archived documents.' },
      ],
    },

    '%HC': {
      name: 'Holding Cells',
      description: `The passage opens into a space designed for containment—the walls segmented into sections by barriers that suggest division without revealing what lies behind them. The architecture speaks of separation, isolation, the controlled management of human presence.

The construction is more substantial here than elsewhere, the walls reinforced in ways that go beyond structural necessity. The materials resist more than collapse. They resist escape, resist sound, resist the transmission of anything between the sections they create.

The air is processed, recycled, the ventilation system designed to control atmosphere in isolated segments. Each section breathes its own air, shares nothing with its neighbors. The isolation is complete, environmental as well as physical.

The lighting is harsh, flat, designed to eliminate shadows. Concealment has no place here. Every surface is visible. Every presence is known.`,
      x: -10,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%5X11Y_3', door: '%CELLS_DOOR' },
      },
      objects: [
        { prototype: 'bed', name: 'a detention cot', description: 'A bare metal cot bolted to the floor, mattress thin and stained.', quality: 'cheap' },
        { prototype: 'bed', name: 'a detention cot', description: 'A cot in the far cell, identical to the others—designed for discomfort.', quality: 'cheap' },
      ],
    },

    '%TV': {
      name: 'The Vault',
      description: `The chamber presents itself as terminus, as destination, as the end of a journey through layers of security. The walls are reinforced with materials that exceed structural necessity—shielding, perhaps, or containment, or both. The construction speaks of protecting something precious, or containing something dangerous. The distinction might not matter.

The space is smaller than the approach suggests, the elaborate security funneling down to an intimate chamber that could hold very little of physical size. Whatever this room was built to contain, it isn't measured in volume. Value and danger don't scale with dimension.

The air is absolutely still, the ventilation reduced to prevent even the movement of atmosphere. The stillness feels deliberate, significant, the absence of motion serving some purpose beyond mere climate control.

The silence is perfect, engineered, the room isolated from the network's ambient noise by construction that goes beyond soundproofing. What happens here stays here. The architecture ensures it.`,
      x: -14,
      y: -1,
      z: -5,
      population: 0,
      ambientNoise: 0,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%5Y0',
        south: '%5Y_2',
        west: { room: '%CC', door: '%VAULT5_DOOR' },
      },
      objects: [
        { prototype: 'safe', name: 'a reinforced safe', description: 'A heavy safe set into the wall, its door thick enough to stop more than thieves.' },
        { prototype: 'trunk', name: 'an armored container', description: 'A container of uncertain purpose, its construction suggesting protection against more than physical force.' },
      ],
    },

    '%CC': {
      name: 'Council Chambers',
      description: `The chamber extends west from the main corridor, a space designed for deliberation among those whose deliberations matter. The dimensions suggest assembly rather than audience—a gathering of equals, or at least of peers, the geometry democratic in a way that the network's hierarchy is not.

The walls are bare but finished, the surfaces prepared with care that suggests the room's importance. The construction is professional, precise, every corner meeting cleanly, every surface aligned. Resources were spent here. Attention was paid.

The ceiling is higher than in the passages, the space less confining, the atmosphere designed to facilitate thinking rather than merely containing bodies. The room wants its occupants to feel capable, confident, equal to the decisions that might be made within it.

The sound-dampening is extreme, conversations contained absolutely within the chamber's walls. What is said here is said only here. The architecture provides the discretion that the decisions require.`,
      x: -16,
      y: -1,
      z: -5,
      population: 0,
      ambientNoise: 3,
      lighting: 28,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: { room: '%TV', door: '%VAULT5_DOOR' },
      },
      objects: [
        { prototype: 'desk', name: 'a council table', description: 'A long table dominates the room, its surface dark wood worn smooth by hands and elbows.' },
        { prototype: 'chair', name: 'a high-backed chair', description: 'A chair at the head of the table, slightly larger than the others.' },
        { prototype: 'chair', name: 'a council chair', description: 'A chair at the table, positioned for equal participation.' },
        { prototype: 'chair', name: 'a council chair', description: 'A chair showing wear from regular use.' },
        { prototype: 'chair', name: 'a council chair', description: 'A chair pushed slightly back from the table.' },
        { prototype: 'chair', name: 'a council chair', description: 'A chair at the table\'s far end.' },
        { prototype: 'chair', name: 'a council chair', description: 'A chair near the door, positioned for easy exit.' },
      ],
    },

    '%SQ': {
      name: `Sister's Quarters`,
      description: `The chamber is austere to the point of denial, a space stripped of everything that comfort might require. The walls are bare concrete, unfinished, the surfaces left rough as if to reject the very concept of accommodation. The room serves function, nothing more. The function is residence. The residence is minimal.

The dimensions are small, smaller than the passages that lead to it, the space compressed to essentials. The compression is deliberate, intentional, a choice rather than a constraint. Someone who commands resources chose not to spend them here. The austerity is ideological.

The air is the same as elsewhere at this depth—controlled, processed, the temperature regulated without regard for personal comfort. The climate serves the network, not the individual. The individual adapts or does not.

A passage continues downward, narrow and steep, descending toward depths that the network above does not acknowledge. Something lies below. This room guards the approach.`,
      x: -14,
      y: 1,
      z: -5,
      population: 0,
      ambientNoise: 5,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: {
          room: '%TB',
          door: '%BLIND_DOOR',
          description: 'A hatch leads down into absolute darkness',
        },
        south: { room: '%5Y0', door: '%QUARTERS_DOOR' },
        west: '%5X15Y1',
      },
      objects: [
        { prototype: 'bed', name: 'a narrow cot', description: 'A cot barely wider than a body, its blanket thin and gray.', quality: 'cheap' },
        { prototype: 'desk', name: 'a simple desk', description: 'A small desk with a single drawer, its surface bare.' },
        { prototype: 'chair', name: 'a wooden chair', description: 'A plain wooden chair, its finish worn through in places.' },
      ],
    },

    '%CL': {
      name: 'Clone Lab',
      description: `The chamber hums with the sound of maintained systems, the white noise of processes that continue whether or not anyone observes them. The walls show the infrastructure of biological work—climate control more precise than elsewhere, power conduits that suggest significant draw, ventilation designed for sterility rather than mere comfort.

The construction is professional, clinical, the surfaces finished to standards that exceed the utilitarian passages. The room was built for work that requires cleanliness, precision, conditions that approximate the medical rather than the industrial. The investment suggests value, importance, necessity.

The air is filtered, processed, maintained at parameters that the rest of the network doesn't approach. Temperature, humidity, particulate count—all controlled to specifications that serve purposes beyond human comfort. Whatever work happens here requires conditions. The infrastructure provides them.

The lighting is bright but diffuse, designed to eliminate shadows without creating glare. Visibility matters here. Observation matters. The work requires both.`,
      x: -16,
      y: 1,
      z: -5,
      population: 0,
      ambientNoise: 25,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%5X15Y1',
      },
      objects: [
        { prototype: 'desk', name: 'a lab workstation', description: 'A sterile white workstation with built-in sinks and specimen trays.' },
        { prototype: 'desk', name: 'a lab workstation', description: 'A workstation with monitoring equipment and specimen containers.' },
        { prototype: 'cabinet', name: 'a specimen cabinet', description: 'A climate-controlled cabinet with glass doors, its contents obscured by condensation.' },
        { prototype: 'cabinet', name: 'a supply cabinet', description: 'A locked cabinet labeled with biohazard symbols.' },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-5 MAIN SPINE (x=-14, y=-5 to y=+1) - prefixed with 5 to avoid collision
    // ═══════════════════════════════════════════════════════════════════════

    '%5Y_4': {
      name: 'Deep Passage',
      description: `The passage rises from the entry shaft toward the command sections, the gradient slight but perceptible. The walls show construction that exceeds structural necessity—reinforced concrete over steel framing, the architecture of protection applied to a transit corridor.`,
      x: -14,
      y: -4,
      z: -5,
      population: 0,
      ambientNoise: 15,
      lighting: 25,
      waterLevel: 3,
      outdoor: false,
      exits: { north: '%WR', south: '%TD' },
    },

    '%5Y_2': {
      name: 'Deep Passage',
      description: `The passage connects the command center to the secured chamber ahead, the corridor narrowing as it approaches the vault. The construction grows more substantial, the walls showing additional reinforcement.`,
      x: -14,
      y: -2,
      z: -5,
      population: 0,
      ambientNoise: 8,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: { north: '%TV', south: '%WR' },
    },

    '%5Y0': {
      name: 'Deep Passage',
      description: `The passage continues north from the vault toward the private sections, the corridor maintaining the construction standards of the secured areas. The walls show no marks, no territorial symbols, the surfaces kept deliberately bare.`,
      x: -14,
      y: 0,
      z: -5,
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: { north: { room: '%SQ', door: '%QUARTERS_DOOR' }, south: '%TV' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-5 COMMAND CROSS (y=-3) - prefixed with 5
    // ═══════════════════════════════════════════════════════════════════════

    '%5X15Y_3': {
      name: 'Deep Passage',
      description: `The passage connects the archive to the central command section, the corridor serving the flow of information between storage and application.`,
      x: -15,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 12,
      lighting: 28,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%AR', east: '%WR' },
    },

    '%5X13Y_3': {
      name: 'Deep Passage',
      description: `The passage extends east from the command center toward the detention sections, the corridor serving as connection between decision and consequence.`,
      x: -13,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 15,
      lighting: 32,
      waterLevel: 0,
      outdoor: false,
      exits: { west: { room: '%WR', door: '%COMMAND_DOOR' }, east: '%5X12Y_3' },
    },

    '%5X12Y_3': {
      name: 'Deep Passage',
      description: `The passage runs straight here, the corridor stretching between the command center and the holding sections with no deviation or junction.`,
      x: -12,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 10,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%5X13Y_3', east: '%5X11Y_3' },
    },

    '%5X11Y_3': {
      name: 'Deep Passage',
      description: `The passage approaches the detention section, the corridor's character shifting as it nears its destination. The walls show additional reinforcement here.`,
      x: -11,
      y: -3,
      z: -5,
      population: 0,
      ambientNoise: 6,
      lighting: 38,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%5X12Y_3', east: { room: '%HC', door: '%CELLS_DOOR' } },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-5 UPPER CROSS (y=+1) - prefixed with 5
    // ═══════════════════════════════════════════════════════════════════════

    '%5X15Y1': {
      name: 'Deep Passage',
      description: `The passage connects the laboratory to the private quarters, a short corridor that serves a specific function—the movement of one person between two spaces that belong to her.`,
      x: -15,
      y: 1,
      z: -5,
      population: 0,
      ambientNoise: 18,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: { west: '%CL', east: '%SQ' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // Z=-6 THE BLIND
    // ═══════════════════════════════════════════════════════════════════════

    '%TB': {
      name: 'The Blind',
      description: `The shaft from above terminates in absolute darkness. Not the darkness of unlit spaces—that darkness has texture, depth, the potential for adjustment. This darkness is engineered, total, a void that swallows light at the threshold and returns nothing. The chamber exists beyond sight.

The walls are lined with materials that drink electromagnetic radiation—signals die here, frequencies fail, the invisible architecture of the connected world simply stops. The isolation is complete. Nothing transmits. Nothing receives. The chamber exists outside the spectrum that the city uses to see.

The air is different here, below the water table, the pressure perceptibly higher, the atmosphere thick with the mineral presence of deep earth. Moisture seeps through the walls despite the engineering, the water table asserting its presence at this depth. The chamber fights a constant battle against the tide.

Sound behaves strangely in the absolute dark—footsteps seem to come from everywhere, breathing fills the space, the absence of visual reference making every noise both intimate and vast. The chamber could be any size. The darkness makes measurement impossible.

Something waits here. Something is kept here. The architecture exists to contain it, to hide it, to make it unreachable by the systems that see everything else. The darkness is the point. The blindness is the purpose.`,
      x: -14,
      y: 1,
      z: -6,
      population: 0,
      ambientNoise: 0,
      lighting: 0,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: '%SQ',
      },
      objects: [
        { prototype: 'trunk', name: 'a waterproof container', description: 'A sealed container of unknown material, its surface slick with condensation in the perpetual dark.' },
      ],
    },
  },
};
