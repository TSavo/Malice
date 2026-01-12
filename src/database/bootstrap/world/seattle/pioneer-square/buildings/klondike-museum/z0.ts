// Klondike Gold Rush National Historical Park - Ground Floor (z=0)
// National Park Service museum in the historic Cadillac Hotel building
// Commemorates Seattle's role as the "Gateway to the Gold Fields"

export const building = {
  name: 'Klondike Gold Rush Museum',
  x: -12,
  y: -3,
  width: 2,
  height: 2,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Museum Lock',
      description:
        'A modern deadbolt installed by the National Park Service, now corroded from disuse.',
      difficulty: 4,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Museum Entrance',
      description:
        'Double glass doors beneath a green awning, the National Park Service arrowhead logo etched into the glass. A sign reads KLONDIKE GOLD RUSH NATIONAL HISTORICAL PARK - SEATTLE UNIT. One door is propped open with a fire extinguisher.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 40,
    },
    '%STAFF_LOCK': {
      prototype: 'lock',
      name: 'Staff Door Lock',
      description:
        'A simple key lock on the staff door, the mechanism stiff with age.',
      difficulty: 3,
    },
    '%STAFF_DOOR': {
      prototype: 'door',
      name: 'Staff Door',
      description:
        'A plain wooden door marked STAFF ONLY in faded stencil. The door is slightly warped in its frame.',
      locked: true,
      open: false,
      locks: ['%STAFF_LOCK'],
      material: 'wood',
      durability: 60,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - MUSEUM
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Klondike Museum - Lobby',
      description: `The lobby of the Klondike Gold Rush National Historical Park occupies the ground floor of the Cadillac Hotel, a building that was already old when the Park Service took it over. The pressed-tin ceiling has been restored, its ornate patterns picked out in gold paint. The floor is worn hardwood, scarred by a century of boots.

A reception desk dominates the entrance, its surface covered in brochures that no one will ever take. WELCOME TO THE KLONDIKE reads a banner above the desk, the letters printed on fabric that has faded unevenly. A donation box sits on the counter, empty except for a few coins from the last visitors who thought museums still needed money.

The original hotel lobby is still visible beneath the museum overlay—the marble baseboards, the brass elevator doors (permanently closed), the ghost of a grand staircase now blocked by exhibit panels. The building remembers what it was. The museum was just its most recent tenant.`,
      x: -12,
      y: -3,
      z: 0,
      imageOnDisk: 'klondike-museum-lobby-x-12-y-3-z0.png',
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: '2nd-ave-s/y-3.ts',
          description: 'Glass doors lead to 2nd Ave S',
          door: '%FRONT_DOOR',
        },
        north: '%EXHIBITS',
        west: '%THEATER',
      },
      sittables: [
        {
          name: 'a lobby bench',
          capacity: 4,
          emptyMsg:
            'A wooden bench sits against the wall, the kind found in every national park lobby.',
          occupiedMsg: '%s sitting on the lobby bench',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'reception desk',
          aliases: ['desk', 'counter', 'reception'],
          description: `A curved reception desk of dark wood, its surface scratched and worn but still dignified. Brochures fan across the top—KLONDIKE GOLD RUSH TRAIL, JUNIOR RANGER PROGRAM, ACCESSIBILITY GUIDE. The brochures are faded and curled at the edges. A computer monitor sits dark on the desk, its screen dusty. The donation box is a clear acrylic cube, a few coins visible inside—the last contributions to a federal agency that no longer exists.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'welcome banner',
          aliases: ['banner', 'sign'],
          description: `A fabric banner stretches across the lobby: WELCOME TO THE KLONDIKE GOLD RUSH NATIONAL HISTORICAL PARK. The text is printed in a typeface meant to evoke the 1890s—serif letters with decorative flourishes. The fabric has faded unevenly, darker in the protected folds than the exposed faces. Smaller text below lists visitor information—hours, admission (free), guided tour times. The hours no longer apply. The tours no longer run.`,
        },
        {
          prototype: 'describable',
          name: 'brass elevator doors',
          aliases: ['elevator', 'lift'],
          description: `Ornate brass elevator doors from the building's hotel days, their surfaces tarnished to a dark brown. The doors are welded shut—a retrofit from when the Park Service converted the upper floors. An OUT OF ORDER sign has been zip-tied to the call button since before anyone can remember. The elevator shaft behind is silent, whatever machinery it once held long since removed or seized.`,
        },
      ],
    },

    '%EXHIBITS': {
      name: 'Klondike Museum - Main Exhibits',
      description: `The main exhibition hall tells the story of the Klondike Gold Rush through artifacts and interpretive panels, all of it frozen in the educational mode of federal museums—earnest, thorough, slightly dated. Display cases contain prospecting equipment: gold pans, pickaxes, the kind of small-scale mining technology that individual fortune-seekers carried north in 1897.

A replica of a prospector's pack sits in the center of the room, its contents spilling artfully across a wooden platform. The pack weighs a ton—literally, the sign explains, the Canadian Mounties required each prospector to bring a ton of supplies before crossing the border. The museum assembled an authentic ton and invited visitors to try lifting it. Nobody can.

Wall panels document Seattle's role in the rush: the outfitters who got rich selling supplies, the ships that departed for Alaska, the fortunes made and lost. Photographs of bearded men stare from the walls, their eyes reflecting dreams of gold that were realized for a few, crushed for most.`,
      x: -12,
      y: -2,
      z: 0,
      imageOnDisk: 'klondike-museum-main-exhibits-x-12-y-2-z0.png',
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LOBBY',
        west: '%SEATTLE_ROOM',
        up: {
          description: 'A stairwell leads up to the upper floors',
          to: '%UPPER_HALL',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'prospecting equipment display',
          aliases: ['display', 'equipment', 'tools'],
          description: `A glass display case containing the tools of gold prospecting: pans of various sizes, their surfaces scratched from use; a rocker box for separating gold from gravel; pickaxes with handles polished by hands that gripped them a century ago. Small placards identify each item with museum precision—provenance, date, donor. The gold these tools sought is long gone. The tools remain, displayed.`,
        },
        {
          prototype: 'furniture',
          name: "prospector's pack",
          aliases: ['pack', 'supplies', 'ton'],
          description: `A replica of a Klondike-bound prospector's pack, assembled to demonstrate the "ton of supplies" required by Canadian authorities. Sacks of flour and beans, crates of bacon, tins of condensed milk—the supplies stack on a wooden platform, roped together as they would have been for the climb over Chilkoot Pass. A sign invites visitors to TRY LIFTING IT. The pack hasn't moved in years. It weighs exactly 2,000 pounds.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'wall panels',
          aliases: ['panels', 'exhibits', 'photographs'],
          description: `Interpretive panels line the walls, each one a chapter in the Klondike story. THE DISCOVERY OF GOLD. THE STAMPEDE BEGINS. SEATTLE: GATEWAY TO THE GOLD FIELDS. THE CHILKOOT TRAIL. LIFE IN THE KLONDIKE. Photographs accompany each section—prospectors posed with their finds, ships packed with hopefuls, the tent cities that sprang up overnight. The faces in the photographs are determined, exhausted, occasionally elated. Most of them found nothing but hardship. The museum doesn't dwell on that.`,
        },
      ],
    },

    '%THEATER': {
      name: 'Klondike Museum - Theater',
      description: `A small screening room with tiered seating for maybe thirty visitors, the seats the kind of padded folding chairs that squeak when you shift your weight. The screen at the front is a pull-down affair, its surface slightly yellowed. A projector hangs from the ceiling, lens dusty, power indicator dark.

The room smells of old carpet and the musty staleness of enclosed spaces. Educational posters line the walls—THE CHILKOOT TRAIL, SEATTLE IN THE 1890s, GOLD! THE METAL THAT CHANGED THE WORLD. The posters are laminated, their surfaces bubbled and peeling at the edges.

The film they showed here was called "Gold Fever!" according to the placard by the door. It ran twenty-two minutes. The placard promises "an immersive journey into the heart of the Klondike Gold Rush." The journey is over. The fever has broken.`,
      x: -13,
      y: -3,
      z: 0,
      imageOnDisk: 'klondike-museum-theater-x-13-y-3-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        north: '%SEATTLE_ROOM',
      },
      sittables: [
        {
          name: 'theater seats',
          capacity: 30,
          emptyMsg:
            'Rows of padded folding seats face the blank screen, waiting for an audience that will never arrive.',
          occupiedMsg: '%s seated in the darkened theater',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'projector',
          aliases: ['screen', 'movie'],
          description: `A ceiling-mounted projector, the kind used in educational settings—sturdy, reliable, obsolete. Dust coats the lens housing. The power indicator is dark. The film it showed, "Gold Fever!", is probably still loaded, its reels waiting in the mechanism for a screening that will never happen. The screen hangs at the front of the room, pulled down and left there, its surface yellowed by time.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'educational posters',
          aliases: ['posters'],
          description: `Laminated educational posters cover the theater walls, each one a visual summary of some aspect of the gold rush. THE CHILKOOT TRAIL shows a line of prospectors climbing the infamous "Golden Stairs." SEATTLE IN THE 1890s depicts the city as it was—muddy streets, wooden buildings, ships crowding the harbor. The lamination is peeling at the corners, edges curling away from the wall. The information is still accurate. The context has changed entirely.`,
        },
      ],
    },

    '%SEATTLE_ROOM': {
      name: 'Klondike Museum - Seattle Gallery',
      description: `This gallery focuses on Seattle's role in the gold rush—the city that transformed itself into the "Gateway to the Gold Fields" and got rich selling dreams and supplies to dreamers. Display cases contain artifacts from Seattle's boomtown era: price lists from outfitters, newspaper headlines announcing gold discoveries, ledgers from merchants who made fortunes without ever seeing the Klondike.

A large map occupies one wall, tracing the routes from Seattle to the gold fields—by ship to Skagway or Dyea, over the Chilkoot or White Pass, down the Yukon to Dawson City. Push buttons were supposed to illuminate different portions of the route. The buttons don't work. The LEDs have burned out or the wiring has failed.

A model of the Seattle waterfront circa 1897 fills a display case, tiny ships at anchor, miniature prospectors crowding the docks. The model is exquisitely detailed—you can make out individual crates being loaded, figures waving goodbye. Someone spent hundreds of hours building this. It sits behind glass, unseen.`,
      x: -13,
      y: -2,
      z: 0,
      imageOnDisk: 'klondike-museum-seattle-gallery-x-13-y-2-z0.png',
      population: 0,
      ambientNoise: 3,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%EXHIBITS',
        south: '%THEATER',
        north: {
          door: '%STAFF_DOOR',
          description: 'A door marked STAFF ONLY',
          to: '%STAFF_AREA',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'merchant displays',
          aliases: ['displays', 'cases', 'artifacts'],
          description: `Display cases containing artifacts of Seattle's gold rush commerce: price lists from outfitters showing the cost of supplies in 1897 dollars, newspaper front pages screaming GOLD! in enormous type, ledger books from merchants who tracked their fortunes in columns of careful script. A reproduction of Cooper & Levy's famous "Complete Outfit" advertisement promises everything a prospector needs for $140.50. The original prospectors are long dead. Their receipts remain.`,
        },
        {
          prototype: 'furniture',
          name: 'route map',
          aliases: ['map', 'wall map'],
          description: `A large illuminated map showing routes from Seattle to the Klondike gold fields. The main routes are traced in brass strips set into the wooden backing: by ship to Skagway, over Chilkoot Pass, down the Yukon to Dawson. Push buttons at key points were meant to illuminate different legs of the journey with colored LEDs. The buttons are dead, the LEDs dark, but the brass routes still gleam, and you can trace the path with your finger the way thousands of hopefuls traced it with their boots.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'waterfront model',
          aliases: ['model', 'diorama'],
          description: `A detailed scale model of Seattle's waterfront in 1897, built with obsessive precision inside a glass display case. Tiny ships crowd the harbor—steamers bound for Alaska, their decks packed with prospector figurines. Miniature warehouses line the shore, their signs legible under magnification: SCHWABACHER BROS. HARDWARE, MORAN BROTHERS SHIP YARD. The model captures a moment of frantic commerce, a city making money from other people's dreams. The dreams are over. The model remains.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1) - STAFF AND STORAGE
    // ═══════════════════════════════════════════════════════════════════

    '%STAFF_AREA': {
      name: 'Klondike Museum - Staff Area',
      description: `Behind the public-facing museum, the workspace where rangers and volunteers kept the operation running. A cramped office with two desks pushed against the walls, filing cabinets stuffed with paperwork, a corkboard covered in schedules and memos that no longer matter.

The Park Service aesthetic continues here: government-issue furniture, motivational posters featuring national parks ("Find Your Park!"), a coffee maker that's been empty so long the carafe has cracked. A window looks out onto an airshaft, providing no view and minimal light.

A narrow stairway leads up to what used to be storage or additional office space. A reinforced door marked COLLECTION STORAGE leads down to the basement. A door to the north opens onto the back alley—the staff entrance, away from visitors.`,
      x: -13,
      y: -1,
      z: 0,
      imageOnDisk: 'klondike-museum-staff-area-x-13-y-1-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SEATTLE_ROOM',
        up: {
          description: 'A narrow stairway leads up',
          to: '%STORAGE',
        },
        down: {
          to: 'z-1.ts#%COLLECTION_STORAGE',
          description: 'A reinforced door leads down to collection storage',
          door: 'z-1.ts#%BASEMENT_DOOR',
          locks: ['z-1.ts#%BASEMENT_LOCK'],
        },
      },
      objects: [
        {
          prototype: 'desk',
          name: 'ranger desks',
          aliases: ['desks', 'office'],
          description: `Two metal desks, the kind the federal government has been buying since the 1960s—indestructible, ugly, functional. Papers are scattered across the surfaces: visitor count logs, maintenance requests, a half-finished crossword puzzle. A nameplate on one desk reads RANGER MARTINEZ. The ranger is gone. The nameplate remains.`,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['files', 'cabinets'],
          description: `Grey metal filing cabinets, four drawers each, stuffed with the paperwork of a federal agency. Volunteer schedules, incident reports, interpretive materials, grant applications. The bureaucracy of preservation, documented in manila folders and paper clips. None of it matters anymore, but it's all still here, filed alphabetically.`,
        },
        {
          prototype: 'describable',
          name: 'corkboard',
          aliases: ['board', 'bulletin'],
          description: `A corkboard covered in the ephemera of museum operation: staff schedules (outdated), safety reminders (still relevant), a flyer for a retirement party (never happened). Thumbtacked photographs show rangers posing with scout troops, school groups gathered in the lobby, a Christmas party with everyone wearing ranger hats. The people in the photos are scattered or gone. The photos remain pinned.`,
        },
      ],
    },

    '%UPPER_HALL': {
      name: 'Klondike Museum - Upper Hall',
      description: `The second floor of the Cadillac Hotel, converted from guest rooms to museum storage and offices long before the world changed. The hallway is narrow, the ceiling low—hotel construction from an era when people were shorter and expectations more modest. Doors line both sides, most of them locked or jammed.

The carpet is the same institutional grey as the lobby, worn to threads in the high-traffic areas. Water damage marks the ceiling in spreading brown stains—the roof has leaked, maybe still leaks, the moisture working its way down through layers of old construction.

Emergency exit signs glow red at each end of the hall, their batteries somehow still holding charge. The exits lead to fire escapes or stairwells or nowhere accessible. The signs don't know the building is abandoned.`,
      x: -12,
      y: -2,
      z: 1,
      imageOnDisk: 'klondike-museum-upper-hall-x-12-y-2-z1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%EXHIBITS',
        west: '%STORAGE',
        up: {
          description: 'A ladder leads up through a ceiling hatch to the roof',
          to: '%ROOF_SE',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'emergency signs',
          aliases: ['signs', 'exit'],
          description: `Red emergency exit signs glow at each end of the hallway, their battery-powered LEDs still functioning after all this time. The signs point toward stairwells and fire escapes—routes planned for an emergency that was nothing like the emergency that actually came. The signs persist, helpful in their irrelevance.`,
        },
        {
          prototype: 'describable',
          name: 'water damage',
          aliases: ['stains', 'ceiling'],
          description: `Brown water stains spread across the ceiling in organic patterns, the archaeology of leaks traced in mineral deposits. The stains are dry now, but they document years of moisture working through the building's old bones. The wallpaper near the stains has bubbled and peeled. The plaster beneath is soft, crumbling.`,
        },
      ],
    },

    '%STORAGE': {
      name: 'Klondike Museum - Storage',
      description: `The museum's storage room, converted from old hotel rooms, contains the artifacts that didn't make it into the public displays. Metal shelving units fill the space floor to ceiling, each shelf labeled with accession numbers and brief descriptions. Boxes contain overflow from the collection—more gold pans, more photographs, duplicates and donations that exceeded the exhibition's needs.

Climate control equipment hums in one corner, still functioning, maintaining the temperature and humidity that preserves paper and metal and fabric. The museum may be abandoned, but its collection is still being protected by machinery that doesn't know the curators are gone.

A small window has been blacked out with cardboard—light damage is the enemy of preservation. The room exists in permanent twilight, the stored history waiting in darkness for researchers who will never come.`,
      x: -13,
      y: -2,
      z: 1,
      imageOnDisk: 'klondike-museum-storage-x-13-y-2-z1.png',
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%STAFF_AREA',
        east: '%UPPER_HALL',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'archival shelves',
          aliases: ['shelves', 'storage', 'archives'],
          description: `Metal shelving units hold the museum's reserve collection: boxes labeled with accession numbers, wrapped artifacts, photograph albums. The organization is meticulous—each box has a contents list, each item a location code. Museum standards, maintained by people who cared about preservation. The people are gone. The standards persist in labeled boxes and acid-free folders.`,
        },
        {
          prototype: 'describable',
          name: 'climate control',
          aliases: ['hvac', 'machinery'],
          description: `Climate control machinery hums in the corner—a dehumidifier, a temperature regulator, equipment designed to maintain the specific conditions that artifact preservation requires. The machines are still running, still maintaining 68 degrees and 45% relative humidity, still protecting the collection from the decay that would otherwise claim it. The museum has no staff, no visitors, no purpose, but it has climate control.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SE': {
      name: 'Klondike Museum - Roof (Southeast)',
      description: `The roof of the Cadillac Hotel, a flat expanse of tar and gravel punctuated by HVAC equipment and the blocky housing of the old elevator machinery. The view is limited by taller buildings on all sides, but through the gaps you can glimpse Pioneer Square stretching south, the waterfront to the west.

The rooftop is littered with the debris of decades: broken antennas, discarded maintenance equipment, the sun-bleached carcass of a plastic lawn chair someone dragged up here for smoke breaks. Pigeons have colonized the elevator housing, their droppings coating the concrete in grey-white streaks.

A rusted iron railing runs along the roof's edge, more suggestion than barrier. The railing is bent in places, as if something heavy leaned against it. The drops beyond are three stories to unforgiving pavement.`,
      x: -12,
      y: -2,
      z: 2,
      imageOnDisk: 'klondike-museum-roof-southeast-x-12-y-2-z2.png',
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%UPPER_HALL',
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'elevator housing',
          aliases: ['housing', 'machinery'],
          description: `The blocky concrete housing of the old elevator machinery rises from the rooftop, its door rusted shut. The elevator below has been sealed since the museum conversion, but the machinery room remains, probably full of seized gears and cut cables. Pigeons roost on the housing, their cooing audible from inside.`,
        },
        {
          prototype: 'describable',
          name: 'plastic lawn chair',
          aliases: ['chair', 'lawn chair'],
          description: `A sun-bleached plastic lawn chair, the kind you buy at hardware stores for ten dollars, sits near the roof access. The plastic has faded from green to a sickly yellow-grey. Someone dragged this up here for breaks—smoking, probably, or just escaping the museum's educational earnestness. The chair is still functional, if you don't mind sitting in pigeon droppings.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'Klondike Museum - Roof (Southwest)',
      description: `The southwest corner of the rooftop overlooks the back alley and the buildings beyond. An old fire escape descends from here, its iron structure rusted but probably still usable—if you trust century-old metalwork to support your weight.

HVAC units cluster in this corner, their fans still spinning, their compressors still humming. Whatever power keeps the museum's climate control running also powers these units. The air above them shimmers with heat exhaust, distorting the view.

Graffiti covers the parapet wall—tags and throw-ups accumulated over years. SEAZ. KRON. GHOST. The rooftop was a destination for urban explorers before urban exploration became survival strategy. Their marks remain, documenting presence in spray paint and marker.`,
      x: -13,
      y: -2,
      z: 2,
      imageOnDisk: 'klondike-museum-roof-southwest-x-13-y-2-z2.png',
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_SE',
        north: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'ladder'],
          description: `An iron fire escape clings to the building's southwest corner, its ladder extending down to the alley below. The ironwork is rusted, the bolts corroded, but the structure still seems sound—the Victorians built to last. The final ladder section is the drop-down kind, designed to be lowered from above. It hangs at an angle, rust-frozen halfway between positions.`,
        },
        {
          prototype: 'furniture',
          name: 'HVAC units',
          aliases: ['hvac', 'air conditioning', 'units'],
          description: `Industrial HVAC units squat on concrete pads, their fans spinning, their compressors humming. The units are working hard, maintaining climate control for a museum with no visitors. Heat exhaust rises from their housings, creating pockets of warm air on the otherwise cool rooftop. The electricity that powers them comes from somewhere. The bills are not being paid. The power continues.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'graffiti',
          aliases: ['tags', 'spray paint'],
          description: `The parapet wall is covered in graffiti—overlapping tags, throw-ups, the occasional piece. SEAZ in bubble letters. KRON in sharp angles. GHOST in dripping silver. The rooftop was a destination, a canvas, a claim staked in spray paint. The artists have moved on or died or found other walls. Their marks remain, fading slowly in the weather.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Klondike Museum - Roof (Northeast)',
      description: `The northeast corner of the rooftop offers the best views—north toward Yesler Way and the Smith Tower's distant spire, east toward the hills rising beyond the freeway. The buildings nearby are lower here, opening sightlines that the rest of the roof lacks.

A weathered wooden platform suggests someone once used this spot for observation—a raised deck with a railing, like a lifeguard stand transplanted to an urban rooftop. The wood is grey and splintered, the railing gap-toothed where slats have fallen. The platform still supports weight, but it protests audibly.

Antenna mounts punctuate the roofline, their original equipment removed or stolen. The mounts remain, empty brackets pointing at the sky, waiting for signals that will never come.`,
      x: -12,
      y: -1,
      z: 2,
      imageOnDisk: 'klondike-museum-roof-northeast-x-12-y-1-z2.png',
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      sittables: [
        {
          name: 'the observation platform',
          capacity: 2,
          emptyMsg:
            'A weathered wooden platform rises above the roofline, offering elevated views of the surrounding neighborhood.',
          occupiedMsg: '%s standing on the observation platform',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'observation platform',
          aliases: ['platform', 'deck', 'lookout'],
          description: `A raised wooden platform, maybe four feet above the roof level, with a gap-toothed railing around its perimeter. Someone built this for observation—watching the neighborhood, the sunset, the city lights. The construction is amateur but sturdy, the wood weathered to grey but still solid. The platform creaks under weight but holds.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'antenna mounts',
          aliases: ['antennas', 'mounts'],
          description: `Empty antenna mounts rise from the rooftop, their original equipment long since removed. The mounts are substantial—designed for serious communication equipment, radio or television transmission. The brackets point at the sky, waiting for dishes and antennas that were probably scrapped for metal. The view they once transmitted is still available, just not being broadcast.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Klondike Museum - Roof (Northwest)',
      description: `The northwest corner of the rooftop abuts the taller building next door, its brick wall rising another two stories and blocking the western view. The shadow of the adjacent building keeps this corner cooler, darker, more secluded than the rest of the roof.

A maintenance access panel is set into the roof surface here—probably leading to the elevator shaft or some other internal space. The panel is rusted shut, its edges sealed with decades of tar and weather. Whatever's below is inaccessible without tools.

The pigeons prefer this corner, roosting in the gap between buildings where they're sheltered from wind and weather. Their droppings cover everything—the roof surface, the maintenance panel, the rusted pipe that might once have vented something.`,
      x: -13,
      y: -1,
      z: 2,
      imageOnDisk: 'klondike-museum-roof-northwest-x-13-y-1-z2.png',
      population: 0,
      ambientNoise: 8,
      lighting: 70,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'maintenance panel',
          aliases: ['panel', 'hatch', 'access'],
          description: `A metal maintenance panel set flush with the roof surface, its edges sealed by years of tar and weather. The panel probably leads to the elevator shaft or some other internal space—maintenance access for systems that no longer function. The metal is rusted, the seal unbroken. Whatever's below stays below.`,
        },
        {
          prototype: 'describable',
          name: 'pigeon roost',
          aliases: ['pigeons', 'birds'],
          description: `Pigeons have claimed this corner, roosting in the gap between buildings where walls provide shelter. Dozens of birds occupy the ledges and protrusions, cooing and shuffling, their droppings coating every surface in grey-white mess. The birds watch you with the indifference of urban wildlife—humans are just part of the landscape, no more threatening than rain.`,
        },
      ],
    },
  },
};
