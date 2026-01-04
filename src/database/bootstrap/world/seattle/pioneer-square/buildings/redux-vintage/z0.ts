// Redux Vintage - Ground Floor (z=0)
// '70s vintage clothing store, frozen mid-arrangement

export const building = {
  name: 'Redux Vintage',
  x: -15,
  y: 4,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_TRAPDOOR': {
      prototype: 'door',
      name: 'Basement Trapdoor',
      description:
        'A wooden trapdoor in the back room floor, its edges worn smooth from years of opening and closing.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - VINTAGE CLOTHING STORE
    // ═══════════════════════════════════════════════════════════════════

    '%SHOWROOM': {
      name: 'Redux - Showroom',
      description: `The front of the store is a temple to disco-era excess. Chrome clothing racks line the walls, hung with sequined dresses, velvet blazers, polyester bell-bottoms in colors that assault the eye. The aesthetic is aggressive nostalgia—a celebration of an era when fabric was shiny and collars were wide.

The window display is frozen mid-arrangement. Two mannequins in full disco regalia—sequins, platform shoes, a feather boa that has shed onto the floor—stand posed as if caught mid-dance. A third mannequin has toppled backward and lies staring at the ceiling, its wig askew, its painted smile unchanged. Nobody righted it. Nobody was there to right it.

Fluorescent tubes flicker overhead, washing everything in harsh white light that makes the vintage fabrics look even older than they are. A cash register sits on the glass counter near the door, its drawer partially open, a few bills visible inside—not worth stealing, but not worth returning either.`,
      x: -15,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y4.ts',
          description: 'The glass door leads back to 1st Ave S',
        },
        west: '%BACKROOM',
        north: '%DRESSING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fallen mannequin',
          aliases: ['mannequin', 'toppled mannequin'],
          description: `A mannequin in a gold sequined dress lies on its back, staring at the ceiling with painted blue eyes. Its wig—a voluminous blonde number—has slipped to one side. One platform shoe has come off and rolled away. The smile remains fixed, patient, waiting for someone to right it. The help never came. The smile persists.`,
        },
        {
          prototype: 'describable',
          name: 'disco mannequins',
          aliases: ['mannequins', 'display mannequins'],
          description: `Two mannequins still standing in the window display, locked in eternal dance. One wears a silver jumpsuit with rhinestone trim and white platform boots. The other is draped in a purple feather boa over a sequined halter top. Their poses suggest the Hustle, or maybe just the desperate energy of people trying to forget something. The feathers have shed, littering the display floor.`,
        },
        {
          prototype: 'describable',
          name: 'cash register',
          aliases: ['register', 'till'],
          description: `An old mechanical cash register, the kind with physical buttons that clack when pressed. The drawer is partially open, revealing a few crumpled bills—fives and ones, maybe thirty dollars total. Not worth stealing. Not worth returning. The receipt tape has yellowed in its spool, the last sale recorded in faded purple ink: "$47.50 - DRESS (SEQ)."`,
        },
        {
          prototype: 'describable',
          name: 'clothing racks',
          aliases: ['racks', 'clothes racks'],
          description: `Chrome racks lining the walls, hung with the detritus of disco: sequined dresses in gold and silver, velvet blazers with wide lapels, polyester shirts in colors that hurt to look at—orange, chartreuse, electric blue. The fabrics are stiff with age, the sequins tarnished, but the optimism persists. Someone thought these clothes would come back in style. They were probably right.`,
        },
      ],
    },

    '%DRESSING': {
      name: 'Redux - Dressing Rooms',
      description: `A narrow corridor lined with dressing rooms, their velvet curtains drawn across brass rods. The curtains are deep purple, theatrical, designed to make trying on vintage feel like an event. The fabric has faded unevenly, darker where it was shielded from light, paler where it wasn't.

Three dressing rooms, three curtains. Behind each, a small space with a mirror, a hook, and a small bench. The mirrors reflect each other in a hall-of-mirrors effect that makes the corridor feel infinite. The reflections multiply into darkness.

A full-length mirror at the end of the corridor is cracked, a spider-web of fractures spreading from a central impact point. Whatever hit it—a fist, a head, a moment of frustration—left a lasting mark. The cracks distort everything they reflect.`,
      x: -15,
      y: 5,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SHOWROOM',
      },
      sittables: [
        {
          name: 'a dressing room bench',
          capacity: 3,
          emptyMsg:
            'Small wooden benches wait in each dressing room, their velvet cushions worn thin by years of use.',
          occupiedMsg: '%s sitting on a dressing room bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'velvet curtains',
          aliases: ['curtains', 'drapes'],
          description: `Purple velvet curtains hang across brass rods, marking the entrance to each dressing room. The fabric is theatrical, meant to make changing feel like a transformation. But the velvet has faded—dark where light never touched it, pale where it did—creating a pattern that speaks to time passing while nobody watched.`,
        },
        {
          prototype: 'describable',
          name: 'cracked mirror',
          aliases: ['mirror', 'broken mirror'],
          description: `A full-length mirror at the end of the corridor, its surface a spider-web of cracks spreading from a central impact point. The cracks distort every reflection, fragmenting faces and bodies into cubist assemblages. Whatever hit this mirror—and whoever swung it—left a permanent mark on the store. The story behind it is gone. The damage remains.`,
        },
        {
          prototype: 'describable',
          name: 'abandoned outfit',
          aliases: ['outfit', 'clothes', 'garments'],
          description: `A pile of clothes left on one of the benches, as if someone was interrupted mid-try-on. A paisley blouse, a pair of bell-bottoms, a wide leather belt with a brass buckle. The customer never came back. The clothes never made it back to the rack. They sit here still, waiting to be worn or returned.`,
        },
      ],
    },

    '%BACKROOM': {
      name: 'Redux - Back Room',
      description: `The back room is where vintage gets sorted, priced, and prepared for sale. Industrial metal shelving holds clear plastic bins labeled by decade: 60s, 70s, 80s, 90s. The 70s bin is nearly empty—that's what sold. The 90s bin overflows with flannel and ripped denim that never quite found buyers.

A steaming station stands in the corner, its iron cold, a garment still draped across its board—a purple satin jacket that was being prepared for the floor when preparations stopped. The steam reservoir is dry now, the water long since evaporated, but the jacket remains, half-pressed, half-abandoned.

A battered couch sits against one wall, the kind employees use for breaks. The upholstery is avocado green, authentically vintage, sagging in the middle from years of weight. A coffee table holds an ashtray, some magazines, and a paperback romance novel with its spine cracked at the halfway point.`,
      x: -16,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%SHOWROOM',
        north: '%STORAGE',
        down: { room: '%CELLAR_STAIRS', door: '%BASEMENT_TRAPDOOR', locks: ['%BASEMENT_LOCK'] },
      },
      sittables: [
        {
          name: 'the avocado couch',
          capacity: 3,
          emptyMsg:
            'A battered avocado-green couch sags against the wall, its vintage authenticity unquestionable.',
          occupiedMsg: '%s lounging on the avocado couch',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'decade bins',
          aliases: ['bins', 'storage bins', 'plastic bins'],
          description: `Industrial shelving holds clear plastic bins labeled by decade. The 60s bin is sparse—mod dresses, go-go boots, items that commanded premium prices. The 70s bin is nearly empty, its disco contents long since claimed by the showroom floor. The 80s bin holds shoulder pads and neon. The 90s bin overflows with flannel and ripped denim that never found buyers.`,
        },
        {
          prototype: 'describable',
          name: 'steaming station',
          aliases: ['steamer', 'iron', 'ironing station'],
          description: `A professional steaming station with its iron mounted on a swing arm over a padded board. A purple satin jacket still drapes across the board, one sleeve pressed smooth, the other wrinkled—interrupted mid-process. The steam reservoir is dry. The water evaporated. The jacket remains half-finished, a garment in limbo.`,
        },
        {
          prototype: 'describable',
          name: 'coffee table',
          aliases: ['table'],
          description: `A low coffee table scarred by decades of use—rings from mugs, burns from cigarettes, the accumulated damage of break rooms everywhere. An ashtray overflows with old butts, the brand unidentifiable, the filters brown with age. A few magazines lie scattered: vintage fashion spreads, celebrity gossip from a decade ago. A paperback romance novel has its spine cracked at the halfway point. Someone never finished the story.`,
        },
      ],
    },

    '%STORAGE': {
      name: 'Redux - Storage',
      description: `A cramped storage space packed floor to ceiling with the overflow of decades. Cardboard boxes labeled in Sharpie—"SCARVES," "JEWELRY," "UNSORTED ESTATE SALE"—are stacked against every wall. Garment bags hang from overhead pipes, their contents shapeless behind cloudy plastic.

The smell back here is distinctly vintage: mothballs, old fabric, the ghost of perfumes that stopped being manufactured decades ago. It's not unpleasant exactly—more archaeological, the scent of time preserved in fiber.

A metal ladder in the corner leads up through a hatch to the roof. Someone painted it the same beige as the walls, trying to make it less industrial. The attempt failed.

A small desk in the corner holds a laptop that won't turn on, a pricing gun with a jammed mechanism, and a calculator with faded buttons. The business side of nostalgia, frozen when business stopped.`,
      x: -16,
      y: 5,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%BACKROOM',
        up: { room: '%ROOF_NW', locks: ['%ROOF_HATCH_LOCK'] },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'estate sale box',
          aliases: ['box', 'cardboard box', 'unsorted box'],
          description: `A large cardboard box labeled "UNSORTED ESTATE SALE" in black Sharpie. Inside, a chaos of items waits to be categorized: a mink stole that might be valuable, costume jewelry that definitely isn't, a collection of silk scarves in various states of decay. Someone's grandmother's closet, reduced to inventory that never got inventoried.`,
        },
        {
          prototype: 'describable',
          name: 'garment bags',
          aliases: ['bags', 'hanging bags'],
          description: `Garment bags hang from overhead pipes, their contents shapeless behind cloudy plastic. Zippers reveal glimpses of fabric: the edge of a wedding dress, the sleeve of a fur coat, something sparkly that catches what little light reaches back here. These are the special pieces, kept separate from the floor stock. Special pieces that never found special buyers.`,
        },
        {
          prototype: 'desk',
          name: 'pricing desk',
          aliases: ['desk', 'small desk'],
          description: `A small wooden desk buried under the tools of vintage retail: a pricing gun with a jammed mechanism, a calculator with buttons worn smooth, a laptop that won't turn on, price tags on a spindle, a Rolodex of suppliers. Someone sat here and made vintage fashion into a business. The business stopped. The desk remains.`,
        },
        {
          prototype: 'cabinet',
          name: 'jewelry box',
          aliases: ['jewelry', 'costume jewelry'],
          description: `A box labeled "JEWELRY - UNSORTED" contains a tangle of necklaces, bracelets, and brooches—costume pieces mostly, rhinestones and paste instead of gems. A few items might be real: a pearl strand that has the weight of authenticity, a gold bangle that doesn't show the green patina of cheap metal. Sorting them would require expertise. The expertise left with the staff.`,
        },
      ],
    },
  },
};
