// Pioneer Books - Roof (z=2)
// Flat roof atop 2-story corner building
// Access via internal stairwell

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2) - Open 2x2 area atop 2-story building
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SW': {
      name: 'Pioneer Books - Roof (Southwest)',
      description: `The southwest corner of the roof, two stories above Yesler Way. A rooftop access door opens from a small stairwell housing, its metal frame rusted but still functional. Someone painted the door green years ago—the same green as the bookstore's signage below—but the paint has faded and peeled.

The roof is flat tar and gravel, the kind of utilitarian surface that was never meant to be walked on except for maintenance. Puddles collect in low spots, reflecting the grey Seattle sky. The parapet is low brick, barely knee-high, topped with aluminum flashing that has oxidized to a dull white.

Smith Tower rises to the west, its white terra cotta facade visible above the surrounding rooftops. From up here you can see how the tower dominates the neighborhood, how everything else defers to its height.`,
      x: -15,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%LANDING',
        east: '%ROOF_SE',
        north: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'roof access door',
          aliases: ['door', 'access', 'stairwell'],
          description: `A metal door in a small brick housing, providing access from the stairwell below. The door was painted green to match the bookstore's branding, but the paint has weathered to a pale, peeling memory of green. The hinges are rusted but functional. A deadbolt lock is set in the frame, though the door stands unlocked—someone came up here and didn't bother locking up behind them.`,
        },
        {
          prototype: 'describable',
          name: 'gravel surface',
          aliases: ['gravel', 'tar', 'roof surface'],
          description: `The roof surface is tar covered in a layer of pale gravel, the standard flat-roof treatment for buildings of this era. The gravel has shifted over time, creating bare patches where the black tar shows through. Puddles collect in low spots, never quite draining. The surface crunches underfoot, each step audible.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Pioneer Books - Roof (Southeast)',
      description: `The southeast corner overlooks the vacant lot across Yesler Way—the chain-link fence, the foundation of a building that was never built, the faded sign promising luxury condos and ground-floor retail. The promises on the sign were never kept. The lot remains empty.

An old TV antenna rises from this corner, a relic from before cable and satellite made such things obsolete. The antenna is bent, its elements pointing in random directions, no longer capable of receiving anything even if there were signals to receive. Rust has eaten through the mounting bracket.

The parapet offers a view of the debris wall to the north, the collapsed buildings that seal Pioneer Square from downtown. From up here the scale of the destruction is visible—blocks of rubble where blocks of buildings used to stand.`,
      x: -14,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'old TV antenna',
          aliases: ['antenna', 'aerial'],
          description: `A TV antenna from decades past, its aluminum elements bent and rusted, its mounting bracket corroded through. The antenna points in multiple directions at once, victim of winds and neglect. It hasn't received a signal in years—even before whatever ended everything, cable had made rooftop antennas obsolete. This one remains, a monument to a technology no one uses.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Pioneer Books - Roof (Northwest)',
      description: `The northwest corner of the roof, where the building meets its neighbor. The adjacent building is taller by a story, its brick wall rising above the bookstore's parapet, blocking the western view. Someone has used this sheltered corner—old cigarette butts, a faded beer can, the evidence of breaks taken on a rooftop where no one would see.

A skylight is set into the roof here, its glass grimy but intact. Through the dirty glass you can see down into the reading nook below—the armchairs, the rare books case, the coffee table with its scattered magazines. The view is like looking into a diorama of a world that stopped.

Pigeons have nested along the edge where the buildings meet. Feathers and droppings mark their territory.`,
      x: -14,
      y: 13,
      z: 2,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'skylight',
          aliases: ['glass', 'window'],
          description: `A rectangular skylight set into the roof, its metal frame rusted at the corners, its glass grimy with accumulated dirt. Through the glass you can see down into the reading nook below—a bird's-eye view of armchairs and bookshelves. The skylight doesn't open; it was designed only to let light in. It still does that, after a fashion, filtering grey sky into the room below.`,
        },
        {
          prototype: 'describable',
          name: 'cigarette butts',
          aliases: ['butts', 'cigarettes', 'evidence'],
          description: `A scatter of old cigarette butts in the corner where two buildings meet, sheltered from wind and rain. The filters have yellowed, the paper disintegrated, but the evidence remains—someone used to come up here for smoke breaks, away from the customers and the no-smoking signs. An empty beer can lies among the butts, its label faded to illegibility.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Pioneer Books - Roof (Northeast)',
      description: `The northeast corner of the roof, exposed to wind from all directions. The parapet here shows weather damage—bricks crumbling, mortar cracked, the aluminum flashing peeled back in places. Water has found its way into the wall, freeze-thaw cycles doing their slow work of destruction.

The view northeast shows the alleys and back lots of Pioneer Square, the infrastructure that the storefronts hide—dumpsters, fire escapes, loading docks, the working parts of a commercial district. Most of the dumpsters are empty now. The loading docks receive nothing.

A vent pipe rises from this corner, exhaust from the back stacks below. The pipe is capped with a conical rain hat, rusted but still attached. The smell of old books rises faintly when the wind is right.`,
      x: -15,
      y: 13,
      z: 2,
      population: 0,
      ambientNoise: 18,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'vent pipe',
          aliases: ['vent', 'exhaust', 'pipe'],
          description: `A vent pipe rising from the building below, capped with a conical rain hat that has rusted to a mottled brown. The pipe provides ventilation for the back stacks—and when the wind is right, carries the faint scent of old books up to the roof. Paper and dust and the particular smell of knowledge slowly decaying.`,
        },
        {
          prototype: 'describable',
          name: 'damaged parapet',
          aliases: ['parapet', 'wall', 'bricks'],
          description: `The parapet here shows its age—bricks crumbling at the corners, mortar cracked and missing in places, the aluminum flashing peeled back to expose the structure beneath. Water has been working its way in for years, freeze-thaw cycles slowly turning solid brick into rubble. The building is dying from the top down, one winter at a time.`,
        },
      ],
    },
  },
};
