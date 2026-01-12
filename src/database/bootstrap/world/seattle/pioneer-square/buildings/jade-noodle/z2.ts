// Jade Noodle House - Roof (z=2)
// Flat roof with clotheslines and a view of the International District
// The cook dried vegetables up here in summer

export const building = {
  name: 'Jade Noodle House',
  x: -10,
  y: -6,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF': {
      name: 'Jade Noodle House - Roof',
      description: `The flat roof served practical purposes: clotheslines stretch between poles, still holding clips but no laundry. Drying racks show where vegetables were sun-dried in summer—mushrooms and chilies and bitter melon, the preserved ingredients that extended seasonal availability. The racks are collapsed now, their wooden frames rotted.

A rooftop garden occupies several large planters, the soil long since dried to powder, the plants reduced to brown stalks. Chinese vegetables grew here: bok choy and Chinese broccoli, bitter melon climbing trellises, the produce that the restaurant used and the cook preferred fresh. The garden died in the first weeks without watering. No one came to tend it.

From here, the International District spreads in all directions—storefronts with signs in a dozen Asian languages, the concentrated diversity that defined this neighborhood. The festival wire still spans the street below, installed for Lunar New Year celebrations that haven't happened in fifty-five years.

A wooden crate serves as seating, positioned to watch the sunset over Elliott Bay. The cook probably sat here after service, smoking maybe, resting hands tired from pulling noodles.`,
      x: -10,
      y: -6,
      z: 2,
      imageOnDisk: 'jade-noodle-house-roof-x-10-y-6-z2.png',
      population: 0,
      ambientNoise: 10,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z1.ts#KITCHEN_LIVING',
      },
      sittables: [
        {
          name: 'wooden crate',
          capacity: 1,
          emptyMsg:
            'A wooden produce crate positioned to watch the sunset, worn smooth by sitting.',
          occupiedMsg: '%s on the wooden crate',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'clotheslines',
          aliases: ['lines', 'laundry', 'clothespins'],
          description: `Clotheslines stretched between metal poles, plastic clothespins still clipped at intervals. The lines held laundry once—work clothes stained with kitchen grease, bedding aired in summer sun. The clothespins hold nothing now. The last laundry blew away or was taken in, fifty-five years ago.`,
        },
        {
          prototype: 'describable',
          name: 'drying racks',
          aliases: ['racks', 'dried vegetables'],
          description: `Collapsed wooden drying racks, the frames rotted, the mesh screens rusted and torn. Vegetables were dried here: mushrooms for umami depth, chilies for the heat that Sichuan cooking demanded, bitter melon sliced thin and sun-dried. The preservation technique is older than refrigeration. The racks that enabled it have returned to nature.`,
        },
        {
          prototype: 'describable',
          name: 'dead garden',
          aliases: ['garden', 'planters', 'vegetables'],
          description: `Large planters that once held a rooftop garden: bok choy and Chinese broccoli, bitter melon climbing bamboo trellises. The soil is powder now, the plants brown stalks, the trellises collapsed. The garden provided fresh vegetables for the restaurant and the family. It died in the first weeks, unwatched, unwatered.`,
        },
        {
          prototype: 'describable',
          name: 'district view',
          aliases: ['view', 'panorama', 'chinatown'],
          description: `The International District spreads below: signs in Chinese, Vietnamese, Korean, Japanese, the concentrated diversity of immigrant communities. Festival wire spans the street—installed for Lunar New Year, still there, holding nothing. The dragon dancers haven't come in fifty-five years. The fireworks haven't exploded. The new year kept coming, but no one celebrated.`,
        },
        {
          prototype: 'describable',
          name: 'exhaust vent',
          aliases: ['vent', 'exhaust', 'kitchen vent'],
          description: `The kitchen exhaust vent, its cap rusted, its pipe stained with grease that seeped out over years of cooking. The vent exhausted the smoke and steam and smell of ten thousand meals. The smell is gone now. The vent exhausts nothing but stale air from a kitchen that will never cook again.`,
        },
      ],
    },
  },

  postProcessors: [],
};
