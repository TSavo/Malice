// Yesler Laundry - Roof (z=2)
// Flat roof with clotheslines and a view of Occidental Park
// Someone used to hang laundry up here to save on dryer costs

export const building = {
  name: 'Yesler Laundry',
  x: -9,
  y: 12,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF': {
      name: 'Yesler Laundry - Roof',
      description: `The flat roof of the laundry building is an unexpected garden of decay. Clotheslines stretch between poles, their wire rusted but still taut, plastic clothespins still clipped to the lines. Someone hung laundry up here to save on dryer costs—sheets and towels that caught the sun and wind instead of tumbling in expensive machines. The clothespins hold nothing now. The last laundry blew away decades ago.

Potted plants line the roof edge, their soil long since dried to dust, their occupants reduced to brown stalks that crumble at a touch. Someone tried to make this space a garden. The garden died with everything else.

A plastic lawn chair sits facing west toward Occidental Park, its webbing sun-bleached to near transparency. From here, the iron pergola is visible, its Victorian curves leaning against Seattle's grey sky. The park is visible but empty, the benches and trees still standing, the people gone.

The roof surface is tar paper, cracked and peeling, pooling water in depressions that never quite drain. A TV antenna stands at one corner, its array oriented toward towers that no longer broadcast.`,
      x: -9,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z1.ts#BEDROOM',
      },
      sittables: [
        {
          name: 'bleached lawn chair',
          capacity: 1,
          emptyMsg:
            'A plastic lawn chair with webbing bleached nearly transparent, facing west toward the park.',
          occupiedMsg: '%s in the lawn chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'clotheslines',
          aliases: ['lines', 'wire', 'clothespins'],
          description: `Clotheslines stretched between metal poles, the wire rusted but still taut. Plastic clothespins are clipped at regular intervals, holding nothing but fifty-five years of weather. Someone hung laundry here to dry in the sun and wind, saving quarters on the dryers below. The last sheets to hang here blew away long ago, but the clothespins keep waiting.`,
        },
        {
          prototype: 'describable',
          name: 'dead planters',
          aliases: ['planters', 'pots', 'plants', 'garden'],
          description: `Terracotta and plastic planters along the roof edge, filled with soil that dried to powder and plants that died to brown stalks. Tomato cages stand empty, their purpose forgotten. A bag of potting soil has burst and scattered. Someone tried to grow things up here—herbs, vegetables, flowers. The garden outlived the gardener by a few weeks, then followed them into death.`,
        },
        {
          prototype: 'describable',
          name: 'dead TV antenna',
          aliases: ['antenna', 'aerial', 'tv'],
          description: `A TV antenna mounted at the roof corner, its aluminum elements oriented toward broadcast towers that went silent fifty-five years ago. The antenna pulled signals out of the air once—news, entertainment, the voices of a world that still talked to itself. The antenna still points at the sky. The sky stopped talking.`,
        },
        {
          prototype: 'describable',
          name: 'view of the park',
          aliases: ['view', 'park', 'pergola', 'occidental'],
          description: `From here, Occidental Park is visible to the west—the iron pergola leaning at its north end, the cobblestones and benches and trees that somehow survived when people didn't. The pergola's Victorian curves are distinctive even at this distance, decorative ironwork rusted brown, cast iron outlasting everything it was built to shelter. The park is empty but intact. A good place to rest, if you can forget what used to fill it.`,
        },
        {
          prototype: 'describable',
          name: 'pooled rainwater',
          aliases: ['water', 'puddles', 'pools'],
          description: `Depressions in the deteriorating roof surface collect rainwater that never quite drains. The water breeds mosquitoes in summer, freezes to ice in winter, slowly seeps through cracks to the apartment below. The roof was meant to shed water. Fifty-five years of Seattle weather have found every weakness.`,
        },
      ],
    },
  },

  postProcessors: [],
};
