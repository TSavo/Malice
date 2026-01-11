// Corp Construction - Level -1 (z=-1)
// Active construction zone - where the "civic center" cover story lives
// But the construction is too specialized for any civic building

export const building = {
  name: 'Corp Construction',
  x: 6,
  y: 4,
  width: 7,
  height: 4,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LEVEL -1 (z=-1) - CONSTRUCTION ZONE
    // ═══════════════════════════════════════════════════════════════════

    '%CONSTRUCTION_ZONE': {
      name: 'Corp Construction - Construction Zone',
      description: `The first underground level is a maze of partially completed structures. Steel frames rise from poured concrete foundations, rebar forests waiting for their concrete skin. Workers would normally be everywhere here, but the site is eerily quiet. The work happens at night, on a schedule designed to minimize witnesses.

The construction isn't what you'd expect from a civic center. The walls are too thick—reinforced concrete with steel plates. The corridors are too narrow and too easy to seal. This isn't a building designed for public use. This is a building designed to contain something.

An elevator shaft in the center provides access up and down. A partially completed corridor leads west toward what blueprints might call "utility infrastructure." It doesn't look like utilities.`,
      x: 2,
      y: 3,
      z: -1,
      imageOnDisk: 'corp-construction-construction-zone-x2-y3-z-1.png',
      population: 0,
      ambientNoise: 40,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: 'z0.ts:%SHAFT_ACCESS',
        west: '%REINFORCED_CORRIDOR',
        down: 'z-2.ts:%INFRASTRUCTURE_HUB',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'reinforced walls',
          aliases: ['walls', 'construction'],
          description: `The walls under construction are massive—three feet of reinforced concrete with steel plates sandwiched between layers. This is blast-resistant construction, the kind used for bunkers and secure facilities. No civic center needs walls like these.`,
        },
        {
          prototype: 'describable',
          name: 'construction materials',
          aliases: ['materials', 'supplies'],
          description: `Pallets of specialized materials line the corridors: steel plates, blast-resistant glass, electromagnetic shielding material. Someone is building a fortress underground, hidden beneath the cover of a civic construction project.`,
        },
      ],
    },

    '%REINFORCED_CORRIDOR': {
      name: 'Corp Construction - Reinforced Corridor',
      description: `A corridor taking shape from steel and concrete, its proportions wrong for any normal building. The ceiling is low—barely seven feet—and the walls are angled inward, designed to deflect blast waves. Emergency lighting strips are being installed, the kind that run on independent batteries for weeks.

At the end of the corridor, a massive vault door has already been installed, incongruous among the construction debris. The door is operational, its locks engaged, its surface unmarked by any company logo or designation. Whatever room it protects is already complete.

Construction notes on a clipboard describe this section as "PRIMARY CONTAINMENT ACCESS." Containment of what?`,
      x: 1,
      y: 3,
      z: -1,
      imageOnDisk: 'corp-construction-reinforced-corridor-x1-y3-z-1.png',
      population: 0,
      ambientNoise: 30,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CONSTRUCTION_ZONE',
        north: '%EXCAVATION_EDGE',
        west: {
          to: '%CONTAINMENT_ANTEROOM',
          door: {
            prototype: 'door',
            name: 'Vault Door',
            description:
              'A massive blast door, already installed and operational. The steel is at least a foot thick, the hinges massive, the locks electronic.',
            locked: true,
            open: false,
            material: 'metal',
            durability: 100,
          },
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'construction clipboard',
          aliases: ['clipboard', 'notes'],
          description: `A construction supervisor's clipboard, left here during a shift change. The notes detail progress on "PRIMARY CONTAINMENT ACCESS - Phase 2." Measurements are given in metric, specs reference "INTERNATIONAL CONTAINMENT PROTOCOLS," and there's a note about "specimen handling procedures" that doesn't belong on any civic center jobsite.`,
        },
      ],
    },

    '%EXCAVATION_EDGE': {
      name: 'Corp Construction - Excavation Edge',
      description: `The northern edge of the current construction, where workers are still digging deeper. The wall here is raw earth, held back by temporary shoring, revealing layers of Seattle's buried history. The original 1889 street level is visible—old brick sidewalks, broken gas pipes, the foundations of buildings that burned in the Great Fire.

But they're digging past the fire level. Past the 1850s waterfront. Down to something older. The geological survey markers suggest they've found something that shouldn't be here—stone that isn't local, metal that predates the settlement. They're not building on this site by accident.

A locked gate prevents access to the active excavation face. Beyond it, you can see workers in hazmat suits carefully extracting something from the earth.`,
      x: 1,
      y: 4,
      z: -1,
      imageOnDisk: 'corp-construction-excavation-edge-x1-y4-z-1.png',
      population: 0,
      ambientNoise: 45,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%REINFORCED_CORRIDOR',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'exposed strata',
          aliases: ['strata', 'layers', 'earth'],
          description: `The exposed wall shows Seattle's underground history: modern utilities at the top, fire debris from 1889, original shoreline sand and gravel, glacial till from the last ice age. And below that, something wrong—a layer of blackite stone, non-local, arranged in patterns too regular to be natural.`,
        },
        {
          prototype: 'describable',
          name: 'survey markers',
          aliases: ['markers', 'survey'],
          description: `Geological survey markers planted in the earth, each numbered and color-coded. The key on a nearby chart indicates: GREEN = natural formation, YELLOW = historical artifact, RED = "FOUNDATION MATERIAL." Most of the markers below the glacial layer are red.`,
        },
      ],
    },

    '%CONTAINMENT_ANTEROOM': {
      name: 'Corp Construction - Containment Anteroom',
      description: `The first completed room on this level, a stark contrast to the construction chaos outside. The walls are finished—smooth white panels over reinforced concrete. The floor is seamless polymer, designed for easy decontamination. Air handling equipment hums overhead, maintaining positive pressure to keep contaminants out—or in.

Lockers line one wall, each marked with a biohazard symbol and containing hazmat suits in sealed bags. A decontamination shower occupies the corner, its nozzles pointed inward, ready to wash away whatever workers might bring back from deeper levels.

An inner door leads to what the blueprints call "PRIMARY CONTAINMENT." It's sealed with multiple locks and an electronic authorization system.`,
      x: 0,
      y: 3,
      z: -1,
      imageOnDisk: 'corp-construction-primary-containment-x0-y3-z-1.png',
      population: 0,
      ambientNoise: 35,
      lighting: 90,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%REINFORCED_CORRIDOR',
        west: {
          to: '%PRIMARY_CONTAINMENT',
          door: {
            prototype: 'door',
            name: 'Containment Door',
            description:
              'An airlock-style door with multiple seals and an electronic lock. A warning sign reads: AUTHORIZED PERSONNEL ONLY - BIOHAZARD PROTOCOLS IN EFFECT.',
            locked: true,
            open: false,
            material: 'metal',
            durability: 95,
          },
        },
      },
      objects: [
        {
          prototype: 'container',
          name: 'hazmat lockers',
          aliases: ['lockers', 'suits'],
          description: `A row of lockers containing sealed hazmat suits, full-face respirators, and decontamination supplies. The suits are Level B chemical protection—serious equipment for serious hazards.`,
          locked: false,
          maxItems: 20,
          maxWeight: 100,
        },
        {
          prototype: 'describable',
          name: 'decontamination shower',
          aliases: ['shower', 'decon'],
          description: `A chemical decontamination shower, the kind used in pharmaceutical facilities and bioweapon research labs. The nozzles spray both water and a chemical neutralizing agent. Whatever comes out of that inner room needs to be washed clean.`,
        },
      ],
    },

    '%PRIMARY_CONTAINMENT': {
      name: 'Corp Construction - Primary Containment',
      description: `This shouldn't exist yet. The construction timeline says Level -1 is still under construction, but this room is complete—has been complete for some time, judging by the wear patterns on the floor. The "civic center" construction is a cover for a facility that's already operational.

The room is circular, thirty feet in diameter, with observation windows looking down into a deeper chamber. The chamber below is lit with harsh white light, and at its center sits something that doesn't belong in Seattle or anywhere else. A structure of black stone and corroded metal, ancient beyond reckoning, excavated from beneath the city and now under constant surveillance.

Banks of monitoring equipment line the walls, tracking readings that shouldn't be possible. The displays show electromagnetic fluctuations, gravitational anomalies, temporal distortions. Whatever they've found, it's not dead.`,
      x: 0,
      y: 3,
      z: -1,
      imageOnDisk: 'corp-construction-primary-containment-x0-y3-z-1.png',
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CONTAINMENT_ANTEROOM',
        down: 'z-2.ts:%OBSERVATION_DECK',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'observation windows',
          aliases: ['windows', 'observation'],
          description: `Thick observation windows—at least six inches of layered glass—look down into a containment chamber one level below. The glass is tinted slightly yellow, suggesting lead content for radiation shielding. Through it, you can see the artifact: a twisted structure of black stone and ancient metal, surrounded by monitoring equipment and bright lights.`,
        },
        {
          prototype: 'describable',
          name: 'monitoring equipment',
          aliases: ['monitors', 'equipment', 'displays'],
          description: `Banks of scientific instruments, their displays showing readings that defy easy interpretation. One monitor tracks "TEMPORAL FLUX" in units that shouldn't exist. Another shows "DIMENSIONAL BLEED" as a fluctuating graph. A third displays what appears to be a heartbeat—slow, irregular, impossibly deep.`,
        },
        {
          prototype: 'describable',
          name: 'artifact',
          aliases: ['structure', 'black stone'],
          description: `Visible through the observation windows, the artifact dominates the chamber below. It's roughly fifteen feet tall, made of a stone that seems to drink the light around it and metal that has corroded in patterns that suggest extreme age. The structure has no obvious purpose, but it radiates a presence that makes your teeth ache and your dreams threaten to escape into your waking thoughts.`,
        },
      ],
    },
  },
};
