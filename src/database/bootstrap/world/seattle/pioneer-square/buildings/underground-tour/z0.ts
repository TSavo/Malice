// Underground Tour - Ground Floor (z=0)
// Bill Speidel's Underground Tour - abandoned tourist attraction
// Entry point to Seattle's buried streets

export const building = {
  name: 'Underground Tour',
  x: -15,
  y: -3,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - GIFT SHOP AND STAGING
    // ═══════════════════════════════════════════════════════════════════

    '%ENTRY': {
      name: 'Underground Tour - Gift Shop',
      description: `The purple door opens into what was once Bill Speidel's Underground Tour gift shop, frozen in the amber of abandonment. Display racks still hold t-shirts that read I SURVIVED THE UNDERGROUND TOUR in faded letters, the fabric stiff with dust and age. Coffee mugs shaped like rats sit in neat rows, their novelty preserved by neglect.

Snow globes line a shelf near the register, each containing a tiny Pioneer Square streetscape—shake them and the fake snow still falls, the only movement this room has seen in years. The register drawer hangs open, emptied of cash but still holding a roll of receipt paper that has yellowed to the color of old teeth.

A sandwich board lies face-down near the door, its chalkboard message hidden. The tour schedule on the wall shows departure times that will never come: 11 AM, 1 PM, 3 PM. The underground is still down there, waiting. The tours stopped coming.`,
      x: -15,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y-3.ts',
          description: 'The purple door leads back to 1st Ave S',
        },
        west: '%STAGING',
        down: '%DESCENT',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'display rack',
          description: `A rotating wire rack holds t-shirts in faded plastic bags. The shirts read I SURVIVED THE UNDERGROUND TOUR in blocky letters, the fabric stiff with age and dust. The sizes are mixed—small, medium, XXL—abandoned inventory that never found its buyers. The price tags still dangle: $24.95.`,
        },
        {
          prototype: 'describable',
          name: 'snow globe shelf',
          description: `A shelf of snow globes, each containing a tiny Pioneer Square streetscape—miniature brick buildings, a totem pole the size of a toothpick, a pergola no bigger than a thimble. Shake one and the fake snow still falls, swirling around frozen Seattle in eternal winter. The globes are dusty but intact, their liquid slightly yellowed with age.`,
        },
        {
          prototype: 'describable',
          name: 'rat mug display',
          description: `Novelty coffee mugs shaped like rats—the unofficial mascot of Seattle's underground. The rats are ceramic, cartoonish, their tails forming the handles. A sign reads: "The REAL residents of Underground Seattle!" Twenty dollars each. Nobody's buying.`,
        },
        {
          prototype: 'sign',
          name: 'tour schedule',
          description: `A laminated poster showing tour departure times:

UNDERGROUND TOUR SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━
11:00 AM
 1:00 PM
 3:00 PM

Tours last approximately 75 minutes.
No refunds. No cameras. No wandering.

The schedule is eternal. The tours stopped.`,
        },
      ],
    },

    '%STAGING': {
      name: 'Underground Tour - Staging Area',
      description: `The tour staging area occupies what might once have been a speakeasy or basement social club—the ceiling is low, the walls brick, the atmosphere of conspiracy baked into the architecture. Rows of folding metal chairs face a small podium where guides once delivered their opening spiel about the Great Fire of 1889 and the decision to rebuild Seattle one story higher.

Safety signs still hang on the walls: WATCH YOUR HEAD, UNEVEN SURFACES, STAY WITH YOUR GROUP. A basket near the door holds flashlights that haven't worked in years, their batteries long since corroded to useless paste. A first aid kit mounted on the wall is dated 2019, its contents expired but present.

A door to the south leads to what was once the staff office. A stairwell in the corner descends into darkness—the actual tour route, still passable, still leading down to the buried streets that tourists once paid twenty dollars to see.`,
      x: -16,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ENTRY',
        south: '%OFFICE',
      },
      sittables: [
        {
          name: 'a folding metal chair',
          capacity: 8,
          emptyMsg:
            'Rows of folding metal chairs face the podium, arranged for a tour group that never arrived.',
          occupiedMsg: '%s sitting in one of the folding chairs',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'podium',
          description: `A wooden podium where tour guides once stood to deliver the opening spiel—the Great Fire of 1889, the decision to rebuild one story higher, the rats and the toilets and the ghost stories. A binder lies open on the lectern, its pages yellowed, containing bullet points and bad jokes that guides were supposed to memorize. "Remember: ENTHUSIASM sells tickets!"`,
        },
        {
          prototype: 'describable',
          name: 'flashlight basket',
          description: `A wicker basket near the door holds a dozen flashlights—the cheap plastic kind that take D batteries. The batteries have long since corroded, leaking acid that has eaten through the plastic casings. White crystalline residue coats everything. These flashlights will never light again.`,
        },
        {
          prototype: 'sign',
          name: 'safety signs',
          description: `A cluster of laminated safety signs mounted to the brick wall:

WATCH YOUR HEAD - Low clearances ahead
UNEVEN SURFACES - Watch your step
STAY WITH YOUR GROUP - No wandering
EMERGENCY EXIT - Follow guide instructions

The warnings are still valid. The guides are gone.`,
        },
      ],
    },

    '%OFFICE': {
      name: 'Underground Tour - Back Office',
      description: `The back office is a cramped space that served the practical needs of running a tourist attraction—filing cabinets stuffed with liability waivers, a desk buried under scheduling paperwork, a time clock on the wall with punch cards still in their slots. The employees never clocked out. The end came between shifts.

A corkboard displays employee schedules, birthday announcements, and a faded photograph of a staff party. Someone had circled the date of the next company picnic in red marker. The picnic never happened. A jar of hard candies sits on the desk, the candies fused into a single geological mass.

A door in the back wall is marked EMPLOYEES ONLY - SERVICE CORRIDOR. Through the small window in the door, you can see a narrow hallway that leads deeper into the building's infrastructure—maintenance access, probably, or a fire exit that opens onto an alley.`,
      x: -16,
      y: -4,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%STAGING',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'staff desk',
          description: `A battered metal desk buried under paperwork—scheduling printouts, employee timesheets, a half-finished incident report about someone who fainted in the tunnels. A time clock on the wall still holds punch cards in their slots, the last punches dated years ago. The employees never clocked out. The end came between shifts.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinet',
          description: `A gray metal filing cabinet, three drawers deep, stuffed with liability waivers signed by tourists who wanted to see the underground. Each form releases Bill Speidel's Underground Tour from responsibility for "injury, illness, or psychological distress." Thousands of signatures. Thousands of people who went down and came back up. Until the day everyone stopped coming.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'candy jar',
          description: `A glass jar that once held hard candies—the kind offices kept for visitors. The candies have fused into a single geological mass, a stratum of butterscotch and peppermint compressed by time and humidity into something that is no longer food. The jar is decorative now. A fossil.`,
        },
      ],
    },
  },
};
