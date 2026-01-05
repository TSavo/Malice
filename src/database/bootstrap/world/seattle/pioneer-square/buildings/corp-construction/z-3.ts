// Corp Construction - Level -3 (z=-3)
// Restricted Research Level - Director Authorization Required
// Where the real experiments happen

export const building = {
  name: 'Corp Construction',
  x: 6,
  y: 4,
  width: 7,
  height: 4,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LEVEL -3 (z=-3) - RESEARCH LEVEL (RESTRICTED)
    // ═══════════════════════════════════════════════════════════════════

    '%RESEARCH_LEVEL': {
      name: 'Corp Construction - Research Level',
      description: `Level -3, the deepest official floor of the facility. The air is different here—thicker, charged with static that makes your hair stand on end. The artifact's influence is stronger, seeping through the containment fields and the layers of reinforced concrete.

This level is dedicated to active research on the artifact's effects. Laboratory spaces line the corridors, each focused on a different aspect of the phenomenon: biology, physics, psychology, and disciplines that don't have proper names. The researchers here have been changed by their work, subtly. They see things others don't. They know things they shouldn't.

An emergency evacuation route leads up to Level -2. Deeper access—to levels that don't appear on any official blueprint—requires keys that most personnel don't have.`,
      x: 2,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: 'z-2.ts:%INFRASTRUCTURE_HUB',
        west: '%BIO_LAB',
        south: '%PHYSICS_LAB',
        east: '%PSYCHOLOGY_WING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'charged atmosphere',
          aliases: ['air', 'static', 'atmosphere'],
          description: `The air itself feels alive down here. Static electricity crackles between surfaces, sparks occasionally jumping between metal objects. The phenomenon isn't natural—it's bleed-through from the artifact, reality becoming less stable this close to something that doesn't obey normal rules.`,
        },
        {
          prototype: 'describable',
          name: 'research directory',
          aliases: ['directory', 'signs'],
          description: `A directory lists the facilities on this level: "BIO-INTEGRATION STUDIES (WEST)," "PHYSICS ANOMALIES (SOUTH)," "PSYCHOLOGICAL EFFECTS (EAST)." Each department is isolated from the others, compartmentalized. The researchers aren't supposed to compare notes.`,
        },
      ],
    },

    '%BIO_LAB': {
      name: 'Corp Construction - Bio-Integration Lab',
      description: `A biological research laboratory, its equipment pristine and disturbing in equal measure. The focus here is on understanding how the artifact changes living tissue—and how those changes might be controlled or reversed.

Specimen jars line the walls, each containing samples that started as something recognizable and became... other. Tissue that grows crystal structures. Blood that glows faintly in the dark. Organs that continue functioning weeks after extraction, their cells somehow sustained by the artifact's influence.

A surgical suite occupies the back of the lab, its table sized for a human subject. The restraints suggest the subjects aren't always willing. The logs suggest they aren't always human by the time they're finished.`,
      x: 1,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%RESEARCH_LEVEL',
        south: '%SPECIMEN_STORAGE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'specimen jars',
          aliases: ['specimens', 'jars', 'samples'],
          description: `Dozens of specimen jars, each labeled with cryptic codes and dates. The contents vary: tissues shot through with metallic threads, organs that pulse with their own light, structures that might once have been human hands before the artifact changed them. The oldest specimens date back to 1890. The changes were happening even then.`,
        },
        {
          prototype: 'describable',
          name: 'surgical suite',
          aliases: ['surgery', 'operating room', 'table'],
          description: `A fully equipped surgical suite, its table fitted with restraints at wrists, ankles, and head. The instruments laid out nearby aren't standard medical equipment—some are designed to work with tissue that's no longer entirely organic. A log book records procedures performed on subjects identified only by number. Subject 47's entry ends mid-sentence.`,
        },
      ],
    },

    '%SPECIMEN_STORAGE': {
      name: 'Corp Construction - Specimen Storage',
      description: `Cold storage for biological specimens, the temperature maintained just above freezing. The specimens here are larger than those in the main lab—entire limbs, organs, and in some cases, complete bodies in various stages of transformation.

One wall is dedicated to "SUCCESS CASES"—subjects who survived integration with artifact-altered tissue and retained their sanity. Their files show enhanced abilities, extended lifespans, sensory capabilities beyond normal human range. They're all marked as "ACTIVE FIELD ASSETS." Continuum is making super-soldiers.

The failure cases occupy more space. Their transformations weren't stable. Some became crystalline statues. Some became something fluid and hungry. Some are still alive in there, conscious behind glass, unable to die.`,
      x: 1,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 30,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BIO_LAB',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'success cases',
          aliases: ['successes', 'enhanced', 'assets'],
          description: `A section labeled "SUCCESS CASES" contains files and photos of integration subjects who survived and thrived. The photos show normal-looking humans, but the readings show anything but: enhanced strength, accelerated healing, sensory perception far beyond human normal. The files are marked "ACTIVE" with current assignments. These people are out in the world, working for Continuum, changed by the artifact.`,
        },
        {
          prototype: 'describable',
          name: 'failure cases',
          aliases: ['failures', 'transformations'],
          description: `Containment units holding what's left of integration attempts that went wrong. Some are crystalline masses, vaguely human-shaped, frozen in poses of agony. Others are liquid things that press against their glass, seeking release. One unit contains something that looks human until you meet its eyes—there's nothing there anymore, just hunger and patience.`,
        },
        {
          prototype: 'describable',
          name: 'stasis pods',
          aliases: ['pods', 'stasis'],
          description: `Several stasis pods contain subjects in suspended animation, their vital signs minimal but present. The monitors indicate they're in various stages of integration—the artifact's influence slowly remaking their cells. The process takes months. The subjects are dreaming throughout. Their brain activity patterns suggest the dreams are not pleasant.`,
        },
      ],
    },

    '%PHYSICS_LAB': {
      name: 'Corp Construction - Physics Anomalies Lab',
      description: `A physics laboratory designed to study the artifact's effects on fundamental reality. The equipment here is cutting-edge and beyond—particle detectors, gravitational sensors, devices that measure phenomena that shouldn't exist.

A containment field in the center of the room holds a shard of the artifact, separated from the main mass. The shard floats, rotating slowly, its surface flickering with something that isn't quite light. The instruments around it display impossible readings: negative mass, reversed entropy, temporal flux.

One wall is covered with equations, half of them crossed out, the other half circled and annotated with increasingly frantic handwriting. Someone was close to understanding something. The writing ends abruptly. The researcher's desk is still set up, waiting for someone who won't be back.`,
      x: 2,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%RESEARCH_LEVEL',
        east: '%MATERIALS_LAB',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'contained shard',
          aliases: ['shard', 'artifact fragment'],
          description: `A fragment of the artifact, perhaps six inches long, suspended in a containment field. The shard rotates slowly, its motion independent of any visible force. Its surface ripples like liquid but holds shape like stone. Looking at it too long induces vertigo and the sense that you're falling upward.`,
        },
        {
          prototype: 'describable',
          name: 'physics readings',
          aliases: ['readings', 'instruments', 'displays'],
          description: `Instrument displays showing readings that shouldn't be possible: "MASS: -0.7kg," "ENTROPY DELTA: NEGATIVE," "TEMPORAL VARIANCE: +0.003 SECONDS/HOUR." The shard exists slightly in the future, weighs less than nothing, and becomes more ordered over time. Normal physics have no explanation. Neither do the researchers.`,
        },
        {
          prototype: 'describable',
          name: 'equation wall',
          aliases: ['equations', 'formulas', 'whiteboard'],
          description: `A wall covered in equations attempting to explain the artifact's physics. The mathematics starts conventional and becomes increasingly strange—incorporating symbols that don't appear in any standard notation, variables that seem to represent concepts rather than quantities. The final equations are circled: "RESONANCE ACHIEVED AT [frequency symbol] = [impossible number]." Below, in shaky handwriting: "They're not artifacts. They're keys."`,
        },
      ],
    },

    '%MATERIALS_LAB': {
      name: 'Corp Construction - Materials Science Lab',
      description: `A laboratory dedicated to understanding and replicating the artifact's material properties. Samples of the black stone line workbenches, each being subjected to different tests: stress, heat, electrical current, acid. None of them show any effect. The material is impervious to everything they've tried.

What's more interesting is what happens when other materials are exposed to the artifact's influence. Metal becomes harder, lighter, stranger. Plastic gains crystalline properties. Glass becomes flexible. The researchers are learning to induce these changes intentionally, creating materials that shouldn't be possible.

A sealed cabinet contains prototypes: armor that repairs itself, tools that never dull, containers that are bigger inside than outside. The technology is beyond anything on the public market. Continuum is decades ahead, and they're not sharing.`,
      x: 3,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PHYSICS_LAB',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'artifact samples',
          aliases: ['samples', 'black stone'],
          description: `Small fragments of the artifact's black stone, each mounted for testing. One has been subjected to temperatures that would melt steel—no effect. Another shows no damage from industrial acid. A third was compressed with forces that should have crushed diamond. The material is perfect, unchanging, eternal.`,
        },
        {
          prototype: 'container',
          name: 'prototype cabinet',
          aliases: ['cabinet', 'prototypes'],
          description: `A sealed cabinet containing materials transformed by artifact exposure. Labels describe impossible properties: "SELF-HEALING POLYMER," "MASSLESS ALLOY," "SPATIALLY EXPANDED CONTAINER." Each item represents technology that would revolutionize its field. None of them will ever reach the public.`,
          locked: true,
          maxItems: 20,
          maxWeight: 100,
        },
        {
          prototype: 'describable',
          name: 'transformation protocols',
          aliases: ['protocols', 'procedures'],
          description: `Documentation describing how to induce artifact-related changes in normal materials. The process requires specific exposure patterns, precise timing, and—troublingly—proximity to a conscious human mind. The transformations only work when someone is watching. The artifact requires witnesses.`,
        },
      ],
    },

    '%PSYCHOLOGY_WING': {
      name: 'Corp Construction - Psychology Wing',
      description: `The wing dedicated to understanding the artifact's effects on the human mind. The atmosphere here is different—quieter, more oppressive. The walls are lined with sound-dampening material, and the lighting is softer, but the silence itself seems to have weight.

Interview rooms branch off the main corridor, each equipped with recording equipment and two-way mirrors. The interviews documented here aren't standard psychological evaluations. They're attempts to understand what happens when human consciousness makes contact with whatever intelligence—if it can be called that—resides in the artifact.

Some subjects developed precognition. Some heard voices. Some stopped being alone in their own heads. The success rate is low. The failure rate is concerning. The facility is very careful about who they expose to the artifact's full influence.`,
      x: 3,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%RESEARCH_LEVEL',
        south: '%INTERVIEW_ROOMS',
        north: '%SENSORY_CHAMBER',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'sound dampening',
          aliases: ['walls', 'sound', 'silence'],
          description: `The walls are covered in acoustic dampening material, creating an unnatural silence. The quiet isn't just absence of sound—it's presence of something else. In the stillness, you can almost hear the artifact thinking.`,
        },
        {
          prototype: 'describable',
          name: 'case files',
          aliases: ['files', 'records', 'cases'],
          description: `Files documenting the psychological effects of artifact exposure. The patterns are consistent: first, enhanced perception. Then, intrusive thoughts that aren't entirely your own. Then, knowledge of things you shouldn't know. Then, either breakthrough or breakdown. The odds are about fifty-fifty.`,
        },
      ],
    },

    '%INTERVIEW_ROOMS': {
      name: 'Corp Construction - Interview Rooms',
      description: `A row of interview rooms, each designed for extended observation of subjects experiencing artifact-related psychological effects. The rooms are comfortable in a clinical way—soft lighting, neutral colors, chairs designed for long sessions.

The two-way mirrors reveal the recording equipment behind: multiple cameras, audio capture, and instruments that measure brainwave patterns, skin conductivity, and things less easy to name. Everything a subject says, does, or thinks is captured and analyzed.

The transcripts in the observation booth tell stories of transformation. Subjects who learned to read minds. Subjects who saw the future. Subjects who made contact with something vast and patient that's been waiting beneath Seattle for longer than humans have existed.`,
      x: 3,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PSYCHOLOGY_WING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'observation booth',
          aliases: ['booth', 'observation'],
          description: `A booth behind the two-way mirrors, equipped with recording and analysis equipment. Monitors display biometric data for empty chairs. The last session recorded here was three days ago. The subject's file is marked "INTEGRATED - FIELD ACTIVE." Whatever happened to them, it wasn't a breakdown.`,
        },
        {
          prototype: 'describable',
          name: 'session transcripts',
          aliases: ['transcripts', 'recordings', 'sessions'],
          description: `Transcripts of interview sessions with artifact-affected subjects. One records a subject describing "the voice beneath the city, sleeping but dreaming, dreaming of a world it remembers and wants back." Another captures a subject accurately predicting events three days in the future. A third ends with the subject speaking a language that hasn't been used in ten thousand years.`,
        },
      ],
    },

    '%SENSORY_CHAMBER': {
      name: 'Corp Construction - Sensory Isolation Chamber',
      description: `A chamber designed for total sensory deprivation, used to facilitate contact with whatever consciousness resides in or around the artifact. The room is a perfect sphere, its walls lined with material that absorbs all light and sound. Suspended in the center is a flotation tank filled with body-temperature saline.

Subjects float in darkness, cut off from all external stimuli, their minds left alone with... whatever speaks in the silence. The chamber amplifies the artifact's influence. Some subjects make contact. Some subjects don't come back.

The walls are covered with messages left by previous subjects, written in the dark with fingers or blood or substances less identifiable. The messages are pleas, warnings, and revelations. Some are in languages that predate human writing.`,
      x: 3,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PSYCHOLOGY_WING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'flotation tank',
          aliases: ['tank', 'isolation tank'],
          description: `A large flotation tank, designed for extended sensory deprivation. The saline solution inside is maintained at exactly body temperature, eliminating the sense of touch. The darkness is absolute. The silence is total. In that void, the artifact's voice becomes clear. Too clear, for some subjects.`,
        },
        {
          prototype: 'describable',
          name: 'wall inscriptions',
          aliases: ['inscriptions', 'writing', 'messages'],
          description: `Messages cover the chamber walls, left by subjects during sessions. Some are in English: "IT REMEMBERS EVERYTHING." "THE FOUNDATION WAS LAID BEFORE HUMANS." "THEY'RE NOT SLEEPING. THEY'RE WAITING." Others are in languages no living human speaks, scratched into the material with desperate fingers.`,
        },
        {
          prototype: 'describable',
          name: 'monitoring equipment',
          aliases: ['monitors', 'equipment'],
          description: `Equipment monitors subjects during isolation sessions, tracking vital signs, brain activity, and less quantifiable phenomena. The readouts from successful contact sessions show patterns that shouldn't be possible—brainwaves synchronizing with something external, heart rates matching rhythms found only in the artifact's emanations.`,
        },
      ],
    },
  },
};
