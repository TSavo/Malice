import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds BodyFactory object (dynamic ID)
 * Creates human body object trees with proper part hierarchy
 *
 * Usage from MOO code:
 *   const bodyFactory = await $.bodyFactory;
 *   const body = await bodyFactory.createHumanBody(playerId, 'female');
 */
export class BodyFactoryBuilder implements Builder {
  static provides = ['bodyFactory'];
  static depends: string[] = [];

  private bodyFactory: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.bodyFactory) {
      this.bodyFactory = await this.manager.load(aliases.bodyFactory);
      if (this.bodyFactory) return; // Already exists and not forcing rebuild
    }

    if (!this.bodyFactory) {
      // Create new BodyFactory only if it doesn't exist
      const root = await this.manager.load('root');
      this.bodyFactory = await this.manager.create({
        parent: root!,
        properties: {
          name: 'BodyFactory',
          description: 'Factory for creating human body object trees',
        },
        methods: {},
      });
    }

    // Setup methods (runs on both create and force rebuild)
    // Helper method to create a single body part
    // Uses legacy recycler.create(parent, properties) format
    this.bodyFactory.setMethod(
      'createPart',
      `
      const parentProto = args[0];
      const name = args[1];
      const owner = args[2];
      const options = args[3] || {};

      const part = await $.recycler.create(parentProto, {
        name: name,
        description: 'A ' + name.toLowerCase(),
        owner: owner,
        parts: {},
        bones: options.bones || [],
        coverable: options.coverable ?? false,
        removable: options.removable ?? false,
        critical: options.critical ?? false,
        aliases: options.aliases || [],
        // Stats - set if specified in options
        strength: options.strength,
        dexterity: options.dexterity,
        perception: options.perception,
        iq: options.iq,
        // Calories - for energy/endurance system
        calories: options.calories,
        maxCalories: options.maxCalories,
      });
      return part;
    `,
    );

    // Create fingers for a hand
    this.bodyFactory.setMethod(
      'createFingers',
      `
      const bodyPartId = args[0];
      const side = args[1];
      const handPart = args[2];
      const owner = args[3];

      const fingers = ['thumb', 'index finger', 'middle finger', 'ring finger', 'pinky'];
      for (const finger of fingers) {
        const fingerPart = await self.createPart(bodyPartId, side + ' ' + finger, owner, {
          bones: ['metacarpals', 'phalanges'],
          coverable: true,
          removable: true,
        });
        const fingerKey = finger.replace(' ', '');
        await handPart.addPart(fingerKey, fingerPart);
      }
    `,
    );

    // Create a hand with fingers
    this.bodyFactory.setMethod(
      'createHand',
      `
      const handProtoId = args[0];
      const bodyPartId = args[1];
      const side = args[2];
      const owner = args[3];
      const primaryHand = args[4];

      const hand = await self.createPart(handProtoId || bodyPartId, side + ' hand', owner, {
        bones: ['wrist', 'metacarpals'],
        coverable: true,
        removable: true,
        aliases: [side === primaryHand ? 'primary hand' : 'secondary hand'],
        strength: 1,
        dexterity: 1,
        calories: 50,
        maxCalories: 75,
      });
      await self.createFingers(bodyPartId, side, hand, owner);
      return hand;
    `,
    );

    // Create arm chain (shoulder -> arm -> forearm -> hand)
    // Uses pre-injected $bodyPart
    this.bodyFactory.setMethod(
      'createArm',
      `
      const side = args[0];
      const owner = args[1];
      const primaryHand = args[2];

      const hand = await self.createHand($bodyPart, $bodyPart, side, owner, primaryHand);

      const forearm = await self.createPart($bodyPart, side + ' forearm', owner, {
        bones: ['radius', 'ulna'],
        coverable: true,
        removable: true,
        calories: 75,
        maxCalories: 100,
      });
      await forearm.addPart('hand', hand);

      const arm = await self.createPart($bodyPart, side + ' arm', owner, {
        bones: ['humerus'],
        coverable: true,
        removable: true,
        strength: 1,
        calories: 100,
        maxCalories: 150,
      });
      await arm.addPart('forearm', forearm);

      const shoulder = await self.createPart($bodyPart, side + ' shoulder', owner, {
        bones: ['clavicle', 'scapula'],
        coverable: true,
        removable: false,
        calories: 150,
        maxCalories: 200,
      });
      await shoulder.addPart('arm', arm);

      return shoulder;
    `,
    );

    // Create leg chain (thigh -> knee -> leg -> foot)
    // Uses pre-injected $bodyPart
    this.bodyFactory.setMethod(
      'createLeg',
      `
      const side = args[0];
      const owner = args[1];

      const foot = await self.createPart($bodyPart, side + ' foot', owner, {
        bones: ['metatarsus', 'phalanges'],
        coverable: true,
        removable: true,
        dexterity: 1,
        calories: 50,
        maxCalories: 75,
      });

      const leg = await self.createPart($bodyPart, side + ' leg', owner, {
        bones: ['tibia', 'fibula'],
        coverable: true,
        removable: true,
        strength: 1,
        dexterity: 1,
        calories: 200,
        maxCalories: 300,
      });
      await leg.addPart('foot', foot);

      const knee = await self.createPart($bodyPart, side + ' knee', owner, {
        bones: ['patella'],
        coverable: true,
        removable: true,
        calories: 100,
        maxCalories: 150,
      });
      await knee.addPart('leg', leg);

      const thigh = await self.createPart($bodyPart, side + ' thigh', owner, {
        bones: ['femur'],
        coverable: true,
        removable: true,
        calories: 250,
        maxCalories: 350,
      });
      await thigh.addPart('knee', knee);

      return thigh;
    `,
    );

    // Create head with face, sensory organs, etc.
    // Uses pre-injected body part prototype aliases: $eye, $ear, $nose, $mouth, etc.
    this.bodyFactory.setMethod(
      'createHead',
      `
      const owner = args[0];

      // Sensory organs - use specialized prototypes for proper method inheritance
      const leftEye = await self.createPart($eye, 'left eye', owner, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const rightEye = await self.createPart($eye, 'right eye', owner, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const leftEar = await self.createPart($ear, 'left ear', owner, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const rightEar = await self.createPart($ear, 'right ear', owner, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const nose = await self.createPart($nose, 'nose', owner, {
        coverable: true,
        removable: true,
      });
      const tongue = await self.createPart($tongue, 'tongue', owner, {
        removable: true,
      });

      // Mouth - use $mouth for canTaste delegation
      const mouth = await self.createPart($mouth, 'mouth', owner, {
        coverable: true,
      });
      await mouth.addPart('tongue', tongue);

      // Face
      const face = await self.createPart($bodyPart, 'face', owner, {
        coverable: true,
      });
      await face.addPart('leftEye', leftEye);
      await face.addPart('rightEye', rightEye);
      await face.addPart('leftEar', leftEar);
      await face.addPart('rightEar', rightEar);
      await face.addPart('nose', nose);
      await face.addPart('mouth', mouth);

      // Throat/Neck
      const throat = await self.createPart($bodyPart, 'throat', owner, {
        bones: ['larynx'],
        coverable: true,
        critical: true,
      });
      const neck = await self.createPart($bodyPart, 'neck', owner, {
        bones: ['cervical vertebrae'],
        coverable: true,
        critical: true,
      });
      await neck.addPart('throat', throat);

      // Scalp (with hair) - hair details set later via appearance
      const scalp = await self.createPart($bodyPart, 'scalp', owner, {
        coverable: true,
      });

      // Head - use $head prototype for canSmell/canTaste delegation methods
      const head = await self.createPart($head, 'head', owner, {
        bones: ['skull', 'jaw'],
        coverable: true,
        removable: true,
        critical: true,
        iq: 1,
      });
      await head.addPart('scalp', scalp);
      await head.addPart('neck', neck);
      await head.addPart('face', face);

      return head;
    `,
    );

    // Create groin with sex-specific parts
    // Uses pre-injected $bodyPart
    this.bodyFactory.setMethod(
      'createGroin',
      `
      const owner = args[0];
      const sex = args[1];

      const groin = await self.createPart($bodyPart, 'groin', owner, {
        bones: ['pelvis'],
        coverable: true,
      });

      if (sex === 'male') {
        const penis = await self.createPart($bodyPart, 'penis', owner, {
          removable: true,
        });
        const leftTesticle = await self.createPart($bodyPart, 'left testicle', owner, {
          removable: true,
        });
        const rightTesticle = await self.createPart($bodyPart, 'right testicle', owner, {
          removable: true,
        });
        await groin.addPart('penis', penis);
        await groin.addPart('leftTesticle', leftTesticle);
        await groin.addPart('rightTesticle', rightTesticle);
      } else if (sex === 'female') {
        const vagina = await self.createPart($bodyPart, 'vagina', owner, {});
        await groin.addPart('vagina', vagina);
      }
      // neuter/non-binary = no additional parts

      return groin;
    `,
    );

    // Main method: create a complete human body
    this.bodyFactory.setMethod(
      'createHumanBody',
      `
      const owner = args[0];
      const sex = args[1] || 'non-binary';
      const appearance = args[2] || {};
      const primaryHand = args[3] || (Math.random() > 0.5 ? 'right' : 'left');

      const skinTone = appearance.skinTone || 'medium';
      const eyeColor = appearance.eyeColor || 'brown';
      const leftEyeColor = appearance.leftEyeColor || eyeColor;
      const rightEyeColor = appearance.rightEyeColor || eyeColor;
      const eyeStyle = appearance.eyeStyle || 'almond';
      const hairColor = appearance.hairColor || 'brown';
      const hairStyle = appearance.hairStyle || 'straight';
      const hairTexture = appearance.hairTexture || 'medium';
      const buildType = appearance.buildType || 'average';
      const faceShape = appearance.faceShape || 'oval';
      const noseShape = appearance.noseShape || 'straight';
      const lipShape = appearance.lipShape || 'medium';
      const freckles = appearance.freckles || 'none';
      const distinguishingMark = appearance.distinguishingMark || 'none';
      const facialHair = appearance.facialHair || 'none';

      // Verify bodyPart prototype exists (pre-injected as $bodyPart)
      if (!$bodyPart) {
        throw new Error('BodyPart prototype not found - run bootstrap first');
      }

      // Create all parts using pre-injected $alias variables
      const head = await self.createHead(owner);
      const rightShoulder = await self.createArm('right', owner, primaryHand);
      const leftShoulder = await self.createArm('left', owner, primaryHand);
      const rightThigh = await self.createLeg('right', owner);
      const leftThigh = await self.createLeg('left', owner);
      const groin = await self.createGroin(owner, sex);

      const leftChest = await self.createPart($bodyPart, 'left chest', owner, {
        bones: ['ribs'],
        coverable: true,
      });
      const rightChest = await self.createPart($bodyPart, 'right chest', owner, {
        bones: ['ribs'],
        coverable: true,
      });
      const abdomen = await self.createPart($bodyPart, 'abdomen', owner, {
        coverable: true,
      });

      // Internal digestive stomach
      const digestiveStomach = await self.createPart($bodyPart, 'digestive stomach', owner, {
        internal: true,
        maxContents: 10,
        maxVolume: 1000,
        digestionRate: 50,
      });
      const back = await self.createPart($bodyPart, 'back', owner, {
        bones: ['spine'],
        coverable: true,
        critical: true,
      });

      // Create torso and link everything
      const torso = await self.createPart($bodyPart, 'torso', owner, {
        bones: ['ribs', 'spine'],
        coverable: true,
        critical: true,
        strength: 1,
        // Main calorie store (where digestion happens)
        calories: 2000,
        maxCalories: 3000,
        // Hydration - depletes faster than calories (3 days vs 3 weeks)
        // 100% hydration depletes in ~4320 ticks (72 hours) without water
        hydration: 100,
        maxHydration: 100,
      });

      await torso.addPart('head', head);
      await torso.addPart('rightShoulder', rightShoulder);
      await torso.addPart('leftShoulder', leftShoulder);
      await torso.addPart('rightThigh', rightThigh);
      await torso.addPart('leftThigh', leftThigh);
      await torso.addPart('groin', groin);
      await torso.addPart('leftChest', leftChest);
      await torso.addPart('rightChest', rightChest);
      await torso.addPart('abdomen', abdomen);
      await torso.addPart('digestiveStomach', digestiveStomach);
      await torso.addPart('back', back);

      // Store primary hand preference on torso
      torso.primaryHand = primaryHand;

      // Store species on torso for autopsy identification
      torso.species = 'human';

      // Apply appearance to body parts
      // Skin tone to all visible parts (not eyes)
      const applyToAllParts = async (part, prop, value, excludeNames) => {
        if (!part) return;
        const partName = part.name || '';
        if (!excludeNames.some(n => partName.toLowerCase().includes(n))) {
          part[prop] = value;
        }
        const parts = part.parts || {};
        for (const key of Object.keys(parts)) {
          const childPart = await $load(parts[key]);
          await applyToAllParts(childPart, prop, value, excludeNames);
        }
      };

      await applyToAllParts(torso, 'skinTone', skinTone, ['eye']);

      // Hair on scalp
      const face = await head.getPart('face');
      const scalp = await head.getPart('scalp');
      if (scalp) {
        scalp.hairColor = hairColor;
        scalp.hairStyle = hairStyle;
        scalp.hairTexture = hairTexture;
      }

      // Eyes (supports heterochromia - different colors per eye)
      if (face) {
        const leftEye = await face.getPart('leftEye');
        const rightEye = await face.getPart('rightEye');
        if (leftEye) {
          leftEye.color = leftEyeColor;
          leftEye.shape = eyeStyle;
        }
        if (rightEye) {
          rightEye.color = rightEyeColor;
          rightEye.shape = eyeStyle;
        }

        // Face shape and features
        face.faceShape = faceShape;
        face.freckles = freckles;
        face.distinguishingMark = distinguishingMark;
        face.facialHair = facialHair;

        // Nose
        const nose = await face.getPart('nose');
        if (nose) {
          nose.shape = noseShape;
        }

        // Mouth/lips
        const mouth = await face.getPart('mouth');
        if (mouth) {
          mouth.lipShape = lipShape;
        }
      }

      // Build type on torso
      torso.buildType = buildType;

      // Attach body to owner so getBody() works (if owner provided)
      if (owner) {
        owner.body = torso;
      }

      return torso;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.bodyFactory) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'bodyFactory', this.bodyFactory.id);
    console.log(`✅ Registered bodyFactory alias -> #${this.bodyFactory.id}`);
  }
}

// Self-register
registerBuilder(BodyFactoryBuilder);
