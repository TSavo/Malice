// Smith Tower - Chinese Room Floor (z=35)
// Historic observation deck and private club

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%LOBBY' },
    },

    '%LOBBY': {
      name: 'Observation Deck Lobby',
      description: 'A small landing with brass fixtures and wood paneling. A sign on the wall reads "CHINESE ROOM - PRIVATE CLUB" in faded gold lettering.',
      x: -4,
      y: 8,
      z: 35,
      population: 0,
      ambientNoise: 4,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CHINESE_ROOM',
        east: '%OBS_DECK',
        in: '%E',
      },
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        callElevator: "const player = args[0];\nconst floorNumber = 35;\nconst elevatorId = self.elevatorId || null;\n\nif (!elevatorId) {\n  return 'The call button clicks uselessly. No power.';\n}\n\nconst elevator = await $.load(elevatorId);\nif (!elevator) {\n  return 'Nothing answers the button press.';\n}\n\nif (elevator.currentFloor === floorNumber) {\n  if (!elevator.doorsOpen && elevator.openDoors) {\n    await elevator.openDoors();\n  }\n  return 'The elevator is already here.';\n}\n\nif (elevator.selectFloor) {\n  const result = await elevator.selectFloor(player, floorNumber);\n  return result?.message || 'You press the button. Machinery stirs above.';\n}\n\nreturn 'The button light flickers, but nothing happens.';",
      },
      elevatorId: '%E',
    },

    '%CHINESE_ROOM': {
      name: 'Chinese Room',
      description: 'An ornate room with carved rosewood panels and jade inlays. Hand-carved furniture sits arranged around low tables, the craftsmanship intricate even through decades of dust. A throne-like chair sits against the far wall—the wishing chair where brides once sat for luck. Red silk wallpaper has faded to rust. The air smells of old wood and incense long burned out.',
      x: -5,
      y: 8,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        south: '%BAR',
      },
    },

    '%BAR': {
      name: 'Private Bar',
      description: 'A small bar with a carved mahogany counter and glass shelving behind it, mostly empty now. A few dusty bottles remain. Brass fixtures and dim lighting give it the atmosphere of a speakeasy.',
      x: -5,
      y: 7,
      z: 35,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CHINESE_ROOM',
      },
    },

    '%OBS_DECK': {
      name: 'Observation Deck',
      description: 'A narrow walkway with windows on three sides offering views of Pioneer Square below and the city beyond. The glass is grimy but the height is dizzying. Coin-operated viewfinders point outward, their lenses clouded.',
      x: -3,
      y: 8,
      z: 35,
      population: 0,
      ambientNoise: 5,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
        south: '%OBS_SOUTH',
      },
    },

    '%OBS_SOUTH': {
      name: 'South Observation Deck',
      description: 'The southern section of the observation deck with views toward the waterfront and stadiums. A few benches face the windows.',
      x: -3,
      y: 7,
      z: 35,
      population: 0,
      ambientNoise: 4,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%OBS_DECK',
      },
    },
  },
};
