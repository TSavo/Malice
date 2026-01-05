// Corp Construction - Level -2 (z=-2)
// Infrastructure Hub and Research Level
// The artifact chamber and the secrets Continuum is hiding

export const building = {
  name: 'Corp Construction',
  x: 0,
  y: 1,
  width: 7,
  height: 4,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LEVEL -2 (z=-2) - INFRASTRUCTURE AND RESEARCH
    // ═══════════════════════════════════════════════════════════════════

    '%INFRASTRUCTURE_HUB': {
      name: 'Corp Construction - Infrastructure Hub',
      description: `The heart of the underground facility's life support systems. Massive air handlers process thousands of cubic feet per minute, maintaining the precise atmospheric conditions required by the research levels below. Power distribution panels cover one wall, fed by cables thick as a man's arm that descend from the surface generators.

This level is fully operational, has been for months. The "construction" above is camouflage for a facility that's already running. The infrastructure here could support hundreds of workers, but the corridors are nearly empty. Whatever Continuum is doing down here, they're keeping the crew minimal.

An elevator continues down to Level -3, but access is restricted. The corridor west leads to the observation deck overlooking the artifact chamber.`,
      x: 2,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 55,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: 'z-1.ts:%CONSTRUCTION_ZONE',
        west: '%OBSERVATION_DECK',
        south: '%DATA_CENTER',
        down: {
          to: 'z-3.ts:%RESEARCH_LEVEL',
          door: {
            prototype: 'door',
            name: 'Level -3 Access',
            description:
              'A heavy security door with multiple biometric scanners. A warning sign reads: LEVEL -3 RESTRICTED - DIRECTOR AUTHORIZATION REQUIRED.',
            locked: true,
            open: false,
          },
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'air handlers',
          aliases: ['hvac', 'ventilation'],
          description: `Industrial air handling units, each the size of a shipping container. The specifications on their plates indicate they're rated for biological containment—capable of maintaining negative pressure to prevent contamination escape or positive pressure to protect sensitive equipment. The facility can switch modes as needed.`,
        },
        {
          prototype: 'describable',
          name: 'power distribution',
          aliases: ['power', 'electrical'],
          description: `A wall of power distribution panels, each feeding different sections of the facility. The labels are cryptic: "CONTAINMENT FIELD A," "STASIS ARRAY," "TEMPORAL SHIELDING." Whatever they're powering, it's not standard construction equipment.`,
        },
      ],
    },

    '%OBSERVATION_DECK': {
      name: 'Corp Construction - Observation Deck',
      description: `A curved observation platform overlooking the artifact chamber, the primary containment area visible through reinforced windows. From this level, you're at eye-height with the artifact itself—that twisted structure of black stone and corroded metal that shouldn't exist, shouldn't be possible, and yet sits there radiating wrongness.

The observation deck is equipped with monitoring stations, each manned by... no one. The stations are running, their screens displaying data, but the operators are absent. Emergency protocols, perhaps. Or something else.

The artifact has grown. Old photographs on one wall show the structure when it was first excavated—smaller, more contained. Now it spreads, tendrils of black stone extending toward the chamber walls. The containment field crackles visibly where the tendrils get too close.`,
      x: 0,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%INFRASTRUCTURE_HUB',
        up: 'z-1.ts:%PRIMARY_CONTAINMENT',
        north: '%ARTIFACT_CHAMBER',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'monitoring stations',
          aliases: ['stations', 'consoles', 'monitors'],
          description: `Workstations equipped with displays showing real-time data from the artifact chamber. The readings are unsettling: "GROWTH RATE: 0.3mm/day," "EMANATION FREQUENCY: 17Hz (increasing)," "PERSONNEL EXPOSURE LIMIT: 4 hours." Someone is tracking this thing very carefully.`,
        },
        {
          prototype: 'describable',
          name: 'historical photographs',
          aliases: ['photographs', 'photos', 'pictures'],
          description: `A series of photographs documenting the artifact's excavation. The first shows workers in vintage hazmat suits carefully exposing something black in the earth. Subsequent photos show it growing—each image taken weeks apart, each showing the structure larger and more complex. The final photo was taken recently. The artifact is now three times the size it was when first uncovered.`,
        },
        {
          prototype: 'describable',
          name: 'containment field',
          aliases: ['field', 'energy field'],
          description: `A shimmer in the air around the artifact, visible as a faint blue glow where it contacts physical matter. The containment field generators line the chamber ceiling, their hum adding to the ambient noise. The field isn't keeping something out—it's keeping something in.`,
        },
      ],
    },

    '%ARTIFACT_CHAMBER': {
      name: 'Corp Construction - Artifact Chamber',
      description: `The chamber itself, separated from the observation deck by an airlock. The artifact dominates the space—fifteen feet of twisted black stone and ancient metal, its surfaces covered in markings that hurt to look at. The markings shift when you're not directly watching them.

The floor around the artifact is marked with concentric warning circles: GREEN (safe), YELLOW (limited exposure), RED (emergency only), and a black zone immediately around the base where no one is supposed to go. Some of the equipment in the black zone has been... changed. Metal has fused with stone. Plastic has crystallized.

The artifact pulses with something that isn't quite light and isn't quite sound. It's aware of you. It's always aware.`,
      x: 0,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OBSERVATION_DECK',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'the artifact',
          aliases: ['artifact', 'structure', 'black stone', 'foundation'],
          description: `Close up, the artifact is even more disturbing. The black stone isn't just dark—it's an absence, a hole in the visible spectrum. The metal components are green with verdigris in some places and impossibly pristine in others, as if they exist in different time periods simultaneously. The markings carved into every surface form patterns that suggest language, but a language with no grammar of human thought. Looking at them too long makes your vision swim and your thoughts scatter. This thing was here before Seattle. Before humans. Before the current arrangement of continents. And it's been waiting.`,
        },
        {
          prototype: 'describable',
          name: 'warning zones',
          aliases: ['zones', 'circles', 'markings'],
          description: `Concentric circles painted on the floor: green at the outer edge (SAFE ZONE - 6 HOUR LIMIT), yellow closer in (CAUTION - 1 HOUR LIMIT), red near the base (EMERGENCY ACCESS ONLY - 10 MIN MAX), and a black zone immediately around the artifact (NO ACCESS - CONTAINMENT BREACH RISK). The equipment in the black zone has been transformed—a metal tool cart now grows crystal spines, a plastic container has fused to the floor in organic curves.`,
        },
        {
          prototype: 'describable',
          name: 'transformed equipment',
          aliases: ['equipment', 'changed', 'fused'],
          description: `Objects that strayed too close to the artifact and paid the price. A toolbox has grown roots of black metal into the floor. A clipboard is now a crystalline slate, the notes visible but frozen in glass. A hard hat has become a bowl of teeth. The artifact changes everything it touches, makes everything part of itself.`,
        },
      ],
    },

    '%DATA_CENTER': {
      name: 'Corp Construction - Data Center',
      description: `A small but sophisticated data center, its servers processing information from the artifact monitoring systems. The room is kept at precisely 65 degrees, the servers humming with a workload that seems excessive for a construction site—or even for monitoring a single artifact.

The truth is on the screens: this isn't the only site. Similar facilities exist in three other locations, their feeds displayed on a central monitor. The same black stone artifact, or similar ones, under similar containment in other cities. Continuum has been finding these things, excavating them, studying them. They call it "Project Foundation."

One screen shows a timeline. The artifacts are connected somehow. They've been dormant for millennia, but they're waking up. The Seattle artifact was the first. It won't be the last.`,
      x: 2,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 45,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%INFRASTRUCTURE_HUB',
        east: '%ARCHIVES',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'servers',
          aliases: ['computers', 'server racks'],
          description: `Rows of high-density servers, their indicator lights blinking patterns that almost seem intentional. The servers process data from hundreds of sensors monitoring the artifact, looking for patterns in its emanations, tracking its growth, predicting its behavior. The predictions aren't encouraging.`,
        },
        {
          prototype: 'describable',
          name: 'site feeds',
          aliases: ['monitors', 'feeds', 'screens'],
          description: `A central display shows feeds from multiple facilities: "SEATTLE - PIONEER SQUARE (ACTIVE)," "CHICAGO - LOOP (EXCAVATION)," "LONDON - ALDGATE (DORMANT)," "TOKYO - NIHONBASHI (CLASSIFIED)." Each shows a similar scene—containment chambers, monitoring equipment, and variations of the same black stone structure. They're everywhere.`,
        },
        {
          prototype: 'describable',
          name: 'project timeline',
          aliases: ['timeline', 'chart'],
          description: `A timeline stretching back millennia, marked with significant events: "10,000 BCE - DORMANCY BEGINS," "1889 - GREAT SEATTLE FIRE (EMANATION SPIKE)," "2019 - FIRST DETECTION," "2024 - EXCAVATION COMPLETE," "2025 - GROWTH ACCELERATION," "202? - AWAKENING (PROJECTED)." The projection date has been revised multiple times. Each revision moves the awakening closer.`,
        },
      ],
    },

    '%ARCHIVES': {
      name: 'Corp Construction - Research Archives',
      description: `A secure archive containing everything Continuum has learned about the artifacts and Project Foundation. Filing cabinets line the walls, each labeled with classification codes and access restrictions. A reading room occupies the center, its table scattered with documents someone was reviewing before they left in a hurry.

The oldest documents are hand-written, dating back to 1889. The city founders knew something was buried here. The fire that destroyed downtown wasn't entirely accidental—it was meant to cover an excavation attempt that went wrong. The artifacts were left buried, the knowledge passed down through secret channels until Continuum inherited it.

A section of the archive is labeled "AFFECTED PERSONNEL." The files inside document what happens to people who spend too much time near the artifacts. The photographs are disturbing. The medical reports are worse.`,
      x: 3,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DATA_CENTER',
      },
      objects: [
        {
          prototype: 'container',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files', 'archives'],
          description: `Heavy steel filing cabinets, each requiring both key and combination to open. The labels span a range of topics: "EMANATION STUDIES," "GROWTH PATTERNS," "HISTORICAL RECORDS," "PERSONNEL INCIDENTS," "CONTAINMENT PROTOCOLS," "COMMUNICATION ATTEMPTS." Someone has been trying to talk to these things.`,
          locked: true,
          maxItems: 100,
          maxWeight: 50,
        },
        {
          prototype: 'describable',
          name: 'historical documents',
          aliases: ['documents', 'papers', 'records'],
          description: `Hand-written documents from 1889, their edges burned, their text faded. "We have found something beneath the city that should not be. The fire has covered our work but not our discovery. Let this record stand for those who come after: DO NOT DIG. DO NOT DISTURB. LET THEM SLEEP." Continuum ignored the warning.`,
        },
        {
          prototype: 'describable',
          name: 'personnel files',
          aliases: ['affected personnel', 'medical files'],
          description: `Files documenting what happens to researchers who exceed exposure limits. The progression is consistent: first, vivid dreams. Then, knowledge of things they shouldn't know. Then, the changes start—minor at first, then accelerating. Some developed abilities. Some developed... complications. None of them are still working on the project. Some of them aren't still human.`,
        },
      ],
    },
  },
};
