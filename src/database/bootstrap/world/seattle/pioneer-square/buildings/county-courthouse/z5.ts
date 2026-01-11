// King County Courthouse - Roof (z=5)
// Rooftop mechanical area and observation

export const building = {
  rooms: {
    '%ROOF': {
      name: 'King County Courthouse - Roof',
      description: `The roof of the courthouse offers a commanding view of Pioneer Square and beyond—a brutalist observation deck that was never meant for visitors but serves the purpose now. The concrete is weather-stained, puddles collecting in low spots, drainage systems overwhelmed by Seattle's perpetual rain.

HVAC equipment clusters near the stairwell exit, massive units that once kept hundreds of rooms comfortable. The equipment is silent, its function ended, its bulk remaining. Pigeons have colonized the space, their droppings covering everything, their cooing the only sound besides wind.

From here, the geography of justice is visible: the streets where police made arrests, the jail where defendants waited, the courthouse where their fates were decided. The system had a logic, a flow, inputs and outputs. The flow has stopped. The geography remains.`,
      x: 9,
      y: 2,
      z: 5,
      imageOnDisk: 'king-county-courthouse-roof-x9-y2-z5.png',
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z4.ts#%ROOF_ACCESS',
        north: '%ROOF_NORTH',
        south: '%ROOF_SOUTH',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'HVAC equipment',
          aliases: ['hvac', 'equipment', 'units'],
          description: `Massive HVAC units, industrial-scale climate control for a building that once held hundreds. The equipment is silent, fans frozen, compressors cold. Pigeons nest in the housing, their cooing echoing from inside the machinery. The building's lungs have stopped breathing.`,
        },
        {
          prototype: 'describable',
          name: 'pigeon colony',
          aliases: ['pigeons', 'birds'],
          description: `Pigeons have claimed the rooftop, their droppings covering every horizontal surface. The birds coo and strut, indifferent to the building's purpose or its abandonment. They've found shelter from hawks and weather. The courthouse serves their needs now.`,
        },
      ],
    },

    '%ROOF_NORTH': {
      name: 'King County Courthouse - Roof (North)',
      description: `The north edge of the roof overlooks Pioneer Square, the historic district spreading out below. The brick buildings of the nineteenth century are visible from here, their rooftops a patchwork of different eras and maintenance standards. Smith Tower rises to the northwest, its pyramid top still the landmark it's been for a century.

A safety railing lines the edge, chest-high, designed to prevent falls that would create liability. The liability has ended. The railing remains, habit of safety persisting past the safety itself.

Someone has left a camp chair here, positioned for watching the city. The chair is weathered but functional. The watcher is gone. The view continues.`,
      x: 9,
      y: 3,
      z: 5,
      imageOnDisk: 'king-county-courthouse-roof-north-x9-y3-z5.png',
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF',
      },
      sittables: [
        {
          name: 'camp chair',
          capacity: 1,
          emptyMsg:
            'A weathered camp chair faces the view, positioned by someone who spent time watching the city.',
          occupiedMsg: '%s sitting in the camp chair, watching the city',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'pioneer square view',
          aliases: ['view', 'cityscape'],
          description: `Pioneer Square spreads out below, its brick buildings and cobblestone streets visible from this height. Smith Tower rises to the northwest, its ornate pyramid still catching light. The neighborhood looks orderly from here, its decay invisible at this distance. The view is beautiful. The reality is more complicated.`,
        },
        {
          prototype: 'describable',
          name: 'safety railing',
          aliases: ['railing', 'rail'],
          description: `A steel safety railing, chest-high, preventing falls from the roof edge. The railing was installed to protect workers and prevent lawsuits. The workers are gone. The lawsuits have ended. The railing remains, a habit of safety in a world where safety has different meanings.`,
        },
      ],
    },

    '%ROOF_SOUTH': {
      name: 'King County Courthouse - Roof (South)',
      description: `The south edge of the roof faces the stadiums and the industrial district beyond. The stadiums are visible as massive shapes, their purposes unclear from this distance—sports, entertainment, gatherings of people who no longer gather.

A utility shed houses backup generators and emergency equipment, its door hanging open, its contents undisturbed. The generators were for emergencies. The emergency came. The generators weren't the kind of help that was needed.

The parapet here is lower, the view more exposed. Wind whips across the concrete, carrying the smell of salt water from the bay. The courthouse is close to the water, the geography of the original settlement, the flat land at the edge of the sound.`,
      x: 9,
      y: 1,
      z: 5,
      imageOnDisk: 'king-county-courthouse-roof-south-x9-y1-z5.png',
      population: 0,
      ambientNoise: 18,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'stadium view',
          aliases: ['stadiums', 'view'],
          description: `The stadiums are visible to the south, massive structures built for gathering tens of thousands of people. The gatherings have ended. The structures remain, monuments to entertainment that no longer entertains. From here they're just shapes, their purpose abstract.`,
        },
        {
          prototype: 'cabinet',
          name: 'utility shed',
          aliases: ['shed', 'generators'],
          description: `A utility shed housing emergency generators and equipment. The door is open, revealing diesel generators that could power critical systems during outages. The generators are intact, fuel tanks showing levels, the equipment ready to function. No one has started them. The emergency they were designed for is different from the one that came.`,
        },
      ],
    },
  },
};
