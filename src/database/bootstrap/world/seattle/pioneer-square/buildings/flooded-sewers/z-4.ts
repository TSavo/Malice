// Flooded Sewers - Level z=-4 (with connections to z=-3 and z=-5)
// Dangerous waterways beneath the city
// Where the water rises, the desperate hide, and things lurk in the depths

export const building = {
  name: 'Flooded Sewers',
  x: -5,
  y: -25,
  width: 20,
  height: 15,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // UPPER ACCESS (z=-3)
    // ═══════════════════════════════════════════════════════════════════════

    '%OVERFLOW_CHAMBER': {
      name: 'Overflow Chamber',
      description: `A storm drain overflow chamber where water from the surface collects during heavy rains. The chamber is designed to prevent street flooding, funneling excess water into the deeper sewer system. When the rains come, this chamber fills quickly—a death trap for anyone caught inside.

The walls are stained with tide marks. The highest mark is near the ceiling.`,
      x: -5,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 5,
      waterLevel: 25,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/homeless-warrens/z-3.ts',
          room: '%FLOOD_ZONE',
          description: 'A passage rises toward the homeless warrens',
        },
        down: '%MAIN_JUNCTION',
        east: '%STORM_DRAIN',
      },
      objects: [
        { prototype: 'furniture', name: 'overflow grates', description: 'Heavy iron grates allow water to flow in from above. They\'re designed to prevent backflow, trapping anyone who enters.', boltedDown: true },
        { prototype: 'sign', name: 'depth warnings', description: 'Painted markers show water depths: "SAFE" at knee height, "DANGER" at waist, "FATAL" at chest. The fatal line has been crossed.', boltedDown: true },
        { prototype: 'furniture', name: 'debris ledge', description: 'A narrow ledge runs along one wall, above the highest water mark. It\'s the only refuge when the chamber floods.', boltedDown: true },
      ],
    },

    '%STORM_DRAIN': {
      name: 'Storm Drain Tunnel',
      description: `A large storm drain tunnel carries rainwater from the surface into the sewer system. The tunnel is tall enough to walk upright when dry, but the water level is unpredictable. Flash floods have killed the unwary.

Graffiti covers the accessible walls—tags from those who explore these passages for sport.`,
      x: -2,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%OVERFLOW_CHAMBER',
        south: '%DRAIN_JUNCTION',
        east: {
          to: 'buildings/industrial-underground/z-2.ts',
          room: '%SEWER_JUNCTION',
          description: 'The drain rises toward the industrial passages',
        },
      },
      objects: [
        { prototype: 'sign', name: 'urban explorer graffiti', description: 'Tags cover the walls: crew names, dates, messages. "SEWER RATS 2019", "FIRST TO MAP THIS SECTION", "WATCH THE WATER".', boltedDown: true },
        { prototype: 'furniture', name: 'flow gauge', description: 'A rusted gauge measures water flow. Its needle is pinned at maximum, though the flow today is moderate.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN LEVEL (z=-4)
    // ═══════════════════════════════════════════════════════════════════════

    '%MAIN_JUNCTION': {
      name: 'Main Sewer Junction',
      description: `The primary junction of Seattle's historic sewer system—a cathedral-like space where multiple large pipes converge. The water is waist-deep and cold, flowing sluggishly toward the treatment plant that never fully processes this section. The smell is indescribable.

Old infrastructure and new intersect here. Neither works properly.`,
      x: -5,
      y: -14,
      z: -4,
      population: 0,
      ambientNoise: 50,
      lighting: 3,
      waterLevel: 50,
      outdoor: false,
      exits: {
        up: '%OVERFLOW_CHAMBER',
        north: {
          to: 'buildings/rat-pits/z-4.ts',
          room: '%SEWER_ACCESS',
          description: 'A pipe leads up toward the rat pits',
        },
        east: '%PIPE_GALLERY',
        west: '%COLLAPSED_SECTION',
        south: '%DEEP_FLOW',
      },
      objects: [
        { prototype: 'furniture', name: 'junction platform', description: 'A raised platform provides access to the various pipes. It\'s the only dry ground in the chamber.', boltedDown: true },
        { prototype: 'sign', name: 'pipe labels', description: 'Faded labels mark each pipe: "COMBINED SEWER OVERFLOW", "STORM DRAIN 7", "INDUSTRIAL EFFLUENT". Some labels are deliberately obscured.', boltedDown: true },
        { prototype: 'furniture', name: 'maintenance equipment', description: 'Abandoned maintenance equipment rusts on the platform: wrenches, a broken pump, coiled hose. The city stopped sending workers here years ago.', boltedDown: true },
      ],
    },

    '%DRAIN_JUNCTION': {
      name: 'Drain Junction',
      description: `A smaller junction where storm drains meet the main sewer line. The water here is cleaner than the sewage—rainwater and street runoff, carrying urban detritus: plastic bags, cigarette butts, the occasional lost object washed into a gutter.

Homeless people sometimes shelter here during dry spells. When it rains, they die.`,
      x: -2,
      y: -14,
      z: -4,
      population: 0,
      ambientNoise: 45,
      lighting: 4,
      waterLevel: 35,
      outdoor: false,
      exits: {
        north: '%STORM_DRAIN',
        west: '%MAIN_JUNCTION',
        south: '%SUBMERGED_TUNNEL',
      },
      objects: [
        { prototype: 'furniture', name: 'debris accumulation', description: 'Street debris piles against the grates: plastic bottles, food wrappers, a shopping cart wheel, countless plastic bags.', boltedDown: true },
        { prototype: 'furniture', name: 'a makeshift camp', description: 'Evidence of temporary habitation: a waterlogged sleeping bag, empty cans, a soaked paperback. The camp was abandoned quickly.', boltedDown: true },
        { prototype: 'sign', name: 'flash flood warning', description: 'A hand-painted sign wired to the grate: "WHEN IT RAINS ABOVE, RUN". The paint has run from exposure to water.', boltedDown: true },
      ],
    },

    '%PIPE_GALLERY': {
      name: 'Pipe Gallery',
      description: `A long gallery where massive pipes run along the walls—carrying water, sewage, and industrial effluent to unknown destinations. The pipes hum and gurgle with constant flow. Some are modern PVC; others are original cast iron from the city's founding.

The newer pipes are labeled. The older ones are mysteries.`,
      x: 0,
      y: -14,
      z: -4,
      population: 0,
      ambientNoise: 55,
      lighting: 2,
      waterLevel: 40,
      outdoor: false,
      exits: {
        west: '%MAIN_JUNCTION',
        east: '%RAT_OVERFLOW',
        south: '%INDUSTRIAL_OUTFALL',
      },
      objects: [
        { prototype: 'furniture', name: 'pipe infrastructure', description: 'Pipes of various sizes line the walls: modern PVC, older concrete, ancient cast iron. They carry the city\'s liquid waste to processing—or to the bay.', boltedDown: true },
        { prototype: 'sign', name: 'utility markings', description: 'Color-coded markings identify pipe contents: blue for water, green for storm, brown for sanitary. Some pipes have no markings at all.', boltedDown: true },
        { prototype: 'furniture', name: 'a leaking junction', description: 'A joint between old and new pipe weeps constantly, adding to the water level. No one has come to repair it.', boltedDown: true },
      ],
    },

    '%RAT_OVERFLOW': {
      name: 'Rat Overflow',
      description: `A transition zone where the sewer meets the rat territories above. The water carries food scraps and waste that the rats harvest—an endless supply line for the colony. The rats swim through the muck with comfortable ease.

The splash of tiny bodies is constant. They're always here, always feeding.`,
      x: 4,
      y: -14,
      z: -4,
      population: 0,
      ambientNoise: 60,
      lighting: 1,
      waterLevel: 45,
      outdoor: false,
      exits: {
        west: '%PIPE_GALLERY',
        north: {
          to: 'buildings/rat-pits/z-4.ts',
          room: '%FLOODED_PASSAGE',
          description: 'A flooded tunnel leads up to the rat pits',
        },
        south: '%TOXIC_POOL',
      },
      objects: [
        { prototype: 'furniture', name: 'rat highways', description: 'Pipes and ledges above the waterline serve as rat highways—dry routes through the wet territory. Traffic is constant.', boltedDown: true },
        { prototype: 'sign', name: 'feeding evidence', description: 'Food scraps accumulate where the current is slow—the rats\' harvest from the city\'s waste. They never go hungry.', boltedDown: true },
        { prototype: 'furniture', name: 'a floating platform', description: 'A wooden pallet wedged against the wall serves as a feeding platform. Rats gather here to consume their finds.', boltedDown: true },
      ],
    },

    '%COLLAPSED_SECTION': {
      name: 'Collapsed Section',
      description: `A section of the old sewer has collapsed, creating a dam of debris that backs up water into a deep pool. The collapse may have been natural—or it may have been deliberate. Either way, passage is difficult, and the pool hides what lies beneath.

Some say bodies are weighted and dropped here. The water keeps its secrets.`,
      x: -8,
      y: -14,
      z: -4,
      population: 0,
      ambientNoise: 30,
      lighting: 1,
      waterLevel: 70,
      outdoor: false,
      exits: {
        east: '%MAIN_JUNCTION',
        south: '%SUBMERGED_CHAMBER',
        down: '%DEEP_POOL',
      },
      objects: [
        { prototype: 'furniture', name: 'debris dam', description: 'Collapsed concrete and brick form a dam across the passage, backing up water into a deep pool. Debris continues to accumulate.', boltedDown: true },
        { prototype: 'sign', name: 'depth unknown', description: 'A painted warning on the wall: "DEPTH UNKNOWN - DO NOT SWIM". Someone has added: "BODIES".', boltedDown: true },
        { prototype: 'furniture', name: 'floating debris', description: 'Debris floats on the pool\'s surface: wood, plastic, a shoe, something that might be fabric or might be something else.', boltedDown: true },
      ],
    },

    '%INDUSTRIAL_OUTFALL': {
      name: 'Industrial Outfall',
      description: `Where industrial waste once flowed into the sewer system—pipes from the canneries, foundries, and factories that operated before environmental regulations. The pipes are sealed now, officially. But they still weep toxic residue.

The water here has an oily sheen. The smell burns the throat.`,
      x: 0,
      y: -16,
      z: -4,
      population: 0,
      ambientNoise: 40,
      lighting: 2,
      waterLevel: 55,
      outdoor: false,
      exits: {
        north: '%PIPE_GALLERY',
        west: '%DEEP_FLOW',
        south: '%TOXIC_POOL',
      },
      objects: [
        { prototype: 'furniture', name: 'sealed outfall pipes', description: 'Large pipes are welded shut, painted with hazard symbols. But the welds have cracked, and dark liquid seeps from the joints.', boltedDown: true },
        { prototype: 'sign', name: 'hazmat warnings', description: 'Faded signs warn of chemical hazards: "ARSENIC", "LEAD", "BENZENE". The industrial past doesn\'t stay in the past.', boltedDown: true },
        { prototype: 'furniture', name: 'chemical residue', description: 'An oily film covers the water, rainbow-sheened in the dim light. It clings to everything it touches.', boltedDown: true },
      ],
    },

    '%TOXIC_POOL': {
      name: 'Toxic Pool',
      description: `A dead-end chamber where industrial runoff has accumulated over decades—a pool of chemicals, sewage, and decay. The water glows faintly in complete darkness, bioluminescent bacteria feeding on the toxic soup. Nothing else lives here.

Entering this water is suicide. Slow, painful suicide.`,
      x: 4,
      y: -16,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 3,
      waterLevel: 80,
      outdoor: false,
      exits: {
        north: '%RAT_OVERFLOW',
        west: '%INDUSTRIAL_OUTFALL',
      },
      objects: [
        { prototype: 'furniture', name: 'glowing water', description: 'The pool glows with sickly bioluminescence—bacteria that thrive in toxic conditions. The glow reveals shapes beneath the surface.', boltedDown: true },
        { prototype: 'sign', name: 'death warning', description: 'Scratched into the concrete: "DON\'T TOUCH THE WATER. DON\'T BREATHE THE AIR. DON\'T STAY LONG."', boltedDown: true },
        { prototype: 'furniture', name: 'chemical crusts', description: 'Crystalline deposits ring the pool\'s edge—chemicals precipitating as the water evaporates. They crumble at a touch.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP LEVEL (z=-5)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_FLOW': {
      name: 'Deep Flow',
      description: `Below the main sewer level, an older system still carries water—the original drainage built before the Great Fire, now submerged and half-forgotten. The water here is cold and black, moving with a current that has no obvious source.

The current is stronger than it should be. Something is drawing the water deeper.`,
      x: -5,
      y: -16,
      z: -4,
      population: 0,
      ambientNoise: 45,
      lighting: 0,
      waterLevel: 65,
      outdoor: false,
      exits: {
        north: '%MAIN_JUNCTION',
        east: '%INDUSTRIAL_OUTFALL',
        west: '%SUBMERGED_CHAMBER',
        down: '%DEEP_POOL',
      },
      objects: [
        { prototype: 'furniture', name: 'the current', description: 'A strong current pulls water toward the unknown depths. It\'s too powerful to swim against for long.', boltedDown: true },
        { prototype: 'sign', name: 'old pipe markings', description: 'Faded markings from before the Fire: "SEATTLE WATER WORKS - 1887". The original infrastructure, still functioning after a fashion.', boltedDown: true },
      ],
    },

    '%SUBMERGED_TUNNEL': {
      name: 'Submerged Tunnel',
      description: `A completely flooded passage connects the upper sewers to something deeper. The tunnel requires swimming—or diving—to traverse. Those who enter don't always return. Those who do return don't always speak of what they saw.

The water is cold. The current is strong. The darkness is absolute.`,
      x: -2,
      y: -16,
      z: -4,
      population: 0,
      ambientNoise: 25,
      lighting: 0,
      waterLevel: 100,
      outdoor: false,
      exits: {
        north: '%DRAIN_JUNCTION',
        down: '%SUNKEN_PASSAGE',
      },
      objects: [
        { prototype: 'sign', name: 'diving warnings', description: 'A waterproof sign: "SUBMERGED TUNNEL - 30M - EXPERIENCED DIVERS ONLY". Someone has added: "CAME BACK ALONE".', boltedDown: true },
        { prototype: 'furniture', name: 'abandoned gear', description: 'Diving equipment lies abandoned at the tunnel entrance: a wetsuit, a weight belt, a flashlight that no longer works.', boltedDown: true },
      ],
    },

    '%SUBMERGED_CHAMBER': {
      name: 'Submerged Chamber',
      description: `A once-dry chamber now permanently flooded—the water table has risen over the decades, claiming more territory each year. Only the ceiling remains above water, a pocket of foul air trapped in the dome.

What lies below the waterline is not visible. But it's there.`,
      x: -8,
      y: -16,
      z: -4,
      population: 0,
      ambientNoise: 20,
      lighting: 0,
      waterLevel: 85,
      outdoor: false,
      exits: {
        north: '%COLLAPSED_SECTION',
        east: '%DEEP_FLOW',
        down: '%DEEP_POOL',
      },
      objects: [
        { prototype: 'furniture', name: 'air pocket ceiling', description: 'A dome of trapped air provides a small breathing space. The air is foul with decay and methane. It won\'t sustain life for long.', boltedDown: true },
        { prototype: 'sign', name: 'waterline progression', description: 'Marks on the walls show the rising waterline over years. Each year, more of the chamber disappears.', boltedDown: true },
      ],
    },

    '%DEEP_POOL': {
      name: 'Deep Pool',
      description: `At the lowest point of the sewer system, water collects in a vast underground pool—the accumulation of decades of flow, with nowhere left to go. The pool is deep; exactly how deep, no one knows. Divers have gone down. Not all have come up.

The water is cold. The darkness is complete. Something moves in the depths.`,
      x: -6,
      y: -17,
      z: -5,
      population: 0,
      ambientNoise: 10,
      lighting: 0,
      waterLevel: 95,
      outdoor: false,
      exits: {
        up: '%DEEP_FLOW',
        east: '%SUNKEN_PASSAGE',
        south: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%ABYSSAL_SHAFT',
          description: 'A flooded passage connects to the cistern depths',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'the depths', description: 'The pool\'s depth is unknown. Lights dropped from above fade into blackness before reaching bottom—if there is a bottom.', boltedDown: true },
        { prototype: 'sign', name: 'diver\'s last message', description: 'Scratched into the wall near the water: "WENT DOWN 40M. SAW SOMETHING. NOT GOING BACK DOWN."', boltedDown: true },
        { prototype: 'furniture', name: 'air bubbles', description: 'Occasionally, bubbles rise from the depths—air escaping from somewhere below. Or something breathing.', boltedDown: true },
      ],
    },

    '%SUNKEN_PASSAGE': {
      name: 'Sunken Passage',
      description: `A completely submerged passage leads to unknown destinations—perhaps other cisterns, perhaps natural caves, perhaps something else entirely. The passage is navigable only by divers, and only the foolish or desperate make the attempt.

What waits at the other end is a mystery. Most prefer it that way.`,
      x: -2,
      y: -18,
      z: -5,
      population: 0,
      ambientNoise: 5,
      lighting: 0,
      waterLevel: 100,
      outdoor: false,
      exits: {
        up: '%SUBMERGED_TUNNEL',
        west: '%DEEP_POOL',
      },
      objects: [
        { prototype: 'furniture', name: 'guide rope', description: 'A frayed rope is anchored here, leading into the flooded passage. It\'s the only way to navigate in complete darkness.', boltedDown: true },
        { prototype: 'sign', name: 'passage length', description: 'Scratched numbers on the wall: "47M TO AIR. 3 MIN BREATH HOLD. BRING LIGHT. BRING BACKUP."', boltedDown: true },
        { prototype: 'furniture', name: 'diving cache', description: 'A waterproof container holds emergency supplies: a working flashlight, spare batteries, a knife. Someone maintains this for fellow explorers.', boltedDown: true },
      ],
    },
  },
};
