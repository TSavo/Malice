// Fabrication Factory - Third Floor (z=2)
// Biofarm - Waste reclamation and nutrient synthesis

export const building = {
  name: 'Fabrication Factory',
  x: -20,
  y: 8,
  width: 3,
  height: 4,
  floors: 4,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - TOP ROW (y=11)
    // ═══════════════════════════════════════════════════════════════════

    '%WASTE_INTAKE': {
      name: 'Fabrication Factory - Waste Intake',
      description: `The smell hits first—not rot exactly, but the ghost of rot, sanitized and processed into something clinical. Conveyor belts emerge from slots in the western wall, carrying the city's refuse into the building's digestive system. The belts never stop. Seattle generates waste faster than it generates anything else.

The walls are coated in something slick and nonporous, easy to hose down. Drains line the floor in parallel grooves, channeling runoff toward processing. The lighting is harsh and shadowless—nothing hides here, nothing festers in dark corners. The AI keeps this place sterile through sheer persistence.

Warning placards cover every surface, their symbols universal: biohazard, chemical hazard, mechanical hazard. The room doesn't care what you were before you came here. Everything becomes feedstock eventually.`,
      x: -20,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 70,
      lighting: 90,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%SORTING',
        south: '%GRINDING',
      },
    },

    '%SORTING': {
      name: 'Fabrication Factory - Sorting Floor',
      description: `Mechanical arms pivot and plunge in choreographed patterns, separating the incoming stream into categories the AI has deemed useful. Organics go one way, plastics another, metals a third. The arms move too fast to follow, their decisions made in milliseconds by algorithms that learned efficiency from zetabytes of waste processing data.

The floor vibrates constantly—conveyors, sorters, compactors, all running in overlapping rhythms. The sound is industrial white noise, loud enough to feel in your teeth. Catwalks crisscross overhead, maintenance access for systems that rarely need maintaining.

Bins along the walls hold the uncategorizable—items the AI can't classify, things that don't fit the processing parameters. The bins are nearly empty. The AI has learned to classify almost everything.`,
      x: -19,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 80,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%WASTE_INTAKE',
        east: '%DECONTAM',
        south: '%ELEVATORS_Z2',
      },
    },

    '%DECONTAM': {
      name: 'Fabrication Factory - Decontamination Chamber',
      description: `Ultraviolet light bathes everything in harsh purple, rendering the room in alien colors. This is where the sorted material gets sterilized—pathogens destroyed, toxins neutralized, biological threats reduced to harmless chemistry. The UV arrays cycle in patterns, ensuring no surface escapes treatment.

The air tastes of ozone, sharp and metallic. Ventilation systems work overtime, cycling the atmosphere through filters that trap anything the UV missed. The walls are polished metal, reflective, bouncing the sterilizing light into every corner and crevice.

Airlocks seal both entrances—nothing enters or leaves without passing through decontamination protocols. The AI learned early that contamination spreads. It learned what happens when biological systems fail. It doesn't allow failure here.`,
      x: -18,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 55,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%SORTING',
        south: '%BIOREACTORS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - SECOND ROW (y=10)
    // ═══════════════════════════════════════════════════════════════════

    '%GRINDING': {
      name: 'Fabrication Factory - Grinding Chamber',
      description: `Industrial shredders reduce organic matter to slurry, their teeth spinning behind reinforced housings. The sound is wet and mechanical—the crunch of material being unmade, broken down into constituent parts. What enters as recognizable waste exits as homogeneous paste, ready for biological processing.

The chamber is humid, moisture condensing on every surface. Splash guards line the walls, stained despite regular cleaning. The floor slopes toward central drains where the processed material flows downward into the vat system below.

The air filtration struggles here—faint organic notes escape despite the scrubbers, a reminder of what this material used to be. The AI processes it all without preference. Waste is waste. Nutrients are nutrients. The transformation is purely mechanical.`,
      x: -20,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 85,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%WASTE_INTAKE',
        east: '%ELEVATORS_Z2',
      },
    },

    '%ELEVATORS_Z2': {
      name: 'Fabrication Factory - Biofarm Lobby',
      description: `The elevator lobby on the processing floor, sealed behind airlocks that maintain atmospheric separation from the rest of the building. The air here is filtered, scrubbed, a brief respite from the organic processes surrounding it. Positive pressure keeps contaminants out—the lobby breathes outward.

Decontamination stations flank the elevator doors, mandatory for anyone moving between floors. The protocols are automated, enforced by systems that won't open the next door until the previous one confirms sterilization complete.

Through reinforced windows, the vat halls are visible below—rows of bioreactors churning with engineered microorganisms, turning waste into sustenance. The view is meant to reassure. The city's survival, rendered in stainless steel and bacterial cultures.`,
      x: -19,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 45,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SORTING',
        east: '%BIOREACTORS',
        south: '%VAT_BETA',
        west: '%GRINDING',
        'in': '%E',
      },
    },

    '%BIOREACTORS': {
      name: 'Fabrication Factory - Bioreactor Bay',
      description: `Cylindrical tanks line the walls, each one a controlled ecosystem where engineered bacteria break down sterilized feedstock into base nutrients. The tanks glow faintly—bioluminescent markers that indicate culture health. Green means thriving. The tanks are all green.

Temperature and pH readings scroll across mounted displays, the vital signs of organisms too small to see. The bacteria don't know they're saving the city. They just consume and multiply, converting waste into amino acids, lipids, carbohydrates. The building blocks of nutrition.

The room hums with pumps circulating growth medium, aerators bubbling oxygen through the cultures, heating elements maintaining optimal conditions. The bacteria are pampered. They're the most important workers in the building, and they work for free.`,
      x: -18,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 60,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DECONTAM',
        west: '%ELEVATORS_Z2',
        south: '%FILTRATION',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - THIRD ROW (y=9)
    // ═══════════════════════════════════════════════════════════════════

    '%VAT_ALPHA': {
      name: 'Fabrication Factory - Vat Hall Alpha',
      description: `Massive fermentation vats dominate the space, each one three stories tall and wide enough to swim in. The vats process the output from grinding—organic slurry transformed through controlled fermentation into nutrient-rich biomass. The process takes days. The vats never empty.

Walkways ring the vats at multiple levels, access points for sampling and maintenance. The metal is warm to the touch—fermentation generates heat, and the vats radiate it constantly. The air is thick, humid, carrying the yeasty smell of active cultures.

Viewing ports in the vat walls reveal the contents: brownish-green biomass, churning slowly as agitators keep the cultures mixed. It doesn't look like food. It isn't, yet. Several more processing steps remain before it becomes something a human could stomach.`,
      x: -20,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 55,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%VAT_BETA',
        south: '%SYNTHESIS',
      },
    },

    '%VAT_BETA': {
      name: 'Fabrication Factory - Vat Hall Beta',
      description: `The secondary vat hall handles the cleaner processes—bacterial cultures that have already been filtered and concentrated, now undergoing final fermentation before synthesis. The vats here are smaller, more numerous, each one dedicated to producing specific nutrient profiles.

The smell is different from Alpha—less organic rot, more industrial chemistry. The bacteria here produce compounds to order: specific vitamins, targeted proteins, essential fatty acids. The AI adjusts the recipes based on population nutritional data, compensating for deficiencies before they become epidemics.

Pipes connect the vats in a maze of stainless steel, routing output to filtration and synthesis. The plumbing diagram would be incomprehensible to human engineers. The AI designed it for efficiency, not legibility.`,
      x: -19,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 50,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEVATORS_Z2',
        east: '%FILTRATION',
        south: '%PILL_PRESS',
        west: '%VAT_ALPHA',
      },
    },

    '%FILTRATION': {
      name: 'Fabrication Factory - Filtration Center',
      description: `Banks of membrane filters remove impurities from the processed biomass—cellular debris, metabolic byproducts, anything that isn't pure nutrition. The filtration happens in stages, each membrane finer than the last, until what remains is concentrated nutrient solution ready for synthesis.

The room is quieter than the vat halls, the loudest sound the steady pulse of pumps pushing fluid through filter stacks. Pressure gauges line the walls, monitoring flow rates and filter integrity. When filters clog, automated systems swap them out. The used filters go back to grinding. Nothing is wasted.

The output is almost clear—faintly yellow, nutrient-dense liquid that doesn't look like it came from garbage. That's the point. By the time it reaches consumers, the origin is invisible. Just calories and vitamins in convenient form.`,
      x: -18,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 40,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BIOREACTORS',
        west: '%VAT_BETA',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - BOTTOM ROW (y=8)
    // ═══════════════════════════════════════════════════════════════════

    '%SYNTHESIS': {
      name: 'Fabrication Factory - Nutrient Synthesis',
      description: `Chemical reactors combine filtered nutrients with binding agents, stabilizers, and flavor compounds—transforming liquid nutrition into something approaching palatability. The AI has spent years optimizing the formula, balancing nutritional completeness against the human tendency to reject food that tastes like what it is.

The synthesis process is precise, measured in milligrams and milliseconds. Temperature, pH, mixing speed—all controlled to produce consistent output. Every batch is identical. The pills don't vary because variation means waste, and waste means someone doesn't eat.

The room smells faintly of artificial vanilla—the flavor compound the AI determined humans find least offensive. It masks nothing, really. But it makes the pills easier to swallow, and that's enough.`,
      x: -20,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 45,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%VAT_ALPHA',
        east: '%PILL_PRESS',
      },
    },

    '%PILL_PRESS': {
      name: 'Fabrication Factory - Pill Press',
      description: `Rotary tablet presses stamp out nutrition in convenient form—small pills, each one containing a calculated fraction of daily requirements. The presses run constantly, their rhythm mechanical and precise, producing thousands of pills per minute. The output accumulates in hoppers, a steady stream of survival.

Quality control happens inline—weight checks, hardness tests, dissolution sampling. Pills that fail get recycled back to synthesis. The rejection rate is nearly zero. The AI has optimized the process beyond human capability.

The pills are beige, unremarkable, deliberately anonymous. They could be vitamins, supplements, anything. The AI learned that appearance matters. People eat more readily when they can pretend they don't know what they're eating.`,
      x: -19,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 65,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%VAT_BETA',
        east: '%PACKAGING',
        west: '%SYNTHESIS',
      },
    },

    '%PACKAGING': {
      name: 'Fabrication Factory - Packaging Bay',
      description: `Blister packs, bottles, and bulk containers receive their allotment of pills, sealed and labeled by machines that never tire of repetition. The packaging is minimal—enough to protect the product, nothing more. Resources are too scarce for decorative waste.

Conveyor belts carry finished packages toward shipping, sorted by destination. Some go to corporate distribution centers, rationed to employees. Some go to public dispensaries, available to anyone with credits or desperation. The AI doesn't discriminate in production. Distribution is someone else's problem.

The labels are simple: NUTRIENT SUPPLEMENT - DAILY DOSE - FABRICATION FACTORY PIONEER SQUARE. No ingredients listed. No one wants to read them anyway. The pills keep people alive. That's the only information that matters.`,
      x: -18,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 50,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PILL_PRESS',
      },
    },
  },

  postProcessors: [],
};
