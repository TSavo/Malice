// Terra Nova Gallery - Ground Floor (z=0)
// Abstract expressionist art gallery, abandoned but preserved

export const building = {
  name: 'Terra Nova Gallery',
  x: -15,
  y: -5,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - GALLERY SPACE
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN': {
      name: 'Terra Nova - Main Gallery',
      description: `Floor-to-ceiling windows form the gallery's eastern wall, flooding the space with whatever light the sky provides. The walls are hospital white, the kind of white that costs money—smooth, pristine, designed to disappear behind the art it displays. The concrete floor is polished to a mirror sheen, gray and cold and deliberately industrial.

Three large canvases dominate the main wall: abstract expressionism rendered in violent slashes of red and black against white grounds. The artist was making a statement about something—anger, maybe, or capitalism, or the futility of human connection. The statement hangs there still, speaking to an empty room. A price tag dangles from one frame, swaying slightly in some imperceptible draft: $8,400.

A reception desk sits near the entrance, a slab of brushed aluminum that probably cost more than the art. The gallery's brochures still fan across its surface, printed on heavy stock, explaining the artist's vision in language designed to make buyers feel sophisticated. The sophistication outlived its audience.`,
      x: -15,
      y: -5,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y-5.ts',
          description: 'Glass doors lead back to 1st Ave S',
        },
        west: '%BACK',
        south: '%OFFICE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'abstract canvas',
          aliases: ['canvas', 'painting', 'art'],
          description: `A large canvas—maybe six feet tall—dominated by violent slashes of red and black against a white ground. The paint is thick, applied with palette knives or bare hands, the violence of the gesture preserved in the dried texture. A small brass placard identifies it as "Dissolution IV" by Marcus Chen. The price tag reads $8,400. The tag dangles by a thread, swaying in some imperceptible draft.`,
        },
        {
          prototype: 'describable',
          name: 'companion pieces',
          aliases: ['canvases', 'paintings'],
          description: `Two more canvases flank the central piece—"Dissolution II" and "Dissolution V"—variations on the same theme of red and black violence. The prices are lower: $6,200 and $7,800. Together the triptych tells a story of destruction that feels more prescient now than the artist probably intended. The red looks like blood. The black looks like endings.`,
        },
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'counter'],
          description: `A slab of brushed aluminum that serves as a reception desk, cold and industrial and deliberately unwelcoming. Gallery brochures fan across its surface, printed on heavy stock that has yellowed slightly with age. A leather-bound guest book lies open, the last signature dated months ago. A silver bell sits beside it, the kind you ring for service that never comes.`,
        },
        {
          prototype: 'describable',
          name: 'gallery brochures',
          aliases: ['brochures', 'pamphlets'],
          description: `Thick paper stock, embossed logo, the kind of production values that scream "we sell to rich people." The brochure explains Marcus Chen's artistic vision: "Drawing from the chaos of urban decay and the violence of late capitalism, Chen's 'Dissolution' series interrogates the viewer's complicity in systemic destruction." The language is designed to make buyers feel sophisticated. The sophistication outlived its audience.`,
        },
      ],
    },

    '%BACK': {
      name: 'Terra Nova - Back Gallery',
      description: `The back gallery is smaller, more intimate, designed for pieces that require contemplation rather than impact. The lighting here is dimmer, spots carefully positioned to illuminate specific works while leaving the rest of the space in shadow. The walls are the same expensive white, but they feel different back here—quieter, more confessional.

Smaller works line these walls: photographs, mixed media pieces, a sculpture on a pedestal that might be bronze or might be something else entirely. The price tags are lower back here—hundreds instead of thousands—but the art feels more honest somehow. Less performed. More felt.

A narrow hallway leads south to what appears to be office space. A storage closet stands in the corner, its door slightly ajar, revealing bubble wrap and wooden crates stacked against the wall.`,
      x: -16,
      y: -5,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MAIN',
        south: '%OFFICE',
      },
      sittables: [
        {
          name: 'a viewing bench',
          capacity: 3,
          emptyMsg:
            'A minimalist wooden bench sits in the center of the room, positioned for optimal viewing of the smaller works.',
          occupiedMsg: '%s sitting on the gallery bench, contemplating art',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'bronze sculpture',
          aliases: ['sculpture', 'statue', 'bronze'],
          description: `A sculpture on a white pedestal, maybe two feet tall, depicting a human figure in the act of dissolution—limbs fragmenting, torso splitting, face serene despite the destruction. The material is bronze or something like it, darkened with patina. The price tag reads $1,200. The artist is different: "Sarah Mendez, Untitled #7." The figure seems at peace with its own ending.`,
        },
        {
          prototype: 'describable',
          name: 'photography series',
          aliases: ['photographs', 'photos'],
          description: `A series of black-and-white photographs mounted on the wall, each depicting an abandoned space: a factory floor, a hospital corridor, a schoolroom. The images are sharp, clinical, almost forensic in their documentation of absence. Small placards beneath each one provide location and date. The photographer was chronicling decay before decay became universal.`,
        },
        {
          prototype: 'cabinet',
          name: 'storage closet',
          aliases: ['closet', 'storage'],
          description: `A closet door stands slightly ajar, revealing bubble wrap and wooden crates stacked against the back wall. These are shipping materials for art that was never shipped—pieces packed and ready for buyers who never came. The bubble wrap is dusty. The crates are labeled with gallery codes: TN-2019-047, TN-2019-052. Someone was organized once.`,
        },
      ],
    },

    '%OFFICE': {
      name: 'Terra Nova - Back Office',
      description: `The back office is where the business of art happened—invoices, shipping manifests, the paperwork of transforming creativity into commerce. A desk dominates the small space, buried under files and receipts and catalogs from other galleries. The computer monitor is dark, its power light long since faded to black.

A corkboard on the wall displays a constellation of business cards, exhibition announcements, and artist headshots. Some faces are crossed out with red marker, some circled. The criteria for each designation is unclear, but it feels significant somehow—a taxonomy of the art world, preserved in pushpins and paper.

A ladder in the corner leads up through a hatch to the roof—the kind of minimalist access that matches the gallery's aesthetic, painted white to blend with the walls.

A small safe sits in the corner, its door hanging open, its contents long since removed. Whatever valuables the gallery kept—petty cash, small pieces, important documents—are gone now. The safe remains, a monument to security that no longer matters.`,
      x: -16,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BACK',
        east: '%MAIN',
        up: { room: '%ROOF_SW', locks: ['%ROOF_HATCH_LOCK'] },
      },
      objects: [
        {
          prototype: 'desk',
          name: 'gallery desk',
          aliases: ['desk', 'office desk'],
          description: `A wooden desk buried under the detritus of art commerce: invoices, shipping manifests, exhibition catalogs, business cards, a coffee mug that still holds the ghost of its last pour. The computer monitor is dark. A rolodex sits beside the keyboard—an anachronism even before everything ended. The Rolodex cards are alphabetized. Someone was organized.`,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinet',
          aliases: ['cabinet', 'files'],
          description: `A gray metal filing cabinet, three drawers deep. The labels read: ARTISTS A-M, ARTISTS N-Z, SALES RECORDS. The drawers are stuffed with contracts, correspondence, and the paper trail of a business that no longer operates. Each artist file contains a headshot, a bio, a list of pieces, and a sales history. The history ends abruptly.`,
        },
        {
          prototype: 'describable',
          name: 'corkboard',
          aliases: ['board', 'bulletin board'],
          description: `A corkboard cluttered with the ephemera of gallery life: business cards from collectors, exhibition announcements, artist headshots printed on glossy paper. Some faces are crossed out with red marker. Some are circled. A few have notes scrawled beside them: "DIFFICULT," "RELIABLE," "OWES US." The taxonomy of the art world, preserved in pushpins.`,
        },
        {
          prototype: 'describable',
          name: 'empty safe',
          aliases: ['safe', 'strongbox'],
          description: `A small floor safe, the kind that bolts to concrete. The door hangs open, revealing an interior lined with gray felt and divided into compartments. Whatever was stored here—cash, jewelry, small valuable pieces—is gone. The safe remains, useless now but still heavy enough to deter theft of the safe itself. Security is a habit that outlives its purpose.`,
        },
      ],
    },
  },
};
