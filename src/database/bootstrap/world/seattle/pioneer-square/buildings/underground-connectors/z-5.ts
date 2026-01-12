// Z=-5 Connecting Passages
// The deepest regularly-accessed level of the underground
// Contains Gray Cartel secure facilities and ancient flooded passages

export const building = {
  name: 'Deep Passages Z-5',
  x: -17,
  y: -5,
  width: 10,
  height: 10,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════════
    // GRAY CARTEL DEEP CONNECTORS (x=-15, y=-2 and y=0)
    // Passages connecting the main Cartel facilities in underground-complex/z-4.ts
    // ═══════════════════════════════════════════════════════════════════════════

    '%ARCHIVE_LINK': {
      name: 'Archive Passage',
      description: `A secured passage runs parallel to the Archive, connecting the northern command section to the central corridor. The walls are reinforced steel plate over poured concrete—construction that exceeds structural necessity, built for containment rather than support.

The lighting is dim but adequate, strategic shadows providing concealment for the guard posts positioned at each end. Biometric scanners record everyone who passes—face, gait, heat signature. The Cartel misses nothing.

The passage shows signs of frequent use: the floor polished smooth in the transit path, the walls marked at hip height by brushing shoulders. This is a working corridor, not a display space.`,
      x: -15,
      y: -2,
      z: -5,
      imageOnDisk: 'archive-passage-x-15-y-2-z-5.png',
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      outdoor: false,
      exits: {
        north: '%5X15Y_3', // Deep Passage at (-15,-3,-5) in underground-complex
        south: '%COUNCIL_LINK',
        west: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%5Y_2',
          description: 'The passage connects to the main spine',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'reinforced walls',
          description:
            'Steel plates line the walls, floor, and ceiling. This corridor could survive a direct assault.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'biometric scanners',
          description:
            'Scanners record everyone who passes—face, gait, heat signature. The Cartel misses nothing.',
          boltedDown: true,
        },
      ],
    },

    '%COUNCIL_LINK': {
      name: 'Council Corridor',
      description: `A passage connecting the Council Chambers to the Vault. This is the heart of Cartel power—the route between where decisions are made and where resources are stored. Guards are posted at all hours, rotating in four-hour shifts.

The air is climate-controlled, the lighting perfect. Nothing is left to chance. The walls here are finished more carefully than elsewhere—smooth concrete, painted a neutral gray that absorbs light without reflecting it. The atmosphere is one of deliberate anonymity.

Sound-dampening materials line the walls, ensuring that conversations in the Council Chambers don't carry. What is said there stays there.`,
      x: -15,
      y: -1,
      z: -5,
      imageOnDisk: 'council-corridor-x-15-y-1-z-5.png',
      population: 1,
      ambientNoise: 20,
      lighting: 22,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%CC',
          description: 'The corridor leads to the Council Chambers',
        },
        east: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%TV',
          description: 'The corridor continues to the Vault',
        },
        north: '%ARCHIVE_LINK',
        south: '%LAB_LINK',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'guard station',
          description:
            'A small station provides seating for the guards. Monitors show feeds from every camera in the facility.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'climate control unit',
          description:
            'The air is precisely controlled—temperature, humidity, even oxygen levels. Nothing is left to chance.',
          boltedDown: true,
        },
      ],
    },

    '%LAB_LINK': {
      name: 'Lab Approach',
      description: `A sterile passage connects the Council section to the Medical Lab approach. The transition from administrative to scientific is marked by a decontamination zone—anyone continuing north must pass through UV sterilization and chemical spray before reaching the laboratory.

The floor here shows a different wear pattern: fewer footsteps, more deliberate movement. The people who come this way come with purpose, not for transit. The corridor serves a specific function in the Cartel's hierarchy of access.

Warning signs in multiple languages indicate the biological hazards beyond. The lab's requirements are absolute. Contamination would destroy years of work.`,
      x: -15,
      y: 0,
      z: -5,
      imageOnDisk: 'lab-approach-x-15-y0-z-5.png',
      population: 0,
      ambientNoise: 25,
      lighting: 28,
      outdoor: false,
      exits: {
        north: '%5X15Y1', // Deep Passage at (-15,1,-5) in underground-complex
        south: '%COUNCIL_LINK',
        west: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%5Y0',
          description:
            'The passage connects to the main spine near the quarters',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'decontamination zone',
          description:
            "UV lights and chemical sprayers ensure nothing living enters the lab that shouldn't.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'sterile surfaces',
          description:
            'Every surface gleams white. Cleaning is constant and thorough.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'biohazard warning signs',
          description:
            'Bright yellow signs warn of biological hazards beyond. The warnings are multilingual.',
          boltedDown: true,
        },
      ],
    },
  },
};
