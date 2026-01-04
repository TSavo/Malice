// King County Courthouse - First Floor (z=1)
// Criminal Courtrooms (Departments 1-4)

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // FIRST FLOOR (z=1) - CRIMINAL COURTS
    // ═══════════════════════════════════════════════════════════════════

    '%STAIR_Z1': {
      name: 'King County Courthouse - Second Floor Landing',
      description: `The stairwell opens onto the criminal courts floor—Departments 1 through 4, where felonies were prosecuted and lives were decided. The corridor stretches in both directions, courtroom doors heavy and imposing, their small windows showing nothing but darkness.

A bulletin board lists court schedules that will never be kept, attorney rosters that no longer matter. Someone has pinned a note: "Judge Martinez called in sick. All Dept 2 cases continued to 3/15." The continuation is eternal now.

The floors are worn in paths leading to the courtrooms, decades of lawyers and defendants and witnesses wearing grooves in the terrazzo. The grooves record the traffic of justice. The traffic has stopped.`,
      x: 9,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#%LOBBY',
        up: 'z2.ts#%STAIR_Z2',
        north: '%COURTROOM_1',
        south: '%COURTROOM_2',
        east: '%HALLWAY_EAST',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'court calendar',
          aliases: ['calendar', 'schedule', 'board'],
          description: `A bulletin board with the court calendar, cases scheduled by department and time. "9:00 AM - STATE V. JOHNSON - SENTENCING." "10:30 AM - STATE V. CHEN - MOTION HEARING." The cases were scheduled. The courts are empty. The schedule persists, a ghost of proceedings that never occurred.`,
        },
      ],
    },

    '%COURTROOM_1': {
      name: 'Department 1 - Criminal Court',
      description: `Courtroom 1, the largest of the criminal departments, reserved for the most serious cases—murder trials, major drug trafficking, the crimes that made the news. The room is designed for drama: high ceilings, dark wood paneling, the judge's bench elevated like an altar.

The bench is empty, the nameplate reading "HON. ROBERT MARTINEZ" in brass letters. The jury box holds fourteen chairs, twelve for jurors, two for alternates. The chairs are empty. The deliberations they would have held are mysteries now.

The witness stand waits for testimony that will never be given. The court reporter's station holds a stenotype machine, its keys frozen mid-word, its tape ended. Whatever was being transcribed remains half-recorded, the rest lost.`,
      x: 9,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STAIR_Z1',
      },
      sittables: [
        {
          name: 'spectator gallery',
          capacity: 30,
          emptyMsg:
            'Rows of wooden benches fill the gallery, where families and reporters and the curious once watched justice unfold.',
          occupiedMsg: '%s in the spectator gallery',
        },
        {
          name: 'jury box',
          capacity: 14,
          emptyMsg:
            'The jury box holds fourteen chairs, arranged to face the witness stand and the accused.',
          occupiedMsg: '%s seated in the jury box',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'judge bench',
          aliases: ['bench', 'judges bench'],
          description: `The judge's bench, elevated three feet above the courtroom floor, commanding the room with architectural authority. The nameplate reads "HON. ROBERT MARTINEZ." A gavel rests beside a water carafe. The gavel hasn't struck in months. The water has evaporated.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'witness stand',
          aliases: ['stand', 'witness'],
          description: `The witness stand, a small wooden enclosure beside the judge's bench where people swore to tell the truth. The microphone is still positioned for testimony. The Bible for swearing oaths sits on the rail. The truths that were told here are recorded. The lies that were told are indistinguishable now.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'counsel tables',
          aliases: ['tables', 'defense', 'prosecution'],
          description: `Two tables face the bench—prosecution on the right, defense on the left. Legal pads still cover the surfaces, notes in attorney handwriting that was never meant to be legible. Briefcases sit open, their contents scattered. The attorneys left mid-trial. The trial never concluded.`,
          boltedDown: true,
        },
      ],
    },

    '%COURTROOM_2': {
      name: 'Department 2 - Criminal Court',
      description: `A smaller criminal courtroom, handling the routine felonies—burglaries, assaults, drug possession. The room has the same layout as Department 1 but scaled down, justice dispensed in smaller portions.

The judge's bench shows signs of personality—a small American flag, a photograph of children, a coffee mug reading "WORLD'S OKAYEST JUDGE." The humanity behind the bench, preserved in objects that outlasted their owner.

The defendant's chair is still positioned between counsel tables, where accused people sat while their fates were argued. The chair is ordinary—institutional wood and fabric—but everyone who sat in it was living the most important moment of their life.`,
      x: 9,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%STAIR_Z1',
      },
      sittables: [
        {
          name: 'spectator benches',
          capacity: 20,
          emptyMsg:
            'Wooden benches for spectators, worn smooth by the anxious shifting of waiting families.',
          occupiedMsg: '%s watching from the spectator gallery',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'judges personal items',
          aliases: ['items', 'flag', 'photo'],
          description: `Personal items on the judge's bench: a small American flag on a brass stand, a framed photograph of two children in Halloween costumes, a coffee mug that reads "WORLD'S OKAYEST JUDGE" in comic sans. The judge had a sense of humor. The judge had a family. The judge is gone.`,
        },
        {
          prototype: 'furniture',
          name: 'defendant chair',
          aliases: ['chair', 'defendant'],
          description: `The chair where defendants sat during proceedings, positioned between the counsel tables, facing the judge. Ordinary institutional furniture that was the center of someone's universe during every trial. Some people walked out of this room free. Some walked out to prison. All of them are gone now.`,
        },
      ],
    },

    '%HALLWAY_EAST': {
      name: 'King County Courthouse - East Hallway',
      description: `The east hallway connects the remaining criminal courtrooms, Departments 3 and 4. Benches line the walls, where attorneys and clients held whispered conferences before and after proceedings. The whispers echo in memory.

Interview rooms branch off the hallway, small windowless spaces where lawyers met clients in privacy. The rooms are dark now, their privacy complete and permanent.

A water cooler stands at the end of the hall, its bottle empty, its cups scattered on the floor. Someone needed water and no one refilled the supply. The small collapse of infrastructure, replicated throughout the building.`,
      x: 10,
      y: 2,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STAIR_Z1',
        north: '%COURTROOM_3',
        south: '%COURTROOM_4',
      },
      sittables: [
        {
          name: 'hallway benches',
          capacity: 6,
          emptyMsg:
            'Wooden benches line the walls, worn by the weight of waiting.',
          occupiedMsg: '%s waiting on a hallway bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'interview rooms',
          aliases: ['rooms', 'offices'],
          description: `Small interview rooms with wire-reinforced glass windows, where attorneys met with clients before court. The rooms are dark, their doors closed, their conversations ended. Whatever was discussed—strategy, plea offers, desperate hope—remains between walls that keep secrets permanently.`,
        },
      ],
    },

    '%COURTROOM_3': {
      name: 'Department 3 - Criminal Court',
      description: `Another criminal courtroom, nearly identical to the others, distinguished only by the personality of whoever presided here. This courtroom shows signs of a strict judge—the seating arranged with military precision, no personal items on the bench, a sign reading "TURN OFF ALL ELECTRONIC DEVICES" in large letters.

The strictness extended to punctuality—a wall clock shows the exact time the last session ended or the power failed, frozen at 2:47 PM. The clock matched the bank's frozen clock outside. Either they failed together or 2:47 had some significance.

The court seal hangs behind the bench, the State of Washington's portrait of George Washington gazing sternly over proceedings that no longer occur.`,
      x: 10,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%HALLWAY_EAST',
      },
      sittables: [
        {
          name: 'gallery seating',
          capacity: 25,
          emptyMsg:
            'Precisely arranged benches face the bench, their spacing exact and military.',
          occupiedMsg: '%s in the gallery',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'frozen clock',
          aliases: ['clock', 'time'],
          description: `A wall clock frozen at 2:47 PM, the same time shown on the bank clock outside, on watches found on bodies, on any timepiece that stopped when everything stopped. The synchronicity suggests a moment, an event, a point when time itself paused. Or perhaps just a coincidence of battery failure.`,
        },
        {
          prototype: 'describable',
          name: 'state seal',
          aliases: ['seal', 'washington'],
          description: `The Washington State seal hangs behind the bench—George Washington's portrait surrounded by the text "THE SEAL OF THE STATE OF WASHINGTON 1889." The seal represented the authority of the state, the legitimacy of the court, the power to judge. The seal remains. The authority it represented is unclear.`,
        },
      ],
    },

    '%COURTROOM_4': {
      name: 'Department 4 - Criminal Court',
      description: `The fourth criminal courtroom, smallest of the department, handling preliminary hearings and minor felonies. The room has a worn quality—carpet threadbare, wood finish dull, the budget priorities of county government visible in every surface.

This was where careers began and ended. Young prosecutors cut their teeth on shoplifting cases. Public defenders handled overwhelming caseloads. The assembly line of criminal justice, processing cases as efficiently as possible.

A box of case files sits by the prosecutor's table, the day's docket never completed. STATE v. WILLIAMS. STATE v. RODRIGUEZ. STATE v. KUMAR. The state no longer prosecutes. The defendants are free, in a sense.`,
      x: 10,
      y: 1,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%HALLWAY_EAST',
      },
      sittables: [
        {
          name: 'worn benches',
          capacity: 15,
          emptyMsg:
            'Budget-conscious benches show their age, the wood worn, the finish faded.',
          occupiedMsg: '%s on a worn bench',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'case files',
          aliases: ['files', 'docket'],
          description: `A cardboard box of case files by the prosecutor's table—the day's docket, never processed. Each file represents a person accused of something, evidence gathered, charges filed. The accusations persist on paper. The consequences never arrived.`,
        },
        {
          prototype: 'describable',
          name: 'threadbare carpet',
          aliases: ['carpet', 'floor'],
          description: `Industrial carpet worn to the backing in high-traffic areas, the county's budget priorities visible underfoot. The carpet was probably never new—just serviceable, institutional, adequate. Adequate has become irrelevant. The carpet continues to wear, though no one walks on it.`,
        },
      ],
    },
  },
};
