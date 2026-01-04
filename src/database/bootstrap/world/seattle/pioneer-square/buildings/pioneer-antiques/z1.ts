// Pioneer Antiques - Second Floor (z=1)
// The gallery level - fine art and estate jewelry
// Higher-value items behind locked cases

export const building = {
  name: 'Pioneer Antiques',
  x: -2,
  y: 7,
  width: 4,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%JEWELRY_LOCK': {
      prototype: 'lock',
      name: 'Jewelry Case Lock',
      description:
        'A high-security lock on the jewelry display case, the kind that insurance companies require.',
      difficulty: 7,
    },

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A padlock on the roof hatch, installed after pigeons became a problem.',
      difficulty: 3,
    },
    '%ROOF_HATCH': {
      prototype: 'door',
      name: 'Roof Hatch',
      description:
        'A metal hatch leading to the roof, its frame showing water damage from decades of Seattle rain.',
      locked: true,
      open: false,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 50,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - GALLERY
    // ═══════════════════════════════════════════════════════════════════

    '%GALLERY_LANDING': {
      name: 'Pioneer Antiques - Gallery Landing',
      description: `The staircase opens onto a landing that immediately announces this floor's elevated status. Velvet rope barriers, their brass stanchions tarnished green, once directed traffic through the gallery. The carpet here is different—deeper pile, darker color, chosen to suggest luxury. The carpet is stained now, water damage from a roof leak creating a brownish archipelago across the once-plush surface.

A directory on the wall lists the gallery sections: "FINE ART - WEST GALLERY," "ESTATE JEWELRY - EAST GALLERY," "RARE BOOKS & MANUSCRIPTS - NORTH." The directory is hand-lettered, the kind of signage that suggested exclusivity. The exclusivity has become total—no one visits anymore.

Oil paintings hang on the landing walls, their frames ornate, their subjects conventional: landscapes and portraits, the kind of art that furnished wealthy homes. The paintings are dirty and water-stained, but the images are visible: a mountain scene, a society portrait, a still life with fruit that rotted long before The Burning.`,
      x: -4,
      y: 6,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#SHOWROOM_BACK',
        west: '%ART_GALLERY',
        east: '%JEWELRY_GALLERY',
        north: '%BOOK_ROOM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'velvet ropes',
          aliases: ['ropes', 'stanchions', 'barriers'],
          description: `Velvet rope barriers with brass stanchions, the universal symbol of controlled access. The brass has tarnished green, the velvet faded from burgundy to dusty pink. The ropes once directed customers through the gallery's valuable inventory. They direct no one now—the access they controlled has become permanently restricted.`,
        },
        {
          prototype: 'describable',
          name: 'gallery directory',
          aliases: ['directory', 'sign', 'map'],
          description: `A hand-lettered directory listing the gallery sections: Fine Art, Estate Jewelry, Rare Books. The lettering is calligraphic, suggesting expertise and exclusivity. The sections still exist. The expertise is gone, and the exclusivity has become absolute.`,
        },
        {
          prototype: 'describable',
          name: 'landing paintings',
          aliases: ['paintings', 'art', 'portraits'],
          description: `Oil paintings in ornate frames: a mountain landscape, a society portrait, a still life with fruit. The paintings are dirty and water-stained but structurally intact. The fruit in the still life rotted centuries ago. The person in the portrait died before The Burning. The mountain probably still exists.`,
        },
      ],
    },

    '%ART_GALLERY': {
      name: 'Pioneer Antiques - Art Gallery',
      description: `The art gallery occupies the west side of the second floor, its walls lined with paintings that someone once valued enough to consign for sale. Landscapes dominate: Pacific Northwest scenes of mountains and forests, seascapes of rocky coastlines, the regional art that Seattle collectors favored. The paintings are dirty but intact, their oils darkened by decades of dust and neglect.

Sculpture pedestals hold bronzes and marble pieces—classical forms, mostly, the kind of art that suggested culture without demanding interpretation. A bronze horse frozen mid-gallop, a marble Venus missing one arm (the damage older than The Burning, probably original), a modernist abstract that looks like melted metal.

Display cases hold smaller pieces: miniature portraits, ivory carvings yellowed with age, jade figurines that might be genuine. The cases are locked, their contents visible but inaccessible, protected by glass from a world that no longer cares to steal them.`,
      x: -5,
      y: 6,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GALLERY_LANDING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'landscape paintings',
          aliases: ['paintings', 'landscapes', 'art'],
          description: `Landscape paintings of the Pacific Northwest: Mount Rainier at sunset, the Olympic coast in fog, forests of Douglas fir reaching toward grey skies. The regional art that Seattle collectors favored, scenes of a nature that endures while humans come and go. The paintings are dusty but intact. The scenes they depict are probably still there.`,
        },
        {
          prototype: 'furniture',
          name: 'bronze horse',
          aliases: ['horse', 'bronze', 'sculpture'],
          description: `A bronze horse frozen mid-gallop on a marble pedestal, its mane flowing, its legs extended. The bronze has developed a green patina that might be deliberate or might be neglect. The horse gallops nowhere, has galloped nowhere for over a century. It will gallop nowhere forever.`,
        },
        {
          prototype: 'furniture',
          name: 'marble Venus',
          aliases: ['venus', 'statue', 'marble'],
          description: `A marble Venus on a pedestal, missing one arm—the damage older than The Burning, probably part of its provenance, the kind of imperfection that adds value to antiquities. The goddess of love stands in an empty gallery, beautiful and broken, representing an ideal that humans never lived up to.`,
        },
        {
          prototype: 'cabinet',
          name: 'miniatures case',
          aliases: ['case', 'miniatures', 'ivory'],
          description: `A display case holding smaller art pieces: miniature portraits painted on ivory, jade figurines that might be genuine antiques or might be tourist reproductions, carved netsuke from Japan. The case is locked, its contents visible but protected. Protection from what, at this point, is unclear.`,
        },
      ],
    },

    '%JEWELRY_GALLERY': {
      name: 'Pioneer Antiques - Jewelry Gallery',
      description: `The jewelry gallery is the most secure section of the building, its display cases made of reinforced glass, its inventory representing the concentrated wealth of estates liquidated. Rings and necklaces, bracelets and brooches, the personal adornments that people valued enough to pass down and heirs valued enough to sell.

The cases are locked with high-security mechanisms, the kind that insurance companies require for coverage. The locks are still functional, probably—the inventory they protect might be the most valuable things in Pioneer Square now. Gold doesn't tarnish, diamonds don't decay. The jewelry looks the same as it did fifty-five years ago.

A velvet-lined display features engagement rings, diamond solitaires that represented commitments made and kept, or made and broken. Wedding bands in matched pairs. The jewelry of relationships that ended, one way or another.

A mirror on one wall, now spotted and dim, once allowed customers to see how pieces looked when worn. The mirror reflects an empty gallery now.`,
      x: -3,
      y: 6,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GALLERY_LANDING',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'estate jewelry case',
          aliases: ['jewelry', 'case', 'diamonds'],
          description: `A reinforced display case holding estate jewelry: diamond necklaces, ruby brooches, emerald earrings, the concentrated wealth of families who had more than they could keep. The jewelry is the most valuable inventory in the building—gold and gems that don't decay, don't tarnish, don't care about the collapse of civilization. The case is locked with high-security mechanisms.`,
          locks: ['%JEWELRY_LOCK'],
        },
        {
          prototype: 'cabinet',
          name: 'engagement rings',
          aliases: ['rings', 'diamonds', 'wedding'],
          description: `A velvet-lined case of engagement rings—diamond solitaires in platinum and gold, each representing a proposal, an acceptance, a relationship that may or may not have worked out. Wedding bands sit in matched pairs. The jewelry of love, consigned for sale after love ended. The rings are worth money that doesn't exist anymore.`,
        },
        {
          prototype: 'describable',
          name: 'spotted mirror',
          aliases: ['mirror'],
          description: `A full-length mirror on the wall, its surface spotted with age, its reflection dim and unclear. Customers once checked how jewelry looked when worn, turning to see earrings catch the light. The mirror reflects an empty gallery now, jewelry displayed for no one.`,
        },
        {
          prototype: 'cabinet',
          name: 'watch case',
          aliases: ['watches', 'timepieces'],
          description: `A case of antique watches: pocket watches with gold chains, wristwatches from the mid-20th century, timepieces that required winding and attention. The watches have all stopped, their mechanisms unwound, their hands frozen at various hours. Time stopped differently for each of them.`,
        },
      ],
    },

    '%BOOK_ROOM': {
      name: 'Pioneer Antiques - Rare Book Room',
      description: `The rare book room is climate-controlled—or was, before the power failed. Shelves of leather-bound volumes line the walls, their spines cracked with age, their pages yellowed but readable. First editions, signed copies, books that survived centuries only to wait in an antique store for buyers who never came.

A glass case holds the most valuable items: manuscripts with hand-lettering, maps from before cartography became precise, documents with signatures from historical figures. The case is sealed, its contents preserved by accident—the controlled atmosphere inside lasting longer than the controlled atmosphere outside.

Reading tables with green-shaded lamps occupy the center of the room, the lamps dead, the tables dusty. A magnifying glass sits on one table, positioned over a page that no one has read in fifty-five years.

The smell here is different—old paper and leather, the distinctive scent of books that have outlived their readers.`,
      x: -4,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GALLERY_LANDING',
        west: '%ART_GALLERY',
        up: {
          to: 'z2.ts#ROOF',
          description: 'A ladder leads up to the roof hatch',
          door: '%ROOF_HATCH',
        },
      },
      sittables: [
        {
          name: 'reading table chair',
          capacity: 1,
          emptyMsg:
            'A wooden chair at the reading table, its leather seat cracked but serviceable.',
          occupiedMsg: '%s at the reading table',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'rare book shelves',
          aliases: ['books', 'shelves', 'volumes'],
          description: `Shelves of leather-bound books, their spines cracked with age, their gold lettering faded. First editions of novels now forgotten, collected works of poets no one reads, reference books for subjects that no longer matter. The books survived centuries of readers. They've survived fifty-five years without any.`,
        },
        {
          prototype: 'cabinet',
          name: 'manuscript case',
          aliases: ['manuscripts', 'maps', 'documents'],
          description: `A sealed glass case holding the most valuable items: handwritten manuscripts, antique maps with sea monsters in the margins, documents bearing historical signatures. The case's seal has preserved its contents better than the open shelves. The manuscripts wait to be read by scholars who will never come.`,
        },
        {
          prototype: 'furniture',
          name: 'reading table',
          aliases: ['table', 'desk'],
          description: `A reading table with a green-shaded lamp, the kind that equipped libraries before electricity became unreliable. A magnifying glass sits positioned over a page, examining text that no one has studied in fifty-five years. The lamp is dead. The examination is suspended indefinitely.`,
        },
        {
          prototype: 'describable',
          name: 'antique maps',
          aliases: ['maps', 'cartography'],
          description: `Framed maps on the walls: the Pacific Northwest before Seattle existed, trade routes across oceans that no one sails anymore, city plans for places that have changed beyond recognition. The maps are historical documents now—records of a world that preceded the world that preceded this one.`,
        },
      ],
    },
  },

  postProcessors: [],
};
