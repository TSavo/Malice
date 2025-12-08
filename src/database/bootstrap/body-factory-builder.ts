import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds BodyFactory object (dynamic ID)
 * Creates human body object trees with proper part hierarchy
 *
 * Usage from MOO code:
 *   const bodyFactory = await $.bodyFactory;
 *   const body = await bodyFactory.createHumanBody(playerId, 'female');
 */
export class BodyFactoryBuilder {
  private bodyFactory: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.bodyFactory) {
      this.bodyFactory = await this.manager.load(aliases.bodyFactory);
      if (this.bodyFactory) return; // Already exists
    }

    // Create new BodyFactory
    this.bodyFactory = await this.manager.create({
      parent: 1,
      properties: {
        name: 'BodyFactory',
        description: 'Factory for creating human body object trees',
      },
      methods: {},
    });

    // Helper method to create a single body part
    this.bodyFactory.setMethod('createPart', `
      const parentProto = args[0];
      const name = args[1];
      const ownerId = args[2];
      const options = args[3] || {};

      const part = await $.create({
        parent: parentProto,
        properties: {
          name: name,
          description: 'A ' + name.toLowerCase(),
          owner: ownerId,
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
        },
      });
      return part;
    `);

    // Create fingers for a hand
    this.bodyFactory.setMethod('createFingers', `
      const bodyPartId = args[0];
      const side = args[1];
      const handPart = args[2];
      const ownerId = args[3];

      const fingers = ['thumb', 'index finger', 'middle finger', 'ring finger', 'pinky'];
      for (const finger of fingers) {
        const fingerPart = await self.createPart(bodyPartId, side + ' ' + finger, ownerId, {
          bones: ['metacarpals', 'phalanges'],
          coverable: true,
          removable: true,
        });
        const fingerKey = finger.replace(' ', '');
        await handPart.addPart(fingerKey, fingerPart.id);
      }
    `);

    // Create a hand with fingers
    this.bodyFactory.setMethod('createHand', `
      const handProtoId = args[0];
      const bodyPartId = args[1];
      const side = args[2];
      const ownerId = args[3];
      const primaryHand = args[4];

      const hand = await self.createPart(handProtoId || bodyPartId, side + ' hand', ownerId, {
        bones: ['wrist', 'metacarpals'],
        coverable: true,
        removable: true,
        aliases: [side === primaryHand ? 'primary hand' : 'secondary hand'],
        strength: 1,
        dexterity: 1,
        calories: 50,
        maxCalories: 75,
      });
      await self.createFingers(bodyPartId, side, hand, ownerId);
      return hand;
    `);

    // Create arm chain (shoulder -> arm -> forearm -> hand)
    this.bodyFactory.setMethod('createArm', `
      const aliases = args[0];
      const side = args[1];
      const ownerId = args[2];
      const primaryHand = args[3];

      const bodyPartId = aliases.bodyPart;
      const handId = aliases.hand;

      const hand = await self.createHand(handId, bodyPartId, side, ownerId, primaryHand);

      const forearm = await self.createPart(bodyPartId, side + ' forearm', ownerId, {
        bones: ['radius', 'ulna'],
        coverable: true,
        removable: true,
      });
      await forearm.addPart('hand', hand.id);

      const arm = await self.createPart(bodyPartId, side + ' arm', ownerId, {
        bones: ['humerus'],
        coverable: true,
        removable: true,
        strength: 1,
        calories: 100,
        maxCalories: 150,
      });
      await arm.addPart('forearm', forearm.id);

      const shoulder = await self.createPart(bodyPartId, side + ' shoulder', ownerId, {
        bones: ['clavicle', 'scapula'],
        coverable: true,
        removable: false,
      });
      await shoulder.addPart('arm', arm.id);

      return shoulder;
    `);

    // Create leg chain (thigh -> knee -> leg -> foot)
    this.bodyFactory.setMethod('createLeg', `
      const aliases = args[0];
      const side = args[1];
      const ownerId = args[2];

      const bodyPartId = aliases.bodyPart;

      const foot = await self.createPart(bodyPartId, side + ' foot', ownerId, {
        bones: ['metatarsus', 'phalanges'],
        coverable: true,
        removable: true,
        dexterity: 1,
      });

      const leg = await self.createPart(bodyPartId, side + ' leg', ownerId, {
        bones: ['tibia', 'fibula'],
        coverable: true,
        removable: true,
        strength: 1,
        dexterity: 1,
        calories: 200,
        maxCalories: 300,
      });
      await leg.addPart('foot', foot.id);

      const knee = await self.createPart(bodyPartId, side + ' knee', ownerId, {
        bones: ['patella'],
        coverable: true,
        removable: true,
      });
      await knee.addPart('leg', leg.id);

      const thigh = await self.createPart(bodyPartId, side + ' thigh', ownerId, {
        bones: ['femur'],
        coverable: true,
        removable: true,
      });
      await thigh.addPart('knee', knee.id);

      return thigh;
    `);

    // Create head with face, sensory organs, etc.
    this.bodyFactory.setMethod('createHead', `
      const aliases = args[0];
      const ownerId = args[1];

      const bodyPartId = aliases.bodyPart;
      const headId = aliases.head;
      const eyeId = aliases.eye;
      const earId = aliases.ear;
      const mouthId = aliases.mouth;
      const noseId = aliases.nose;

      // Sensory organs
      const leftEye = await self.createPart(eyeId || bodyPartId, 'left eye', ownerId, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const rightEye = await self.createPart(eyeId || bodyPartId, 'right eye', ownerId, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const leftEar = await self.createPart(earId || bodyPartId, 'left ear', ownerId, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const rightEar = await self.createPart(earId || bodyPartId, 'right ear', ownerId, {
        coverable: true,
        removable: true,
        perception: 1,
      });
      const nose = await self.createPart(noseId || bodyPartId, 'nose', ownerId, {
        coverable: true,
        removable: true,
      });
      const tongue = await self.createPart(bodyPartId, 'tongue', ownerId, {
        removable: true,
      });

      // Mouth
      const mouth = await self.createPart(mouthId || bodyPartId, 'mouth', ownerId, {
        coverable: true,
      });
      await mouth.addPart('tongue', tongue.id);

      // Face
      const face = await self.createPart(bodyPartId, 'face', ownerId, {
        coverable: true,
      });
      await face.addPart('leftEye', leftEye.id);
      await face.addPart('rightEye', rightEye.id);
      await face.addPart('leftEar', leftEar.id);
      await face.addPart('rightEar', rightEar.id);
      await face.addPart('nose', nose.id);
      await face.addPart('mouth', mouth.id);

      // Throat/Neck
      const throat = await self.createPart(bodyPartId, 'throat', ownerId, {
        bones: ['larynx'],
        coverable: true,
        critical: true,
      });
      const neck = await self.createPart(bodyPartId, 'neck', ownerId, {
        bones: ['cervical vertebrae'],
        coverable: true,
        critical: true,
      });
      await neck.addPart('throat', throat.id);

      // Scalp (with hair) - hair details set later via appearance
      const scalp = await self.createPart(bodyPartId, 'scalp', ownerId, {
        coverable: true,
      });

      // Head
      const head = await self.createPart(headId || bodyPartId, 'head', ownerId, {
        bones: ['skull', 'jaw'],
        coverable: true,
        removable: true,
        critical: true,
        iq: 1,
      });
      await head.addPart('scalp', scalp.id);
      await head.addPart('neck', neck.id);
      await head.addPart('face', face.id);

      return head;
    `);

    // Create groin with sex-specific parts
    this.bodyFactory.setMethod('createGroin', `
      const aliases = args[0];
      const ownerId = args[1];
      const sex = args[2];

      const bodyPartId = aliases.bodyPart;

      const groin = await self.createPart(bodyPartId, 'groin', ownerId, {
        bones: ['pelvis'],
        coverable: true,
      });

      if (sex === 'male') {
        const penis = await self.createPart(bodyPartId, 'penis', ownerId, {
          removable: true,
        });
        const leftTesticle = await self.createPart(bodyPartId, 'left testicle', ownerId, {
          removable: true,
        });
        const rightTesticle = await self.createPart(bodyPartId, 'right testicle', ownerId, {
          removable: true,
        });
        await groin.addPart('penis', penis.id);
        await groin.addPart('leftTesticle', leftTesticle.id);
        await groin.addPart('rightTesticle', rightTesticle.id);
      } else if (sex === 'female') {
        const vagina = await self.createPart(bodyPartId, 'vagina', ownerId, {});
        await groin.addPart('vagina', vagina.id);
      }
      // neuter/non-binary = no additional parts

      return groin;
    `);

    // Main method: create a complete human body
    this.bodyFactory.setMethod('createHumanBody', `
      const ownerId = args[0];
      const sex = args[1] || 'non-binary';
      const appearance = args[2] || {};
      const primaryHand = args[3] || (Math.random() > 0.5 ? 'right' : 'left');

      const skinTone = appearance.skinTone || 'medium';
      const eyeColor = appearance.eyeColor || 'brown';
      const eyeStyle = appearance.eyeStyle || 'almond';
      const hairColor = appearance.hairColor || 'brown';
      const hairStyle = appearance.hairStyle || 'straight';

      // Get prototype IDs from aliases
      const objectManager = await $.load(0);
      const aliases = objectManager.get('aliases') || {};

      const bodyPartId = aliases.bodyPart;
      if (!bodyPartId) {
        throw new Error('BodyPart prototype not found - run bootstrap first');
      }

      // Create all parts
      const head = await self.createHead(aliases, ownerId);
      const rightShoulder = await self.createArm(aliases, 'right', ownerId, primaryHand);
      const leftShoulder = await self.createArm(aliases, 'left', ownerId, primaryHand);
      const rightThigh = await self.createLeg(aliases, 'right', ownerId);
      const leftThigh = await self.createLeg(aliases, 'left', ownerId);
      const groin = await self.createGroin(aliases, ownerId, sex);

      const leftChest = await self.createPart(bodyPartId, 'left chest', ownerId, {
        bones: ['ribs'],
        coverable: true,
      });
      const rightChest = await self.createPart(bodyPartId, 'right chest', ownerId, {
        bones: ['ribs'],
        coverable: true,
      });
      const abdomen = await self.createPart(bodyPartId, 'abdomen', ownerId, {
        coverable: true,
      });

      // Internal digestive stomach (using Stomach prototype if available)
      const stomachProtoId = aliases.stomach;
      const digestiveStomach = await self.createPart(stomachProtoId || bodyPartId, 'digestive stomach', ownerId, {
        internal: true,
        maxContents: 10,
        maxVolume: 1000,
        digestionRate: 50,
      });
      const back = await self.createPart(bodyPartId, 'back', ownerId, {
        bones: ['spine'],
        coverable: true,
        critical: true,
      });

      // Create torso and link everything
      const torso = await self.createPart(bodyPartId, 'torso', ownerId, {
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

      await torso.addPart('head', head.id);
      await torso.addPart('rightShoulder', rightShoulder.id);
      await torso.addPart('leftShoulder', leftShoulder.id);
      await torso.addPart('rightThigh', rightThigh.id);
      await torso.addPart('leftThigh', leftThigh.id);
      await torso.addPart('groin', groin.id);
      await torso.addPart('leftChest', leftChest.id);
      await torso.addPart('rightChest', rightChest.id);
      await torso.addPart('abdomen', abdomen.id);
      await torso.addPart('digestiveStomach', digestiveStomach.id);
      await torso.addPart('back', back.id);

      // Store primary hand preference on torso
      torso.set('primaryHand', primaryHand);

      // Store species on torso for autopsy identification
      torso.set('species', 'human');

      // Apply appearance to body parts
      // Skin tone to all visible parts (not eyes)
      const applyToAllParts = async (part, prop, value, excludeNames) => {
        if (!part) return;
        const partName = part.name || '';
        if (!excludeNames.some(n => partName.toLowerCase().includes(n))) {
          part.set(prop, value);
        }
        const parts = part.parts || {};
        for (const key of Object.keys(parts)) {
          const childPart = await $.load(parts[key]);
          await applyToAllParts(childPart, prop, value, excludeNames);
        }
      };

      await applyToAllParts(torso, 'skinTone', skinTone, ['eye']);

      // Hair on scalp
      const face = await head.getPart('face');
      const scalp = await head.getPart('scalp');
      if (scalp) {
        scalp.set('hairColor', hairColor);
        scalp.set('hairStyle', hairStyle);
      }

      // Eyes
      if (face) {
        const leftEye = await face.getPart('leftEye');
        const rightEye = await face.getPart('rightEye');
        if (leftEye) {
          leftEye.set('color', eyeColor);
          leftEye.set('shape', eyeStyle);
        }
        if (rightEye) {
          rightEye.set('color', eyeColor);
          rightEye.set('shape', eyeStyle);
        }
      }

      return torso;
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.bodyFactory) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.bodyFactory = this.bodyFactory.id;
    objectManager.set('aliases', aliases);

    console.log(`✅ Registered bodyFactory alias -> #${this.bodyFactory.id}`);
  }
}
