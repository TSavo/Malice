// Smith Tower - Executive Offices (z=3)
// Continuum executive headquarters - prepared space awaiting personnel

export const building = {
  rooms: {
    // Shared elevator car placeholder
    '%E': {
      prototype: 'elevator',
      exits: { out: '%P' },
    },

    // ═════════════════════════════════════════════════════════════════
    // LOCKS
    // ═════════════════════════════════════════════════════════════════

    // Corporate Lock for floor 3 (renamed from %L1 to %L_CORP)
    '%L_CORP': {
      prototype: 'biometricLock',
      name: 'Corporate Access Scanner',
      description:
        'A sleek retinal scanner with a corporate emblem. The indicator glows blue when active.',
      allowedFaction: 'Corporate',
      factionDenyMessage:
        'Corporate clearance required. Your faction is not authorized for this floor.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Biometric scan failed.' },
      ],
      authorizedUsers: {
        3: [],
      },
    },

    // CEO Suite Door Lock
    '%L_CEO': {
      prototype: 'biometricLock',
      name: 'CEO Office Lock',
      description: 'A sophisticated lock beside a seamless executive door.',
      allowedFaction: 'Corporate',
      factionDenyMessage: 'Corporate executive access required.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Biometric scan failed.' },
      ],
      authorizedUsers: {},
    },

    // Exec A Door Lock
    '%L_EXEC_A': {
      prototype: 'biometricLock',
      name: 'Executive Suite A Lock',
      description: 'A lock beside a polished office door.',
      allowedFaction: 'Corporate',
      factionDenyMessage: 'Corporate clearance required.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Biometric scan failed.' },
      ],
      authorizedUsers: {},
    },

    // Exec B Door Lock
    '%L_EXEC_B': {
      prototype: 'biometricLock',
      name: 'Executive Suite B Lock',
      description: 'A lock beside a polished office door.',
      allowedFaction: 'Corporate',
      factionDenyMessage: 'Corporate clearance required.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Biometric scan failed.' },
      ],
      authorizedUsers: {},
    },

    // Archive Door Lock
    '%L_ARCHIVE': {
      prototype: 'biometricLock',
      name: 'Archive Access Lock',
      description: 'A secure lock for document storage.',
      allowedFaction: 'Corporate',
      factionDenyMessage: 'Archive access requires Corporate clearance.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Biometric scan failed.' },
      ],
      authorizedUsers: {},
    },

    // ═════════════════════════════════════════════════════════════════
    // DOORS
    // ═════════════════════════════════════════════════════════════════

    '%D_CEO': {
      prototype: 'door',
      name: 'CEO Office Door',
      description: 'A seamless executive door with retinal scanner.',
      locked: true,
      open: false,
      locks: ['%L_CEO'],
    },

    '%D_EXEC_A': {
      prototype: 'door',
      name: 'Executive Suite A Door',
      description: 'A polished office door with scanner.',
      locked: true,
      open: false,
      locks: ['%L_EXEC_A'],
    },

    '%D_EXEC_B': {
      prototype: 'door',
      name: 'Executive Suite B Door',
      description: 'A polished office door with scanner.',
      locked: true,
      open: false,
      locks: ['%L_EXEC_B'],
    },

    '%D_ARCHIVE': {
      prototype: 'door',
      name: 'Archive Access Door',
      description: 'A secure door with advanced lock.',
      locked: true,
      open: false,
      locks: ['%L_ARCHIVE'],
    },

    // ═════════════════════════════════════════════════════════════════
    // CENTER ROW (y=+10): Elevator Lobby, Reception, Conference
    // ═════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Smith Tower - 3rd Floor - Executive Lobby',
      description: `A polished lobby with dark stone floors and recessed lighting. Wall panels display: CONTINUUM EXECUTIVE SUITES. A digital directory shows office assignments, all reading: UNASSIGNED.

The space is pristine, modern, echoing. The air smells of filtered air and new carpet. Elevator doors stand to the east, corridors extending to executive suites. Everything is ready, waiting for occupants who haven't arrived.`,
      x: -2,
      y: 10,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BOARD',
        south: '%STAFF',
        east: '%CONF',
        west: '%RECEPTION',
        in: '%E',
      },
      elevatorId: '%E',
    },

    '%RECEPTION': {
      name: 'Smith Tower - 3rd Floor - Executive Reception',
      description: `A reception area with a sleek desk and multiple waiting chairs arranged in conversational clusters. A display terminal sits dark beside the desk, reading: RECEPTION - TEMPORARILY UNMANNED.

The chairs are leather, new. The desk surface is clean, organized with empty document trays. Overhead lights provide even, shadowless illumination. The space is silent, waiting.`,
      x: -3,
      y: 10,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        south: '%STAFF',
        north: '%BOARD',
      },
      sittables: [
        {
          name: 'a leather waiting chair',
          capacity: 8,
          emptyMsg: 'Leather chairs wait in clusters, unused.',
          occupiedMsg: '%s sitting in the reception area.',
        },
      ],
    },

    '%CONF': {
      name: 'Smith Tower - 3rd Floor - Executive Conference Room',
      description: `A medium conference room with table seating eight. Videoconferencing display on wall stands in standby mode. Wall-mounted whiteboard is clean.

A display reads: EXECUTIVE CONFERENCE - AWAITING SCHEDULE. The room is functional, prepared. Climate control hums quietly. Lighting is calibrated for presentations.`,
      x: -1,
      y: 10,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%EXEC_A', door: '%D_EXEC_A' },
        west: '%LOBBY',
        south: '%MEETING',
      },
      sittables: [
        {
          name: 'the conference table',
          capacity: 8,
          emptyMsg: 'The conference table sits empty.',
          occupiedMsg: '%s seated at the conference table.',
        },
      ],
    },

    '%SUPPORT': {
      name: 'Smith Tower - 3rd Floor - Executive Support',
      description: `An administrative workspace with multiple desks and filing systems. Each workstation has terminal and chair. Central communication terminal stands ready.

A display reads: EXECUTIVE SUPPORT - PERSONNEL PENDING. The desks are clean, organized. The space feels like it's waiting for a team to arrive and begin work.`,
      x: 0,
      y: 10,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%EXEC_B', door: '%D_EXEC_B' },
        west: '%STAFF',
        south: '%LOUNGE',
      },
      sittables: [
        {
          name: 'a workstation',
          capacity: 6,
          emptyMsg: 'Six workstations stand empty.',
          occupiedMsg: '%s working at the workstations.',
        },
      ],
    },

    '%STAFF': {
      name: 'Smith Tower - 3rd Floor - Staff Facilities',
      description: `A break area with multiple seating clusters. Beverage station stands against wall, currently unstocked. Climate control maintains comfortable temperature.

A display reads: STAFF FACILITIES - STANDBY. The seating is comfortable, modern. The space is clean, restful. A corridor leads west to storage, east to reception.`,
      x: -2,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        east: '%MEETING',
        west: { room: '%ARCHIVE', door: '%D_ARCHIVE' },
      },
      sittables: [
        {
          name: 'a break table',
          capacity: 6,
          emptyMsg: 'The break table is empty.',
          occupiedMsg: '%s seated at the break table.',
        },
        {
          name: 'comfortable chairs',
          capacity: 8,
          emptyMsg: 'Chairs wait empty.',
          occupiedMsg: '%s resting in the chairs.',
        },
      ],
    },

    // ═════════════════════════════════════════════════════════════════
    // TOP ROW (y=+11): Board Room, CEO, Executive Offices
    // ═════════════════════════════════════════════════════════════════

    '%BOARD': {
      name: 'Smith Tower - 3rd Floor - Board Room',
      description: `A large conference room with a polished table seating twelve. Floor-to-ceiling windows face north, showing grey city skyline. A holographic display system hangs from ceiling, currently dormant.

A wall display reads: BOARD OF DIRECTORS - NEXT MEETING: PENDING. The table surface is spotless, no documents. Videoconferencing units sit in standby mode. The room echoes.`,
      x: -3,
      y: 11,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%RECEPTION',
        east: { room: '%CEO', door: '%D_CEO' },
      },
      sittables: [
        {
          name: 'the board table',
          capacity: 12,
          emptyMsg: 'The board table sits empty.',
          occupiedMsg: '%s seated at the board table.',
        },
      ],
    },

    '%CEO': {
      name: 'Smith Tower - 3rd Floor - Chief Executive Office',
      description: `A spacious corner office with western and northern exposures. Executive desk faces city views through floor-to-ceiling glass. Private seating area occupies corner with comfortable lounge chairs.

A display on desk reads: CHIEF EXECUTIVE OFFICER - UNASSIGNED. The desk surface is clean, no personal effects. Communication terminal stands ready. The space feels grand but hollow.`,
      x: -2,
      y: 11,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%BOARD', door: '%D_CEO' },
      },
      sittables: [
        {
          name: 'an executive desk chair',
          capacity: 1,
          emptyMsg: 'The executive chair sits empty.',
          occupiedMsg: '%s seated at the executive desk.',
        },
        {
          name: 'lounge seating',
          capacity: 4,
          emptyMsg: 'Lounge chairs wait empty.',
          occupiedMsg: '%s seated in the lounge area.',
        },
      ],
    },

    '%EXEC_A': {
      name: 'Smith Tower - 3rd Floor - Executive Suite A',
      description: `A high-level executive office with desk, workspace, and meeting area. Western windows provide city views. Built-in shelving and filing systems line walls.

A display reads: EXECUTIVE SUITE A - UNASSIGNED. The workspace is arranged, ready. Chair, desk surface, lighting—all positioned for immediate occupancy.`,
      x: -1,
      y: 11,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { room: '%CONF', door: '%D_EXEC_A' },
        west: '%EXEC_B',
      },
      sittables: [
        {
          name: 'a desk chair',
          capacity: 1,
          emptyMsg: 'The desk chair waits.',
          occupiedMsg: '%s working at the desk.',
        },
        {
          name: 'meeting chairs',
          capacity: 3,
          emptyMsg: 'Meeting chairs are empty.',
          occupiedMsg: '%s seated in the meeting area.',
        },
      ],
    },

    '%EXEC_B': {
      name: 'Smith Tower - 3rd Floor - Executive Suite B',
      description: `A high-level executive office with corner windows facing northeast. Desk positioned to capture morning light. Small meeting area with two chairs.

A display reads: EXECUTIVE SUITE B - UNASSIGNED. The office is pristine, silent. Built-in storage cabinets stand ready for documents and materials.`,
      x: 0,
      y: 11,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { room: '%SUPPORT', door: '%D_EXEC_B' },
        east: '%EXEC_A',
      },
      sittables: [
        {
          name: 'a desk chair',
          capacity: 1,
          emptyMsg: 'The desk chair waits.',
          occupiedMsg: '%s working at the desk.',
        },
        {
          name: 'a meeting chair',
          capacity: 2,
          emptyMsg: 'Meeting chairs are empty.',
          occupiedMsg: '%s seated in the meeting area.',
        },
      ],
    },

    // ═════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+9): Archive, Staff, Meeting, Lounge
    // ═════════════════════════════════════════════════════════════════

    '%ARCHIVE': {
      name: 'Smith Tower - 3rd Floor - Secure Archive',
      description: `A secure storage room with climate-controlled filing systems. Digital lock panels on cabinet doors show green status. The space is cool, dry, organized.

A display reads: ARCHIVE STORAGE - RESTRICTED ACCESS. Filing cabinets line walls, all sealed. A small workspace table stands in corner for document review.`,
      x: -3,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%STAFF', door: '%D_ARCHIVE' },
      },
      sittables: [
        {
          name: 'a review table',
          capacity: 2,
          emptyMsg: 'The review table is empty.',
          occupiedMsg: '%s working at the review table.',
        },
      ],
    },

    '%MEETING': {
      name: 'Smith Tower - 3rd Floor - Private Meeting Room',
      description: `A smaller meeting room designed for confidential discussions. Frosted glass walls provide visual privacy while allowing ambient light. A round table seats six, promoting collaborative discussion.

A display reads: PRIVATE MEETING - AVAILABLE. Soundproofing panels line the walls. A small credenza holds refreshment supplies, currently empty. The lighting is warm, adjustable.`,
      x: -1,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CONF',
        west: '%STAFF',
        east: '%LOUNGE',
      },
      sittables: [
        {
          name: 'the round table',
          capacity: 6,
          emptyMsg: 'The round table sits empty.',
          occupiedMsg: '%s seated at the round table.',
        },
      ],
    },

    '%LOUNGE': {
      name: 'Smith Tower - 3rd Floor - Executive Lounge',
      description: `A comfortable lounge space for executives to relax between meetings. Deep leather couches and armchairs are arranged around a low coffee table. A small bar area stands against the east wall, bottles empty, glasses polished.

Floor-to-ceiling windows offer views of the city. A display reads: EXECUTIVE LOUNGE - COMPLIMENTARY REFRESHMENTS PENDING. The space is quiet, plush, waiting for the bustle of corporate life.`,
      x: 0,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SUPPORT',
        west: '%MEETING',
      },
      sittables: [
        {
          name: 'a leather couch',
          capacity: 3,
          emptyMsg: 'The leather couch waits invitingly.',
          occupiedMsg: '%s relaxing on the couch.',
        },
        {
          name: 'an armchair',
          capacity: 2,
          emptyMsg: 'Armchairs flank the coffee table.',
          occupiedMsg: '%s seated in an armchair.',
        },
        {
          name: 'a bar stool',
          capacity: 3,
          emptyMsg: 'Bar stools line the counter.',
          occupiedMsg: '%s perched at the bar.',
        },
      ],
    },
  },
};
