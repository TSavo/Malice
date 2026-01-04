// King County Courthouse - Third Floor (z=3)
// Family Court (Departments 9-12) and Roof Access

export const building = {
  rooms: {
    '%STAIR_Z3': {
      name: 'King County Courthouse - Fourth Floor Landing',
      description: `The family court floor—where marriages dissolved, custody was contested, and children became legal abstractions argued over by strangers in robes. The atmosphere here was different from other floors: more tissue boxes, more visible despair, the particular grief of families coming apart.

Waiting areas have child-sized furniture mixed with adult chairs—recognition that children were present for proceedings that would reshape their lives. The child-sized chairs are empty now. The children they held have grown up or not.

A sign points to MEDIATION SERVICES, the attempt to resolve disputes before they reached the courtroom. The mediation rooms are dark. The disputes remain unmediated, frozen at whatever state of acrimony they had reached.`,
      x: 9,
      y: 2,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z2.ts:%STAIR_Z2',
        up: 'z4.ts:%STAIR_Z4',
        north: '%COURTROOM_9',
        south: '%COURTROOM_10',
        east: '%FAMILY_HALL',
      },
      sittables: [
        {
          name: 'child-sized chairs',
          capacity: 4,
          emptyMsg:
            'Small chairs for small people, placed here because children had no choice but to wait.',
          occupiedMsg: '%s in a child-sized chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'mediation sign',
          aliases: ['sign', 'mediation'],
          description: `A sign pointing toward MEDIATION SERVICES, where trained neutrals tried to help parents reach agreements without judicial intervention. The success rate was modest. The failures ended up in the courtrooms. Now no one mediates. No one litigates. The families are on their own.`,
        },
      ],
    },

    '%COURTROOM_9': {
      name: 'Department 9 - Family Court',
      description: `A family courtroom configured for the particular needs of dissolution proceedings—private entrances for parents who shouldn't see each other, a room for children to wait with supervisors, the infrastructure of managed hostility.

The courtroom feels different from criminal or civil courts. Softer somehow, despite handling matters that destroyed people's lives. The lighting is warmer. The seats are cushioned. Someone understood that the people here were already suffering.

Children's artwork hangs on the walls—drawings of houses and families and pets, made by kids in supervised visitation. The drawings show houses with two doors, families split down the middle, the visual language of custody arrangements. The artwork remains. The children who made it are somewhere else.`,
      x: 9,
      y: 3,
      z: 3,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STAIR_Z3',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'childrens art',
          aliases: ['art', 'drawings', 'artwork'],
          description: `Drawings made by children in custody proceedings, hung on the walls to make the space less intimidating. Houses with two front doors. Families drawn in separate groups. A dog that appears in both pictures—shared custody of a pet. The drawings document the interior lives of children whose families were dissolving. The documentation is the only record that remains.`,
        },
        {
          prototype: 'describable',
          name: 'private entrances',
          aliases: ['doors', 'entrances'],
          description: `Separate entrances on either side of the courtroom, allowing parents in high-conflict cases to arrive and leave without encountering each other. The court understood that some people should not be in the same hallway. The separation was physical. The conflict was permanent.`,
        },
      ],
    },

    '%COURTROOM_10': {
      name: 'Department 10 - Family Court',
      description: `A family courtroom specializing in dependency cases—children removed from homes, placed in foster care, the state's intervention in families that couldn't function. The proceedings here were closed to the public. The shame was contained, or meant to be.

The judge's bench has a lower profile than other courtrooms, an attempt to be less intimidating to parents already terrified by the system. Social worker reports cover the clerk's desk, assessments of home conditions and parenting capacity. The reports made recommendations. The court made decisions. Now neither happens.

A play area in one corner holds toys for children too young to understand why they were here but old enough to be scared. The toys are dusty, untouched, waiting for children who won't come.`,
      x: 9,
      y: 1,
      z: 3,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%STAIR_Z3',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'social worker reports',
          aliases: ['reports', 'files', 'assessments'],
          description: `Stacks of reports from social workers assessing families in crisis: home visits documented, parenting evaluated, recommendations made. The reports are confidential, the details private, the pain they document now abstract. The children in these reports are somewhere. The system that was supposed to protect them has collapsed.`,
        },
        {
          prototype: 'describable',
          name: 'play area',
          aliases: ['toys', 'children', 'play'],
          description: `A corner with child-sized furniture and toys—blocks, books, a stuffed bear worn smooth by anxious hugging. The play area was meant to distract children from proceedings that would determine their futures. The toys remain. The children's futures are uncertain for different reasons now.`,
        },
      ],
    },

    '%FAMILY_HALL': {
      name: 'King County Courthouse - Family Services Corridor',
      description: `The corridor connecting family court services: supervised visitation, parenting classes, the support systems meant to help families survive the legal process. The services were important—sometimes the difference between children returning home or remaining in care.

A bulletin board advertises support groups: DIVORCE RECOVERY. SINGLE PARENTING. CO-PARENTING COMMUNICATION. The groups met in the evenings, in church basements and community centers, people helping each other through the process. The groups have disbanded. The need persists.

Waiting rooms along the hall have toys and magazines and the particular tension of people waiting for news that could change their lives. The toys are still there. The news will never come.`,
      x: 10,
      y: 2,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STAIR_Z3',
        north: '%VISITATION',
        south: '%COURTROOM_11',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'support groups board',
          aliases: ['board', 'bulletin', 'groups'],
          description: `A bulletin board advertising support groups for people navigating family dissolution: meeting times, contact numbers, the infrastructure of mutual aid. "THURSDAYS 7PM - FIRST PRESBYTERIAN - DIVORCE RECOVERY." The meetings happened. They helped. They stopped happening. The flyers remain.`,
        },
      ],
    },

    '%VISITATION': {
      name: 'King County Courthouse - Supervised Visitation',
      description: `The supervised visitation suite, where parents with restricted access met children under the watchful eyes of trained monitors. The rooms are designed to be homelike—couches instead of desks, toys instead of paperwork—while cameras recorded everything.

The recordings were evidence, sometimes. Proof that a parent could or couldn't handle contact. The cameras are dark now. Whatever happened in these rooms is unrecorded, private again.

A sign-in book logs visits that occurred, parents' names and children's names and the times they spent together. The last entries are months old. The visits have stopped. The need for supervision has evaporated along with everything else.`,
      x: 10,
      y: 3,
      z: 3,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%FAMILY_HALL',
      },
      sittables: [
        {
          name: 'visitation couch',
          capacity: 4,
          emptyMsg:
            'A comfortable couch where parents sat with children during monitored visits.',
          occupiedMsg: '%s on the visitation couch',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'monitoring cameras',
          aliases: ['cameras', 'surveillance'],
          description: `Cameras in the corners, positioned to record visitation without being obtrusive. The recordings were reviewed by judges, cited in proceedings, used as evidence of fitness or unfitness. The cameras are dark. The recordings ended. Whatever happens here now is private.`,
        },
        {
          prototype: 'cabinet',
          name: 'visit log',
          aliases: ['log', 'signin'],
          description: `A log book recording supervised visits: parent name, child name, time in, time out, observer notes. The last entry is a month old: "Johnson/Johnson Jr. - 2hr visit - age-appropriate interaction." The interaction ended. The documentation survives.`,
        },
      ],
    },

    '%COURTROOM_11': {
      name: 'Department 11 - Family Court',
      description: `A courtroom for protection orders—domestic violence cases, stalking, the legal attempt to keep dangerous people away from the people they might hurt. The proceedings were urgent, the stakes immediate, the decisions potentially life-saving.

A stack of denied petitions sits on the clerk's desk, cases where the court found insufficient evidence to issue protection. Some of those petitioners are probably dead now. The court couldn't save everyone. The court can't save anyone now.

The walls display posters about victim services, hotline numbers, resources that existed when resources existed. The numbers probably don't connect anymore. The services have stopped. The violence, presumably, continues.`,
      x: 10,
      y: 1,
      z: 3,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FAMILY_HALL',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'protection order files',
          aliases: ['files', 'orders', 'petitions'],
          description: `Files for protection order petitions, granted and denied. Each file represents someone scared enough to ask the court for help. The court helped when it could. The files document successes and failures, lives protected and lives left at risk. The protection has ended. The files remain.`,
        },
        {
          prototype: 'describable',
          name: 'victim services posters',
          aliases: ['posters', 'hotline', 'resources'],
          description: `Posters listing victim services: hotline numbers, shelter addresses, resources for people fleeing violence. "24/7 CRISIS LINE: 1-800-..." The numbers were answered by counselors trained to help. The counselors are gone. The violence that made them necessary is not.`,
        },
      ],
    },
  },
};
