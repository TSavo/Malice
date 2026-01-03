// Zeitgeist Coffee - Ground Floor (z=0)
// Art crowd coffee shop, abandoned but explorable

export const building = {
  name: 'Zeitgeist Coffee',
  x: -15,
  y: 1,
  width: 2,
  height: 2,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - COFFEE SHOP
    // ═══════════════════════════════════════════════════════════════════

    '%COUNTER': {
      name: 'Zeitgeist - Counter',
      description: `The coffee counter runs along the back wall, a barrier of reclaimed wood and industrial steel that once separated baristas from customers. Behind it, the espresso machine dominates—a chrome beast of Italian engineering, all brass fittings and pressure gauges, worth more than some of the art that used to hang on these walls. The machine is cold now, its boiler drained, but the craftsmanship remains impressive.

A chalkboard menu still hangs above the counter, the handwritten offerings smeared but legible: CORTADO $4.50, CHEMEX POUR-OVER $5, AVOCADO TOAST $12. The prices seem quaint now. The tip jar sits empty on the counter, a hand-lettered sign reading TIPS = KARMA still taped to its side.

Coffee cups are stacked in neat pyramids beside the espresso machine, white ceramic with the Zeitgeist logo—a stylized Z that was probably designed by someone's art school friend. The cups are dusty but intact, waiting for a rush that will never come.`,
      x: -15,
      y: 1,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y1.ts',
          description: 'Glass doors lead back to 1st Ave S',
        },
        west: '%SEATING',
        south: '%BACK',
      },
      sittables: [
        {
          name: 'a counter stool',
          capacity: 3,
          emptyMsg:
            'Three counter stools line the bar, their leather seats cracked but intact.',
          occupiedMsg: '%s sitting at the coffee counter',
        },
      ],
    },

    '%SEATING': {
      name: 'Zeitgeist - Seating Area',
      description: `The seating area embodies the aesthetic that made Zeitgeist a destination for the gallery crowd—exposed brick walls, mismatched furniture that looks vintage but cost new, the kind of carefully curated chaos that requires significant effort to maintain. The effort stopped. The chaos remains.

A worn velvet couch in deep burgundy occupies the corner, its cushions permanently indented by years of laptop-working creatives. Scattered tables of different heights and materials—reclaimed wood, industrial metal, repurposed factory equipment—fill the space at irregular intervals. The arrangement was probably intentional. Now it just looks abandoned.

Art still hangs on the brick walls, pieces by local artists that were for sale when selling was possible. Abstract canvases, photography of urban decay that now seems prescient, a sculpture made of coffee grounds and resin. Price tags dangle from some pieces, the numbers meaningless in an economy that no longer trades in dollars.`,
      x: -16,
      y: 1,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%COUNTER',
        south: '%BACK',
      },
      sittables: [
        {
          name: 'a mismatched chair',
          capacity: 4,
          emptyMsg:
            'Mismatched chairs cluster around tables of various heights and materials.',
          occupiedMsg: '%s sitting in one of the mismatched chairs',
        },
        {
          name: 'the velvet couch',
          capacity: 2,
          emptyMsg:
            'A worn burgundy velvet couch occupies the corner, its cushions permanently shaped by years of creative professionals.',
          occupiedMsg: '%s lounging on the velvet couch',
        },
      ],
    },

    '%BACK': {
      name: 'Zeitgeist - Back Room',
      description: `The back room serves the unglamorous needs of coffee shop operation—storage shelves holding bags of beans that have long since gone stale, cases of paper cups and wooden stir sticks, cleaning supplies in industrial quantities. A small refrigerator hums in the corner, somehow still running, its contents best left uninvestigated.

A door marked EMPLOYEES ONLY leads to what must be a bathroom, the universal stick figure offering no additional information. A second door, heavier, opens onto what looks like a narrow alley—a fire exit or service entrance, its crash bar rusted but functional.

The employee schedule still hangs on a corkboard, shifts assigned to people who stopped showing up. Someone named Taylor was supposed to open on a Tuesday that never quite arrived. A handwritten note reminds staff that BEARD NETS ARE MANDATORY IN FOOD PREP, a health code that seems almost touching in its irrelevance.`,
      x: -16,
      y: 0,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SEATING',
        east: '%COUNTER',
      },
    },
  },
};
