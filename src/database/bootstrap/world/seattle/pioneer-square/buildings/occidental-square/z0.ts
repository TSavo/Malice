// Occidental Square Storefronts - Ground Floor (z=0)
// Mixed retail along Occidental Avenue, facing the park
// Historic brick buildings with ground-floor commercial space

export const building = {
  name: 'Occidental Square',
  x: -8,
  y: 0,
  width: 2,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%GALLERY_LOCK': {
      prototype: 'lock',
      name: 'Gallery Lock',
      description:
        'A modern cylinder lock, the brass finish oxidized to dark brown.',
      difficulty: 3,
    },
    '%GALLERY_DOOR': {
      prototype: 'door',
      name: 'Gallery Entrance',
      description:
        'A glass door with brushed steel frame, the gallery name etched in frosted letters: OCCIDENTAL ARTS COLLECTIVE. A CLOSED sign hangs permanently in the window.',
      locked: false,
      open: false,
      locks: ['%GALLERY_LOCK'],
      material: 'glass',
      durability: 35,
    },
    '%COFFEE_LOCK': {
      prototype: 'lock',
      name: 'Coffee Shop Lock',
      description: 'A worn brass lock, the keyhole scratched from years of use.',
      difficulty: 2,
    },
    '%COFFEE_DOOR': {
      prototype: 'door',
      name: 'Coffee Shop Door',
      description:
        "A wooden door with a large glass panel, PIONEER COFFEE ROASTERS painted in gold leaf that's flaking at the edges. The door stands slightly open, wedged by a doorstop that no one removed.",
      locked: false,
      open: true,
      locks: ['%COFFEE_LOCK'],
      material: 'wood',
      durability: 55,
    },
    '%BOOKSTORE_LOCK': {
      prototype: 'lock',
      name: 'Bookstore Lock',
      description:
        'An antique brass lock, the mechanism stiff but functional.',
      difficulty: 3,
    },
    '%BOOKSTORE_DOOR': {
      prototype: 'door',
      name: 'Bookstore Entrance',
      description:
        "A heavy wooden door painted dark green, a brass bell mounted above that jingles when the door moves. The transom window above reads PIONEER SQUARE BOOKS - EST. 1978 in gold letters.",
      locked: false,
      open: false,
      locks: ['%BOOKSTORE_LOCK'],
      material: 'wood',
      durability: 65,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - STOREFRONTS
    // ═══════════════════════════════════════════════════════════════════

    '%GALLERY': {
      name: 'Occidental Arts Collective',
      description: `A cooperative gallery space that served Pioneer Square's art scene before the world simplified. The walls are gallery white, track lighting aimed at hooks where paintings used to hang. Most of the art is gone—looted, traded, or taken by artists who needed their work more than they needed it displayed.

What remains tells a story of what couldn't be carried: large sculptures too heavy to move, installations bolted to the walls, a massive canvas that won't fit through the door. A steel spiral that reaches from floor to ceiling. A wall of license plates arranged into a map of the continental United States. A glass case containing a diorama of Pioneer Square made entirely from recycled electronics.

The gallery was artist-run, the placard on the wall explains. Twenty members sharing costs, taking turns staffing the desk. The desk is empty now. The members have scattered. The art remains, unsigned, unsold, unexplained.`,
      x: -8,
      y: 0,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'alleys/x-9-y1.ts',
          description: 'The glass door opens onto Occidental Avenue',
          door: '%GALLERY_DOOR',
        },
        north: '%COFFEE',
        up: {
          description: 'A narrow stairway leads to the upper floors',
          to: '%UPPER_SOUTH',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'spiral sculpture',
          aliases: ['sculpture', 'spiral', 'steel'],
          description: `A massive steel sculpture spirals from floor to ceiling, its polished surface reflecting the dim gallery light. The piece is maybe twelve feet tall, too heavy and too awkward to remove. The artist's name is engraved on a small plaque at the base: RIVERA, 2019. The sculpture has no title, or the title was on a card that's been taken.`,
        },
        {
          prototype: 'describable',
          name: 'license plate map',
          aliases: ['map', 'plates', 'license plates'],
          description: `An entire wall covered in license plates arranged to form a map of the continental United States—each state represented by a plate from that state. Alaska and Hawaii are mounted separately, in the corner. The plates span decades, from vintage porcelain to modern reflective. Someone spent years collecting these. The map is complete except for North Dakota, which is represented by a hand-painted wooden rectangle.`,
        },
        {
          prototype: 'cabinet',
          name: 'electronics diorama',
          aliases: ['diorama', 'model', 'electronics'],
          description: `A glass display case containing a detailed model of Pioneer Square constructed entirely from recycled electronics. Circuit boards form the streets. Capacitors stand in for pedestrians. A chip from an old computer serves as the totem pole in Occidental Park. The model is surprisingly accurate—you can identify individual buildings, trace the streets. Someone knew this neighborhood. Someone rendered it in salvage.`,
        },
      ],
    },

    '%COFFEE': {
      name: 'Pioneer Coffee Roasters',
      description: `A neighborhood coffee shop of the species that once populated Seattle like starlings—exposed brick, reclaimed wood, a massive espresso machine that gleams like a temple altar. The smell of coffee persists, somehow, absorbed into the walls and furniture over years of roasting and brewing.

The roaster itself dominates the back of the shop: a vintage Probat drum roaster, cast iron and brass, its hopper still containing dried green beans that will never be roasted. The bags on the shelf behind the counter are labeled by origin—Ethiopia Yirgacheffe, Sumatra Mandheling, Colombia Huila—names that meant something when supply chains functioned.

Tables and chairs fill the front half, the mismatched furniture carefully curated for maximum artisanal authenticity. Chalkboard menus list drinks and prices in handwriting that someone practiced to look casual. The last drink made here is still sitting on the bar, a latte with a fern pattern drawn in the foam, now covered in a skin of mold.`,
      x: -8,
      y: 1,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'alleys/x-9-y1.ts',
          description: 'The wooden door opens onto Occidental Avenue',
          door: '%COFFEE_DOOR',
        },
        south: '%GALLERY',
        north: '%BOOKSTORE',
      },
      sittables: [
        {
          name: 'a cafe table',
          capacity: 4,
          emptyMsg:
            'Mismatched wooden tables and chairs fill the front of the shop, carefully arranged for that artisanal vibe.',
          occupiedMsg: '%s seated at a cafe table',
        },
        {
          name: 'the window counter',
          capacity: 3,
          emptyMsg:
            'A narrow counter runs along the front window, stools positioned for people-watching that no longer happens.',
          occupiedMsg: '%s perched at the window counter',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'Probat roaster',
          aliases: ['roaster', 'coffee roaster', 'probat'],
          description: `A vintage Probat drum roaster, the crown jewel of any serious coffee operation. Cast iron construction, brass fittings, a drum that held five pounds of beans per batch. The hopper still contains dried green beans—the last shipment, probably, ordered before supply chains collapsed. The roaster is cold, its controls frozen at the settings for a medium roast that never happened.`,
        },
        {
          prototype: 'furniture',
          name: 'espresso machine',
          aliases: ['espresso', 'coffee machine', 'machine'],
          description: `A two-group La Marzocco espresso machine, polished steel and clean lines, the kind of equipment that serious coffee shops invest in and maintain with religious devotion. The portafilters are still locked into the group heads, packed with old grounds now welded by moisture into solid pucks. The steam wands are crusted with dried milk. The machine was the heart of this place. The heart has stopped.`,
        },
        {
          prototype: 'describable',
          name: 'chalkboard menu',
          aliases: ['menu', 'chalkboard'],
          description: `A large chalkboard behind the counter lists the menu in carefully casual handwriting: Espresso $3. Macchiato $3.50. Cappuccino $4. Pour Over $4.50. The handwriting was practiced, part of the aesthetic. Single origin options are listed below with tasting notes: "bright acidity, notes of blueberry and jasmine." The prices are from another economy. The beans are from another world.`,
        },
      ],
    },

    '%BOOKSTORE': {
      name: 'Pioneer Square Books',
      description: `An independent bookstore of the vanishing species, the kind that survived Amazon through loyal customers and careful curation. The shelves are floor-to-ceiling, dark wood, stuffed with volumes organized by someone who loved books and had opinions about how they should be arranged. STAFF PICKS sits above one section. LOCAL AUTHORS above another.

The smell is pure bookstore: old paper, binding glue, the vanilla undertone of lignin breaking down. The books are still here—too heavy to carry, too abundant to loot systematically. What's been taken are the valuable editions, the rare signed copies that lived in a locked case near the register. The case is shattered, its contents gone. Everything else remains.

A tabby cat skeleton is curled on a cushion in the front window, bones arranged in the posture of sleep. The cat probably lived here, fed by customers and staff, growing old among the stacks. It died where it lived, in the window where sunlight fell. No one moved it. No one was left to.`,
      x: -8,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'alleys/x-9-y2.ts',
          description: 'The green door opens onto Occidental Avenue',
          door: '%BOOKSTORE_DOOR',
        },
        south: '%COFFEE',
      },
      sittables: [
        {
          name: 'a reading chair',
          capacity: 1,
          emptyMsg:
            'An overstuffed armchair sits in the corner, positioned near a lamp for optimal reading light.',
          occupiedMsg: '%s curled up in the reading chair',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'bookshelves',
          aliases: ['shelves', 'books', 'stacks'],
          description: `Floor-to-ceiling bookshelves line every wall, dark wood overflowing with volumes. The organization is idiosyncratic: Fiction by author, except when it's by subgenre. Local History in its own section. Poetry crammed into a corner like an afterthought. The spines are cracked, the covers worn, the books clearly loved and read and replaced on shelves by hands that cared about them.`,
        },
        {
          prototype: 'describable',
          name: 'broken display case',
          aliases: ['case', 'display', 'cabinet'],
          description: `A glass display case near the register, its front panel shattered, its shelves empty. This was where the valuable editions lived—first editions, signed copies, the books worth enough to lock up. Someone knew what they were taking. The broken glass has been swept aside but not cleaned up. The absence speaks louder than presence.`,
        },
        {
          prototype: 'describable',
          name: 'cat skeleton',
          aliases: ['skeleton', 'cat', 'bones'],
          description: `In the front window, curled on a sun-faded cushion, a tabby cat skeleton rests in the posture of sleep. The bones are small and delicate, arranged exactly as they would be in life, as if the cat simply dreamed itself into permanence. A collar around the neck bones reads DEWEY in tiny letters. The bookstore cat, named for the decimal system, died in its window, in its shop, surrounded by its books. No one was left to bury it.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1)
    // ═══════════════════════════════════════════════════════════════════

    '%UPPER_SOUTH': {
      name: 'Occidental Square - Upper Hall (South)',
      description: `The second floor of the Occidental Square building, converted long ago from residential to commercial use. The hallway is narrow, doors lining both sides—offices that once housed therapists, accountants, small businesses that needed cheap rent and didn't mind the stairs.

The carpet is worn through to the backing in the high-traffic areas. Water damage marks the ceiling in spreading stains. The building's age shows in every detail: the wooden door frames slightly out of square, the floor that slopes toward the center, the smell of old construction settling into itself.

Most of the office doors are locked, their contents presumably intact behind frosted glass panels that read things like JENNIFER HAYES, LMFT and PACIFIC NORTHWEST TAX SERVICES.`,
      x: -8,
      y: 0,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%GALLERY',
        north: '%UPPER_NORTH',
        up: {
          description: 'A narrow stairway continues up to the roof',
          to: '%ROOF_SW',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'office doors',
          aliases: ['doors', 'offices'],
          description: `Wooden doors with frosted glass panels line both sides of the hallway, each one leading to a small office. The glass panels bear the names of businesses and professionals: PACIFIC NORTHWEST TAX SERVICES. JENNIFER HAYES, LMFT. PIONEER SQUARE PROPERTY MANAGEMENT. The names persist. The businesses don't.`,
        },
        {
          prototype: 'describable',
          name: 'water damage',
          aliases: ['stains', 'ceiling'],
          description: `Brown water stains spread across the ceiling, documenting years of roof leaks. The stains follow the paths of hidden pipes and joists, creating organic patterns that map the building's internal architecture. The ceiling tiles sag in places, threatening collapse.`,
        },
      ],
    },

    '%UPPER_NORTH': {
      name: 'Occidental Square - Upper Hall (North)',
      description: `The northern end of the second-floor hallway terminates at a window overlooking Occidental Avenue. The window is cracked, letting in weather, but still intact enough to frame a view of the park and the buildings beyond.

More office doors line this section—a massage therapist, a small law practice, someone offering "holistic wellness consulting" according to the door sign. The doors are closed, locked, their contents sealed away.

A fire extinguisher hangs in its bracket, expired, its gauge reading empty. The exit sign above glows red, pointing toward a stairwell that leads down to an alley door.`,
      x: -8,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%UPPER_SOUTH',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'cracked window',
          aliases: ['window'],
          description: `A large window at the end of the hallway, its glass cracked in a spiderweb pattern but still holding together. Through the cracks, you can see Occidental Avenue, the park, the buildings opposite. Rain seeps in through the damaged seal, staining the floor below.`,
        },
        {
          prototype: 'describable',
          name: 'fire extinguisher',
          aliases: ['extinguisher'],
          description: `A fire extinguisher in its wall bracket, the gauge reading empty. The inspection tag shows a last check date from years ago. The extinguisher is useless for fire, though the bracket is sturdy enough to hold it in place indefinitely.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SW': {
      name: 'Occidental Square - Roof (Southwest)',
      description: `The rooftop of the Occidental Square building, a flat expanse of deteriorating roofing material patched and re-patched over decades. The view is mostly blocked by taller buildings, but gaps reveal glimpses of Pioneer Square below—the park, the street, the pedestrian life that used to fill them.

A rooftop garden occupies part of this corner, raised beds made from reclaimed timber. The plants have gone wild—tomatoes grown woody and sprawling, herbs bolted to seed, a tangle of vines that might once have been cucumbers. Urban farming, abandoned mid-season. The crops went unharvested. The plants kept trying.

The building's old signage—OCCIDENTAL SQUARE, painted in art deco letters—is visible from up here, though faded to near-illegibility.`,
      x: -8,
      y: 0,
      z: 2,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%UPPER_SOUTH',
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'rooftop garden',
          aliases: ['garden', 'beds', 'planters'],
          description: `Raised garden beds made from reclaimed timber, once a tidy urban farm, now a jungle of neglected plants. Tomato vines have grown woody and sprawling, still producing small hard fruits. Herbs have bolted to seed, their flowers attracting what bees remain. Squash plants send tendrils over the bed edges, reaching for more space. The garden is more productive in its abandonment than it was under cultivation.`,
        },
        {
          prototype: 'describable',
          name: 'building signage',
          aliases: ['sign', 'signage'],
          description: `The building's original signage is visible from the roof edge—OCCIDENTAL SQUARE painted in art deco letters on the brick facade. The paint has faded to a ghost of its original red, barely readable against the weathered brick. The lettering style dates the sign to the 1920s, when art deco was modern.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Occidental Square - Roof (Northwest)',
      description: `The northwest corner of the rooftop overlooks the intersection where Occidental meets Main Street. From here you can see down into Occidental Park—the cobblestones, the totem pole, the empty benches where homeless people used to gather and tourists used to photograph.

A water tower stands in this corner, a relic from before the building connected to city water pressure. The wooden tank has long since rotted out, but the steel frame remains, supporting nothing but habit and rust.

Someone has strung lights between the water tower frame and the building's elevator housing—Christmas lights, probably, hung for some rooftop party and never taken down. The lights don't work, but they're still there, loops of green wire with empty sockets.`,
      x: -8,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'water tower frame',
          aliases: ['tower', 'water tower', 'frame'],
          description: `The steel frame of an old water tower, its wooden tank long since rotted away. The frame stands maybe twenty feet tall, a lattice of riveted steel that once supported thousands of gallons. Now it supports nothing but habit and rust. The structure is still sound, if you trust century-old metalwork.`,
        },
        {
          prototype: 'describable',
          name: 'dead lights',
          aliases: ['lights', 'christmas lights'],
          description: `Strings of Christmas lights loop between the water tower frame and the building, hung for some rooftop celebration and never removed. The lights are dead—bulbs burned out or wiring corroded—but the strings remain, green wire with empty sockets, a decoration for a party that ended and was never cleaned up.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Occidental Square - Roof (Southeast)',
      description: `The southeast corner of the rooftop offers views toward 2nd Avenue and the taller buildings of downtown Pioneer Square. The Smith Tower is visible from here, its white terra cotta gleaming against grey skies, a landmark that's outlasted every other structure in the neighborhood.

HVAC equipment clusters in this corner—rooftop units that cooled the offices below. The units are silent now, their compressors seized, their fans frozen. Whatever climate control the building once had died with the power. Or the power died and the climate control followed.

A fire escape descends from here, iron stairs zigzagging down the building's east face to the alley below.`,
      x: -7,
      y: 0,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'HVAC units',
          aliases: ['hvac', 'air conditioning'],
          description: `Rooftop HVAC units in various states of decay—some merely silent, others rusted through, a few with panels torn off to reveal the internal machinery. The units haven't run in years. Whatever cooling they once provided for the offices below is now provided by opening windows, if the windows still open.`,
        },
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'stairs'],
          description: `An iron fire escape descends the building's east face, switchbacking down three stories to the alley below. The iron is rusted, the platforms corroded, but the structure looks stable enough for someone willing to trust old metalwork. The final ladder section is the drop-down kind, currently pulled up and latched.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Occidental Square - Roof (Northeast)',
      description: `The northeast corner of the rooftop is the highest point on the building, where a small mechanical penthouse houses the elevator machinery. The elevator hasn't run in years—the cab is frozen somewhere between floors, the cables corroded—but the penthouse remains, a blocky concrete structure with a rusted door.

From here the view extends north toward Yesler Way, where Pioneer Square's grid collides with downtown's at an awkward angle. You can trace the street layout from above, see how the neighborhood was built before Seattle standardized its planning.

Someone has spray-painted a mural on the penthouse wall—abstract shapes in faded colors, nothing representational, just the assertion of presence in paint.`,
      x: -7,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'mechanical penthouse',
          aliases: ['penthouse', 'elevator housing'],
          description: `A blocky concrete structure housing the elevator machinery—motors, cables, pulleys, the mechanical works that moved the cab between floors. The door is rusted shut, the machinery inside presumably seized. The penthouse casts a shadow across part of the roof, creating a sheltered corner.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop mural',
          aliases: ['mural', 'graffiti', 'art'],
          description: `A spray-painted mural covers one wall of the mechanical penthouse—abstract shapes in faded blues and purples, sweeping curves that might suggest waves or wind or nothing at all. The style is confident, the execution skilled, the meaning obscure. Someone climbed up here with cans of paint and made something. The something remains.`,
        },
      ],
    },
  },
};
