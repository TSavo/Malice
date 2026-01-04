// Doc Maynard's Public House - Ground Floor (z=0)
// Historic bar named for Seattle founding father David "Doc" Maynard
// Underground Tour departure point, part of the buried city

export const building = {
  name: "Doc Maynard's Public House",
  x: -15,
  y: 2,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Pub Lock',
      description:
        'A heavy brass deadbolt, the mechanism old but well-maintained.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Pub Entrance',
      description:
        "A heavy wooden door with brass hardware and a small window at eye level. A sign above reads DOC MAYNARD'S PUBLIC HOUSE in gold letters on green. The door is scratched and dented from a century of shoulders pushing through.",
      locked: false,
      open: false,
      locks: ['%FRONT_LOCK'],
      material: 'wood',
      durability: 70,
    },
    '%CELLAR_LOCK': {
      prototype: 'lock',
      name: 'Cellar Lock',
      description:
        'A padlock securing the cellar hatch, the mechanism corroded but functional.',
      difficulty: 4,
    },
    '%CELLAR_HATCH': {
      prototype: 'door',
      name: 'Cellar Hatch',
      description:
        'A heavy wooden hatch set into the floor behind the bar, its iron hinges thick with age. A padlock secures the hasp.',
      locked: true,
      open: false,
      locks: ['%CELLAR_LOCK'],
      material: 'wood',
      durability: 65,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Emergency Exit',
      description:
        'A steel door marked EMERGENCY EXIT - ALARM WILL SOUND. The door is secured from the outside—won\'t budge more than an inch. Something heavy is blocking it. The alarm wiring hangs disconnected.',
      locked: true,
      open: false,
      locks: [],
      material: 'metal',
      durability: 75,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BAR
    // ═══════════════════════════════════════════════════════════════════

    '%BAR': {
      name: "Doc Maynard's - Bar",
      description: `The bar is a monument to Seattle's founding, named for the man who gave Pioneer Square its layout and died before he could see what it became. Doc Maynard was a drunk and a dreamer and a friend to everyone who needed one—the perfect patron saint for a drinking establishment.

The bar itself is dark mahogany, polished by generations of elbows, scarred by decades of glasses set down too hard. Brass rails run along the base and the edge, tarnished to brown but still solid. Bottles line the mirrored back bar—whiskey, bourbon, gin, the taxonomy of spirits that outlast the people who drink them.

Old photographs cover the walls: Seattle in the 1890s, the waterfront before the seawall, the streets before the regrading, the city that was buried to become the city that exists now. The Underground Tour launched from here for sixty years, guides leading tourists down into the darkness beneath the streets. The tours stopped. The darkness remains.`,
      x: -15,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y2.ts',
          description: 'The heavy wooden door leads to 1st Ave S',
          door: '%FRONT_DOOR',
        },
        north: '%TOUR_ROOM',
        west: '%BACK_ROOM',
        down: {
          description: 'A hatch behind the bar leads down to the cellar',
          door: '%CELLAR_HATCH',
          to: '%CELLAR',
        },
      },
      sittables: [
        {
          name: 'a bar stool',
          capacity: 10,
          emptyMsg:
            'Wooden bar stools line the mahogany bar, their seats worn smooth by decades of drinkers.',
          occupiedMsg: '%s sitting at the bar',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'mahogany bar',
          aliases: ['bar', 'counter'],
          description: `A massive mahogany bar, the centerpiece of the establishment. The wood is dark with age, polished to a shine in places, scarred by cigarette burns and glass rings in others. Brass rails run along the base and edge, worn smooth by feet and hands. This bar has served drinks through Prohibition (quietly), the Depression (grimly), and every decade since (steadily). It will probably outlast everything else in the building.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'back bar',
          aliases: ['bottles', 'liquor', 'spirits'],
          description: `The back bar is a Victorian showpiece—carved mahogany shelves, mirrors that multiply the bottles into infinite recession, brass fixtures that were impressive in 1890 and are impressive now. The bottles are dusty but full: whiskey, bourbon, gin, vodka, the staples of drinking arranged by type and price. The expensive stuff is on the top shelf, out of easy reach. The cheap stuff is at elbow height, for quick pours.`,
        },
        {
          prototype: 'describable',
          name: 'historic photographs',
          aliases: ['photographs', 'photos', 'pictures'],
          description: `Framed photographs cover every available wall space, documenting Seattle's transformation from mudflat to metropolis. The oldest show the waterfront before the seawall, ships tied to piers that no longer exist. Others show the Great Fire of 1889, the regrading that buried the original streets, the construction of the buildings that stand today. Each photograph is a window into a city that was demolished to build the present.`,
        },
        {
          prototype: 'describable',
          name: 'Doc Maynard portrait',
          aliases: ['portrait', 'Maynard', 'Doc'],
          description: `A portrait of David "Doc" Maynard hangs above the bar—the founder of Pioneer Square, Seattle's first physician, and by most accounts an amiable drunk who gave away more than he sold. The portrait shows a bearded man in 19th-century dress, his expression suggesting someone who found the whole thing amusing. He died broke and beloved. The bar named for him outlived him by a century and a half.`,
        },
      ],
    },

    '%TOUR_ROOM': {
      name: "Doc Maynard's - Tour Room",
      description: `The tour staging area occupies what was once a back dining room, converted decades ago into the launch point for the Underground Tour. Benches line the walls, seating for the groups that gathered before descending into the buried streets. A podium stands at the front, where guides delivered the pre-tour orientation—history, safety warnings, the jokes they'd told ten thousand times.

Display cases show artifacts from the Underground: bottles, china fragments, the detritus of businesses that operated at street level before the streets were raised. A scale model of Pioneer Square circa 1889 sits under glass, tiny buildings that will be buried in the disaster to come.

A heavy steel door at the back is padlocked shut, a chain looped through the handles. This was the tour entrance—stairs descending into the buried city beyond. The door is sealed now, the tours long over. A faded sign reads AUTHORIZED PERSONNEL ONLY.`,
      x: -15,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%BAR',
        west: '%BACK_ROOM',
      },
      sittables: [
        {
          name: 'tour benches',
          capacity: 20,
          emptyMsg:
            'Wooden benches line the walls, seating for tour groups that no longer gather.',
          occupiedMsg: '%s sitting on the tour benches',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'artifact displays',
          aliases: ['display', 'cases', 'artifacts'],
          description: `Glass display cases hold artifacts recovered from the Underground: medicine bottles, clay pipes, shards of china with partial patterns, the everyday objects of businesses that operated at street level before the fire. Small placards identify each item: RECOVERED FROM BENEATH 1ST AVE, CIRCA 1890. The objects are mundane—that's the point. Ordinary life, buried and preserved.`,
        },
        {
          prototype: 'describable',
          name: 'Pioneer Square model',
          aliases: ['model', 'diorama'],
          description: `A scale model of Pioneer Square before the Great Fire of 1889, built with painstaking detail under a glass case. Tiny wooden buildings crowd tiny muddy streets. The waterfront is visible, ships at anchor. Everything in this model is about to burn, or be buried, or both. The model captures a moment before catastrophe, preserved under glass like a warning.`,
        },
        {
          prototype: 'describable',
          name: 'tour podium',
          aliases: ['podium', 'lectern'],
          description: `A wooden podium where tour guides delivered their introductory presentations—the history of the fire, the burial of the streets, the safety rules for descending into darkness. Notes are still taped to the podium's surface, bullet points for a speech given thousands of times: "WAIT FOR EVERYONE TO GATHER." "WATCH YOUR HEAD." "NO FLASH PHOTOGRAPHY." The notes are yellowed. The tours are over.`,
        },
      ],
    },

    '%BACK_ROOM': {
      name: "Doc Maynard's - Back Room",
      description: `The back room served multiple purposes over the years—storage, office, overflow seating on busy nights, and according to rumor, poker games that ran from midnight to dawn. The current configuration is haphazard: a desk shoved against one wall, kegs stacked in a corner, chairs and tables stored upside-down for a reorganization that never happened.

A steel emergency exit door is visible in the west wall, marked EMERGENCY EXIT - ALARM WILL SOUND. The door has been secured from the outside—something heavy is blocking it, judging from the way it doesn't budge when tested. The alarm is long disconnected, but the exit is no longer viable.

A narrow stairway leads up to the second floor, where the building's original hotel rooms were converted to storage and offices decades ago.`,
      x: -16,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%BAR',
        north: '%TOUR_ROOM',
        up: {
          description: 'A narrow stairway leads up',
          to: '%STORAGE',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'stacked kegs',
          aliases: ['kegs', 'barrels'],
          description: `Stainless steel kegs stacked three high in the corner—the inventory of a bar that expected to reopen. The kegs are probably still pressurized, their contents preserved by the same technology that keeps beer drinkable for months. Whether that beer is still drinkable after years is a question someone might eventually answer.`,
          boltedDown: true,
        },
        {
          prototype: 'desk',
          name: 'office desk',
          aliases: ['desk'],
          description: `A metal desk shoved against one wall, its surface covered in bar paperwork: invoices, inventory lists, schedules marked with shift changes. A calculator sits beside a stack of receipts, its display showing a number that was important once. The desk lamp is the adjustable kind, bent toward the paperwork, dark now.`,
        },
        {
          prototype: 'describable',
          name: 'stored furniture',
          aliases: ['chairs', 'tables', 'furniture'],
          description: `Chairs and tables stacked upside-down against one wall, the configuration of a room being rearranged. The furniture is mismatched—different eras, different styles, the accumulated seating of a bar that replaced what broke and kept what worked. The reorganization was never completed. The furniture waits, inverted, for a purpose it won't receive.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // CELLAR (z=-1) - UNDERGROUND ACCESS
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR': {
      name: "Doc Maynard's - Cellar",
      description: `The cellar beneath Doc Maynard's is older than the bar above it—brick walls that predate the Great Fire, a floor of packed earth with flagstones in the high-traffic areas. This was basement level once, before the streets were raised and the basements became ground floors and the ground floors became underground.

Kegs and cases line the walls, the bar's reserve inventory dusty but intact. An ancient refrigeration unit hums in one corner, somehow still keeping things cold, its compressor rattling with the effort of decades. The unit probably shouldn't work. It does.

The cinderblock seal that once closed the old tour entrance has been broken through—someone removed enough blocks to create a passage. The Underground Tour descended here for sixty years before the tours stopped. Now the passage is open again, leading east into the buried streets of old Seattle.`,
      x: -15,
      y: 2,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          description: 'A ladder leads up to the bar',
          to: '%BAR',
        },
        east: {
          to: 'underground/upper-tunnels/x-14-y2.ts',
          description: 'A breach in the cinderblock wall leads into the Underground',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'beer storage',
          aliases: ['kegs', 'cases', 'inventory'],
          description: `Cases of bottled beer stacked against the brick walls, their cardboard packaging damp but intact. The brands are familiar—local microbrews, national distributors, the variety of a bar that served diverse tastes. Some bottles have burst from freezing and thawing cycles. Others remain sealed, their contents potentially still drinkable. The dust suggests no one has tested that theory.`,
        },
        {
          prototype: 'describable',
          name: 'breached passage',
          aliases: ['passage', 'tunnel', 'underground', 'breach'],
          description: `A rough-cut passage in the east wall where the cinderblock seal was broken through. The blocks lie scattered on the floor, removed with crowbars rather than demolished. Tour groups descended through here for sixty years before the tours stopped. Someone reopened the route. The Underground breathes through the gap, cold air carrying the smell of old brick and older secrets.`,
        },
        {
          prototype: 'furniture',
          name: 'ancient refrigerator',
          aliases: ['fridge', 'refrigerator', 'cooler'],
          description: `An ancient refrigeration unit, probably older than anyone who worked here, still humming in the corner. The compressor rattles. The seals are cracked. The temperature gauge reads 40°F, which is close enough to food-safe. The unit runs on the same mysterious power that keeps certain systems functioning when they shouldn't. Nobody questions it. The beer stays cold.`,
          boltedDown: true,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1)
    // ═══════════════════════════════════════════════════════════════════

    '%STORAGE': {
      name: "Doc Maynard's - Storage",
      description: `The second floor was hotel rooms once, before the building was converted to commercial use. The original room divisions are still visible—doorframes bricked in, walls partially demolished to create open storage space. Old wallpaper peels from what remains, floral patterns from the 1920s fading into whatever was beneath.

Boxes and crates fill the space, bar supplies and tour merchandise and decades of accumulated junk that nobody threw away. Underground Tour t-shirts in boxes never opened. Cases of souvenir shot glasses. Promotional materials for events that happened before most survivors were born.

A narrow stairway continues up to the roof access, its steps worn concave by a century of feet.`,
      x: -15,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%BACK_ROOM',
        north: '%OFFICE',
        up: {
          description: 'A stairway continues up to the roof',
          to: '%ROOF_SE',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'storage boxes',
          aliases: ['boxes', 'crates', 'merchandise'],
          description: `Cardboard boxes stacked floor to ceiling, their contents labeled in marker: TOUR SHIRTS L, SHOT GLASSES, PROMO MATERIALS 2015. The merchandise of a business that expected to continue operating. Some boxes have been opened, their contents rummaged. Others remain sealed, inventory for a gift shop that will never reopen.`,
        },
        {
          prototype: 'describable',
          name: 'old wallpaper',
          aliases: ['wallpaper', 'walls'],
          description: `The original hotel wallpaper is visible in patches—floral patterns in colors that were fashionable a century ago, faded now to suggestions of their original hues. The wallpaper peels where moisture has worked its way in, curling back to reveal older layers beneath. The building's history is readable in its walls, each layer a chapter.`,
        },
      ],
    },

    '%OFFICE': {
      name: "Doc Maynard's - Office",
      description: `The manager's office occupies what was once a hotel room, its bathroom converted to storage, its window overlooking the alley. The desk is cluttered with the paperwork of bar management: liquor licenses, health inspections, employee files, the bureaucracy of keeping a business running.

Framed awards line one wall: BEST BAR IN PIONEER SQUARE 2012. SEATTLE MAGAZINE TOP 50. HISTORIC PRESERVATION AWARD 1989. The accolades accumulated over decades, evidence of a business that cared about its reputation and its history.

A small safe sits in the corner, door ajar, contents gone. Someone knew it was here. Someone had the combination, or the tools.`,
      x: -15,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STORAGE',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'manager desk',
          aliases: ['desk'],
          description: `A wooden desk cluttered with bar paperwork: liquor licenses in frames, health inspection certificates, employee schedules, the administrative overhead of running an establishment. A nameplate reads MANAGER, generic and interchangeable. A family photo shows someone's kids, ages uncertain, faces smiling.`,
        },
        {
          prototype: 'describable',
          name: 'awards wall',
          aliases: ['awards', 'certificates'],
          description: `Framed awards and certificates document the bar's recognition over decades: best bar awards, preservation honors, neighborhood association certificates. BEST CRAFT COCKTAILS 2018. PIONEER SQUARE BUSINESS OF THE YEAR 2007. Each frame is a moment of pride, now dusty and irrelevant.`,
        },
        {
          prototype: 'cabinet',
          name: 'empty safe',
          aliases: ['safe'],
          description: `A floor safe in the corner, its door hanging open, interior empty. The safe is old—1950s construction, the kind with a combination dial and heavy steel walls. Whatever it held—cash, probably, maybe documents—is gone. The safe remains, too heavy to move, too obsolete to repurpose.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SE': {
      name: "Doc Maynard's - Roof (Southeast)",
      description: `The roof of Doc Maynard's offers views east toward the heart of Pioneer Square—the park visible through gaps between buildings, the brick facades of nineteenth-century commercial blocks, the compressed history of Seattle's oldest neighborhood.

HVAC equipment dominates this corner, the machinery that once kept the bar cool in summer. The units are silent now, their compressors seized, their purpose ended. Ductwork snakes across the roof surface, terminating in vents that exhale nothing.

A weathered wooden deck suggests someone used this space for breaks or parties—the boards are stained with spilled drinks, and a few lawn chairs have been left out so long they're rusting in place.`,
      x: -15,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%STORAGE',
        north: '%ROOF_NE',
        west: '%ROOF_SW',
      },
      sittables: [
        {
          name: 'a rusted lawn chair',
          capacity: 2,
          emptyMsg:
            'Rusted lawn chairs sit on the weathered deck, left out for seasons beyond counting.',
          occupiedMsg: '%s sitting in the rusted chairs',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'rooftop deck',
          aliases: ['deck', 'boards'],
          description: `A wooden deck covering part of the roof, its boards weathered grey and stained with the residue of spilled drinks and old parties. The deck was someone's project—an attempt to make the rooftop usable, a space for staff breaks or private gatherings. The attempt succeeded, for a while.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'HVAC equipment',
          aliases: ['hvac', 'units'],
          description: `Commercial HVAC units squat on concrete pads, their housings weathered, their fans frozen. The equipment cooled the bar below, maintaining the comfortable temperature that drinking establishments require. The cooling has stopped. The bar below is whatever temperature the building achieves on its own.`,
          boltedDown: true,
        },
      ],
    },

    '%ROOF_NE': {
      name: "Doc Maynard's - Roof (Northeast)",
      description: `The northeast corner of the roof overlooks the alley and the back of the buildings facing Washington Street. The view is utilitarian—fire escapes, dumpsters, the service infrastructure that cities hide from their public faces.

An old neon sign leans against the parapet, its tubes broken, its transformer missing. The sign reads PUBLIC HOUSE in script letters, probably removed during a renovation and never reinstalled. The sign is too large to move easily, so it remains, a monument to signage past.

From here you can see north toward the blocks where Pioneer Square gives way to downtown, the street grid shifting angle where Seattle's founders couldn't agree which way was proper north.`,
      x: -15,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'old neon sign',
          aliases: ['sign', 'neon'],
          description: `A broken neon sign leaning against the parapet, its tubes cracked, its transformer box missing. The sign reads PUBLIC HOUSE in flowing script, the letters sized for visibility from the street. The sign was removed during some renovation and never reinstalled—too large to move, too damaged to repair, it became rooftop furniture.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: "Doc Maynard's - Roof (Southwest)",
      description: `The southwest corner of the roof offers views toward the waterfront, though taller buildings block most of the sightline. What's visible is a sliver of Elliott Bay, grey water matching grey sky at an uncertain horizon.

A fire escape descends from here, iron stairs switchbacking down to the alley. The structure is old but sound—Victorian construction that was built to last even when the Victorians are gone. The final ladder is the drop-down type, currently latched in the raised position.

Graffiti covers the parapet wall, tags accumulated over years of unauthorized rooftop access. The most elaborate piece shows a ghost emerging from underground, arms raised, caption reading THE DEAD RISE.`,
      x: -16,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 15,
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
          aliases: ['escape', 'stairs'],
          description: `An iron fire escape descending the building's west face, switchbacking down to the alley below. The ironwork is old but sturdy—the kind of construction that outlasts the people who built it. The final ladder is the drop-down type, latched in the raised position, requiring release from above.`,
        },
        {
          prototype: 'describable',
          name: 'ghost graffiti',
          aliases: ['graffiti', 'mural', 'art'],
          description: `A graffiti mural covers part of the parapet—a spectral figure emerging from stylized underground passages, arms raised, face blank. The caption reads THE DEAD RISE in dripping letters. The piece is skilled, probably the work of someone who knew the Underground Tour history. The dead beneath Pioneer Square aren't rising, but they're not gone either.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: "Doc Maynard's - Roof (Northwest)",
      description: `The northwest corner of the roof is the most exposed, with sightlines north and west but also visible from the street below. A water tank stood here once—the mounting brackets remain, bolted to a concrete pad, supporting nothing.

The view north shows the collision of Seattle's street grids, where Pioneer Square's cardinal orientation gives way to downtown's angled streets. The city was built by people who couldn't agree on directions. The disagreement is permanently encoded in asphalt and concrete.

A weathered bench sits near the parapet edge, positioned for sunset views that are more theoretical than practical—Seattle's clouds usually obscure the horizon before the sun can reach it.`,
      x: -16,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      sittables: [
        {
          name: 'a weathered bench',
          capacity: 3,
          emptyMsg:
            'A weathered wooden bench faces west, positioned for sunsets that Seattle rarely delivers.',
          occupiedMsg: '%s sitting on the weathered bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'water tank mounts',
          aliases: ['mounts', 'brackets', 'tank'],
          description: `Iron mounting brackets bolted to a concrete pad, the remains of a water tank that was removed or collapsed. The brackets are rusted but sturdy, still capable of supporting significant weight. The tank they held is gone—salvaged for metal, probably, or simply rotted away. The infrastructure remains, waiting for a tank that won't be installed.`,
        },
      ],
    },
  },
};
