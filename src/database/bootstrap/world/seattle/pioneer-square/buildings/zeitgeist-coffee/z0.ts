// Zeitgeist Coffee - Ground Floor (z=0)
// Art crowd coffee shop, abandoned but explorable

export const building = {
  name: 'Zeitgeist Coffee',
  x: -15,
  y: 1,
  width: 2,
  height: 2,
  floors: 2,

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
      objects: [
        {
          prototype: 'describable',
          name: 'espresso machine',
          description: `A La Marzocco Strada—Italian engineering at its finest, a chrome beast of brass fittings and pressure gauges that probably cost more than some cars. The boiler is drained, the steam wands dry, but the craftsmanship remains undeniable. Someone loved this machine once. Cleaned it daily. Calibrated the grind. Now it sits cold, a monument to caffeine culture that outlived its context.`,
        },
        {
          prototype: 'sign',
          name: 'chalkboard menu',
          description: `A chalkboard mounted above the counter, the handwriting smeared but legible:

═══════════════════════
     ZEITGEIST COFFEE
═══════════════════════
CORTADO............$4.50
CHEMEX POUR-OVER...$5.00
COLD BREW..........$4.00
AVOCADO TOAST.....$12.00
GRAIN BOWL........$14.00
═══════════════════════
   * Ask about our
    SINGLE ORIGIN *

The prices seem quaint now. Relics of an economy that traded in dollars.`,
        },
        {
          prototype: 'describable',
          name: 'tip jar',
          description: `A mason jar repurposed as a tip jar, a hand-lettered sign taped to its side: TIPS = KARMA. The jar is empty now—no coins, no crumpled bills, no evidence that anyone ever believed in cosmic reciprocity for their spare change. The sign remains, a statement of faith in a transaction that stopped happening.`,
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
      objects: [
        {
          prototype: 'describable',
          name: 'abstract canvas',
          description: `A large canvas—maybe four feet square—dominated by violent slashes of red and black against a white ground. The paint is thick, applied with palette knives or maybe bare hands. A small placard identifies it as "Dissolution III" by a local artist whose name means nothing now. The price tag reads $2,400. The tag dangles by a thread.`,
        },
        {
          prototype: 'describable',
          name: 'coffee grounds sculpture',
          description: `A sculpture made of coffee grounds bound in clear resin—an abstract form that might be a human figure or might be nothing at all. It sits on a wooden pedestal, catching light in the amber matrix of fossilized caffeine. The artist statement taped to the base explains something about "the preservation of daily ritual." The resin has yellowed slightly. The ritual stopped.`,
        },
      ],
    },

    '%BACK': {
      name: 'Zeitgeist - Back Room',
      description: `The back room serves the unglamorous needs of coffee shop operation—storage shelves holding bags of beans that have long since gone stale, cases of paper cups and wooden stir sticks, cleaning supplies in industrial quantities. A small refrigerator hums in the corner, somehow still running, its contents best left uninvestigated.

A door marked EMPLOYEES ONLY leads to what must be a bathroom, the universal stick figure offering no additional information. A second door, heavier, opens onto what looks like a narrow alley—a fire exit or service entrance, its crash bar rusted but functional.

A metal ladder in the corner leads up through a hatch to the roof—the smoke break escape route, judging by the worn rungs.

The employee schedule still hangs on a corkboard, shifts assigned to people who stopped showing up. Someone named Taylor was supposed to open on a Tuesday that never quite arrived. A handwritten note reminds staff that BEARD NETS ARE MANDATORY IN FOOD PREP, a health code that seems almost touching in its irrelevance.`,
      x: -16,
      y: 0,
      z: 0,
      imageOnDisk: 's-main-st-x-16-y0-z0.png',
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SEATING',
        east: '%COUNTER',
        up: { room: '%ROOF_SW', locks: ['%ROOF_HATCH_LOCK'] },
        down: {
          room: '%BASEMENT_STAIRS',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK'],
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'storage shelves',
          description: `Industrial metal shelving holding the unglamorous necessities of coffee shop operation: bags of beans that have long since gone stale, their one-way valves exhaling into emptiness; cases of paper cups in three sizes; wooden stir sticks by the thousand; sugar packets in brown and white. The inventory outlived the demand.`,
        },
        {
          prototype: 'describable',
          name: 'refrigerator',
          description: `A small commercial refrigerator hums in the corner—somehow still running after all this time, drawing power from a grid that refuses to die. The door is closed. The contents are best left uninvestigated. Whatever's in there has had years to evolve. Some mysteries are better left unsolved.`,
        },
        {
          prototype: 'sign',
          name: 'employee schedule',
          description: `A corkboard with the employee schedule pinned to it:

WEEK OF [date illegible]
━━━━━━━━━━━━━━━━━━━━━━
MON: Sarah (open), Jake (close)
TUE: Taylor (open), Maria (close)
WED: Jake (open), Sarah (close)
THU: Maria (open), Taylor (close)
FRI: ALL HANDS - inventory
━━━━━━━━━━━━━━━━━━━━━━
BEARD NETS ARE MANDATORY
    IN FOOD PREP AREA

Taylor was supposed to open on Tuesday. Tuesday never quite arrived.`,
        },
      ],
    },
  },
};
