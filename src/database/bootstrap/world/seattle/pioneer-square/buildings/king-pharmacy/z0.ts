// King Pharmacy - Ground Floor (z=0)
// A hybrid Chinese/Western pharmacy in the International District
// Served the community for decades, now looted and abandoned

export const building = {
  name: 'King Pharmacy',
  x: 4,
  y: -12,
  width: 3,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Front Door Lock',
      description:
        'A simple deadbolt, the kind found on countless storefronts. The strike plate is bent from forced entry.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Glass Front Door',
      description:
        'A glass door with a push bar, its surface cracked but intact. The door hangs open on rusted hinges, wedged by debris.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 40,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Back Door Lock',
      description:
        'A heavy deadbolt on the back door, the kind meant to deter break-ins through the alley.',
      difficulty: 4,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Steel Back Door',
      description:
        'A dented steel security door leading to the back alley. Scratches around the lock show where someone tried to force it.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'metal',
      durability: 75,
    },

    '%OFFICE_LOCK': {
      prototype: 'lock',
      name: 'Office Lock',
      description: 'A brass lock on the pharmacist\'s office door.',
      difficulty: 3,
    },
    '%OFFICE_DOOR': {
      prototype: 'door',
      name: 'Office Door',
      description:
        'A wooden door with a frosted glass panel reading "PRIVATE - PHARMACIST ONLY" in gold letters.',
      locked: true,
      open: false,
      locks: ['%OFFICE_LOCK'],
      material: 'wood',
      durability: 60,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - PHARMACY MAIN FLOOR
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT': {
      name: 'King Pharmacy - Front',
      description: `The pharmacy's front section displays what remains of its Western inventory—empty shelves where over-the-counter medications once offered relief, bare racks that held shampoo and vitamins and the small conveniences of health maintenance. The fluorescent lights are dead, but enough grey light filters through the dirty windows to navigate.

A checkout counter blocks the path to the back, its cash register open and empty, the drawer's coin compartments gathering dust. Behind the counter, locked cabinets with warning labels once held the controlled substances—the opioids and amphetamines that required prescriptions and careful counting. The cabinets have been forced open, their contents long since taken.

The floor is littered with packaging—pill bottles opened and emptied, blister packs popped and discarded. Someone went through methodically, taking everything with medical value. What remains is the detritus: expired supplements, topical creams, the things looters didn't consider worth carrying.`,
      x: 4,
      y: -12,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-king/x4.ts',
          description: 'The front door leads to S. King Street',
          door: '%FRONT_DOOR',
        },
        west: '%TRADITIONAL',
        north: '%DISPENSARY',
      },
      sittables: [
        {
          name: 'waiting bench',
          capacity: 3,
          emptyMsg:
            'A plastic bench near the door where customers waited for prescriptions.',
          occupiedMsg: '%s sitting on the waiting bench',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'checkout counter',
          aliases: ['counter', 'register'],
          description: `A laminate checkout counter with a dead cash register, its drawer hanging open. The register's digital display is blank, its last transaction frozen in memory no one can access. Impulse-buy items are scattered around the counter—lip balms and hand sanitizers, the small purchases people made while waiting. The waiting ended.`,
        },
        {
          prototype: 'cabinet',
          name: 'controlled substance cabinet',
          aliases: ['cabinet', 'drug cabinet', 'narcotics'],
          description: `A locked cabinet behind the counter, its glass front shattered, its shelves bare. Warning labels list the categories: SCHEDULE II, SCHEDULE III. The opioids, the amphetamines, the sedatives—all gone, taken in the early days when such things still seemed valuable. The locks were defeated. The warnings were ignored. The cabinet holds only dust and broken glass.`,
        },
        {
          prototype: 'describable',
          name: 'empty shelves',
          aliases: ['shelves', 'racks'],
          description: `Metal shelving units line the walls, their brackets still showing where products hung. Price tags dangle from empty hooks: $12.99 for something, $24.99 for something else. The products are gone—taken, expired, scattered. The prices remain, irrelevant calculations in a currency that no longer matters.`,
        },
      ],
    },

    '%TRADITIONAL': {
      name: 'King Pharmacy - Traditional Medicine',
      description: `The west side of the pharmacy holds what made King Pharmacy special—traditional Chinese medicine, practiced and dispensed by someone who understood the old formulas. Walls of wooden drawers rise from floor to ceiling, each drawer labeled in Chinese characters, each label naming an ingredient with centuries of therapeutic history.

The drawers are mostly empty now, their contents spoiled or taken. Dried herbs don't last forever, and fifty-five years is far beyond their shelf life. But the smell persists—the sharp green scent of medicinal plants, the earthiness of roots and bark, the particular mustiness of traditional pharmacy. The smell triggers memories in those who knew such places.

A consultation desk sits against one wall, where practitioners once felt pulses and examined tongues and prescribed formulas tailored to individual constitutions. The desk holds a few remaining tools: a brass scale for weighing doses, a mortar and pestle for grinding compounds, a worn book of formulas in Chinese.`,
      x: 3,
      y: -12,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%FRONT',
        north: '%STORAGE',
      },
      sittables: [
        {
          name: 'consultation stool',
          capacity: 1,
          emptyMsg:
            'A wooden stool beside the consultation desk, where patients sat for examination.',
          occupiedMsg: '%s on the consultation stool',
        },
        {
          name: 'practitioner chair',
          capacity: 1,
          emptyMsg:
            'A cushioned chair behind the desk, where the herbalist sat to diagnose.',
          occupiedMsg: '%s in the practitioner\'s chair',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'herb drawers',
          aliases: ['drawers', 'cabinets', 'medicine cabinet'],
          description: `Floor-to-ceiling wooden drawers, each one labeled with Chinese characters naming the herb inside: 黄芪 (astragalus), 当归 (angelica), 枸杞 (goji), 甘草 (licorice). The drawers slide open smoothly—someone maintained this furniture with care. Most are empty now, their contents decomposed or taken. A few still hold dried remnants, unrecognizable after decades.`,
        },
        {
          prototype: 'desk',
          name: 'consultation desk',
          aliases: ['desk', 'table'],
          description: `A heavy wooden desk where traditional diagnosis happened—the practitioner sitting, the patient extending a wrist for pulse-taking. A small silk cushion still marks where wrists rested. The desk surface is worn smooth by decades of use, its wood darkened by the oils of countless hands.`,
        },
        {
          prototype: 'describable',
          name: 'brass scale',
          aliases: ['scale', 'balance'],
          description: `A traditional balance scale for weighing herbs, its brass pans still level despite decades without calibration. The weights sit in a velvet-lined box—grams and fractions of grams, the precise measurements that traditional formulas require. The scale could still work, if anyone knew what to weigh.`,
        },
        {
          prototype: 'describable',
          name: 'formula book',
          aliases: ['book', 'formulas', 'recipes'],
          description: `A thick book bound in worn leather, its pages dense with Chinese characters and diagrams. Formulas for conditions: insomnia, digestive complaints, respiratory illness, the ailments that traditional medicine has treated for millennia. The formulas are still valid. The ingredients are no longer available. Knowledge preserved, practice impossible.`,
        },
        {
          prototype: 'describable',
          name: 'mortar and pestle',
          aliases: ['mortar', 'pestle', 'grinding'],
          description: `A heavy stone mortar and pestle, the kind used to grind herbs and roots into the fine powders that formulas require. The interior of the mortar is stained dark from years of use, traces of a hundred compounds ground into the stone itself. The pestle is worn smooth, shaped by the hands that held it.`,
        },
      ],
    },

    '%DISPENSARY': {
      name: 'King Pharmacy - Dispensary',
      description: `The back of the pharmacy where prescriptions were filled—the utilitarian heart of the operation. A long counter separates the public space from the work area, its surface covered in the tools of pharmaceutical compounding: counting trays, spatulas, the careful equipment of pill-counting and bottle-filling.

Shelving behind the counter held the prescription inventory—alphabetized by drug name, organized by strength and quantity. The shelves are bare now, their labels the only evidence of what they held. AMOXICILLIN 500MG, METFORMIN 850MG, LISINOPRIL 10MG—the medications that kept people alive, that managed chronic conditions, that represented the pharmaceutical answer to human fragility.

A computer terminal sits dead on the counter, its screen grey, its database of patient records inaccessible. Privacy laws no longer apply. Neither does the software.`,
      x: 4,
      y: -11,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%FRONT',
        west: '%STORAGE',
        east: {
          description: 'A door leads to the pharmacist\'s office',
          door: '%OFFICE_DOOR',
          to: '%OFFICE',
        },
        up: 'z1.ts#UPSTAIRS_HALL',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'dispensing counter',
          aliases: ['counter', 'work counter'],
          description: `A long laminate counter where prescriptions were filled, its surface covered in counting trays and pill bottles. A fluorescent light overhead is burned out, but enough ambient light filters in to see the organized chaos of pharmacy work frozen in place: a half-filled prescription, pills scattered when someone was interrupted, a label printed for a patient who never picked up.`,
        },
        {
          prototype: 'describable',
          name: 'prescription shelves',
          aliases: ['shelves', 'inventory'],
          description: `Metal shelving with printed labels for hundreds of medications, organized alphabetically. The shelves are empty now—every bottle taken, every pill counted and carried away. The labels remain: PREDNISONE, PROZAC, PROTONIX. The alphabetical order persists. The drugs do not.`,
        },
        {
          prototype: 'describable',
          name: 'pharmacy computer',
          aliases: ['computer', 'terminal'],
          description: `A computer terminal for prescription management, its screen dark, its keyboard dusty. The system held patient records, drug interaction warnings, insurance information—the digital infrastructure of modern pharmacy. The data is still on the hard drive, theoretically. No power to access it. No patients to serve.`,
        },
        {
          prototype: 'describable',
          name: 'counting trays',
          aliases: ['trays', 'pill counter'],
          description: `Plastic counting trays and spatulas for the careful work of pill-counting. The trays have raised ridges and grooves to organize pills into countable rows, the geometry of pharmaceutical precision. A few pills remain scattered on the trays—dropped and forgotten, whatever drug they contained now a mystery.`,
        },
      ],
    },

    '%STORAGE': {
      name: 'King Pharmacy - Storage Room',
      description: `The storage room connects the traditional medicine section to the dispensary—a transitional space filled with the inventory overflow of both practices. Metal shelving holds cardboard boxes, most of them opened, their contents rifled through.

One section is clearly for Western pharmaceuticals: manufacturer boxes with product names and lot numbers, the industrial packaging of modern medicine. Another section holds the supplies for traditional practice: empty glass jars that once held bulk herbs, bamboo steamers for preparing certain ingredients, the specialized equipment of Chinese pharmacy.

A steel door leads to the back alley, heavily locked, showing scratches where someone tried and failed to force entry. Stairs in the corner lead up to the second floor.`,
      x: 3,
      y: -11,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%TRADITIONAL',
        east: '%DISPENSARY',
        north: {
          description: 'A steel door leads to the back alley',
          door: '%BACK_DOOR',
          to: null, // Alley not implemented
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'pharmaceutical boxes',
          aliases: ['boxes', 'medicine boxes'],
          description: `Cardboard boxes with pharmaceutical company logos—Pfizer, Merck, the names of corporations that manufactured health. The boxes are open, their contents taken. Packing material spills onto the floor: bubble wrap, foam inserts, the protective packaging that kept pills pristine during shipping. The pills are gone. The packaging remains.`,
        },
        {
          prototype: 'cabinet',
          name: 'herb storage jars',
          aliases: ['jars', 'containers'],
          description: `Glass jars that once held bulk herbs, their labels still legible in Chinese characters. The jars are empty or hold only dust—the herbs decomposed, eaten by insects, or taken by someone who knew their value. A few jars still contain unidentifiable dried matter, the remains of plants that no longer have names.`,
        },
        {
          prototype: 'describable',
          name: 'bamboo steamers',
          aliases: ['steamers', 'bamboo'],
          description: `Stacked bamboo steamers, the traditional equipment for processing certain herbs that require heat treatment. The steamers are dusty but intact, their lids fitted precisely, their craftsmanship still evident. They could still work, if anyone knew what to steam and why.`,
        },
      ],
    },

    '%OFFICE': {
      name: 'King Pharmacy - Pharmacist\'s Office',
      description: `The pharmacist's private office—a small room where paperwork happened, where difficult conversations about insurance and costs took place, where the business side of medicine was managed. A desk faces the door, its surface organized with the precision of someone who kept careful records.

Diplomas and licenses hang on the wall: a pharmacy degree, state licensing, certification for traditional Chinese medicine—the credentials that allowed one person to practice both disciplines. The name on the documents is "David Chen, PharmD, L.Ac."—Doctor of Pharmacy, Licensed Acupuncturist. A rare combination of training.

Family photos on the desk show children at various ages, a spouse, the markers of a life beyond the pharmacy. The photos are face-down. Whoever was here last didn't want to look at them.`,
      x: 5,
      y: -11,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DISPENSARY',
      },
      sittables: [
        {
          name: 'desk chair',
          capacity: 1,
          emptyMsg:
            'An ergonomic office chair sits behind the desk, adjusted for someone who spent long hours sitting.',
          occupiedMsg: '%s in the pharmacist\'s chair',
        },
        {
          name: 'visitor chair',
          capacity: 1,
          emptyMsg:
            'A simple chair for visitors, positioned for difficult conversations.',
          occupiedMsg: '%s in the visitor chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'pharmacist desk',
          aliases: ['desk'],
          description: `A wooden desk organized with professional care: inbox, outbox, a cup of pens, a calculator, the tools of pharmacy administration. Papers in the inbox are invoices and insurance forms, the bureaucratic burden of healthcare. A framed photo lies face-down on the surface—family, probably, turned away by someone who couldn't bear to see them anymore.`,
        },
        {
          prototype: 'describable',
          name: 'diplomas',
          aliases: ['credentials', 'licenses', 'certificates'],
          description: `Framed credentials line the wall: "Doctor of Pharmacy - University of Washington," "Licensed Acupuncturist - State of Washington," "Certificate in Traditional Chinese Medicine - Beijing University of Chinese Medicine." David Chen trained in both traditions, built a practice that bridged them. The practice ended. The credentials remain.`,
        },
        {
          prototype: 'safe',
          name: 'small safe',
          aliases: ['safe', 'lockbox'],
          description: `A small floor safe, the kind that holds cash and important documents. The safe is closed but not locked—someone opened it and didn't bother to secure it again. Inside: nothing of value, just the empty space where value once was.`,
        },
      ],
    },
  },

  postProcessors: [],
};
