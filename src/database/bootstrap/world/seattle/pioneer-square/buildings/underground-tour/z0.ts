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
    },
  },
};
