import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Factory for creating human body object trees
 *
 * Creates a full body hierarchy:
 * - Torso (root)
 *   - Head
 *     - Scalp
 *     - Neck -> Throat
 *     - Face
 *       - Left/Right Eye
 *       - Left/Right Ear
 *       - Mouth -> Tongue
 *       - Nose
 *   - Left/Right Shoulder -> Arm -> Forearm -> Hand -> Fingers
 *   - Left/Right Thigh -> Knee -> Leg -> Foot
 *   - Groin (sex-specific parts)
 *   - Left/Right Chest, Stomach, Back
 *
 * All parts are real objects in MongoDB, linked by objrefs
 */
export class BodyFactory {
  constructor(private manager: ObjectManager) {}

  /**
   * Create a complete human body for an owner
   * @param ownerId - The player/agent ID who will own this body
   * @param sex - 'male', 'female', or 'neuter'
   * @param primaryHand - 'left' or 'right' (default: random)
   * @returns The torso object (root of the body tree)
   */
  async createHumanBody(
    ownerId: number,
    sex: 'male' | 'female' | 'neuter' = 'neuter',
    primaryHand: 'left' | 'right' = Math.random() > 0.5 ? 'right' : 'left'
  ): Promise<RuntimeObject> {
    // Get prototype IDs from aliases
    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};

    const bodyPartId = aliases.bodyPart;
    const handId = aliases.hand;
    const headId = aliases.head;
    const eyeId = aliases.eye;
    const earId = aliases.ear;
    const tongueId = aliases.tongue;
    const noseId = aliases.nose;
    const mouthId = aliases.mouth;

    if (!bodyPartId) {
      throw new Error('BodyPart prototype not found - run bootstrap first');
    }

    // Helper to create a body part instance
    const createPart = async (
      parentProto: number,
      name: string,
      options: {
        bones?: string[];
        coverable?: boolean;
        removable?: boolean;
        critical?: boolean;
        aliases?: string[];
      } = {}
    ): Promise<RuntimeObject> => {
      const part = await this.manager.create({
        parent: parentProto,
        properties: {
          name,
          description: `A ${name.toLowerCase()}`,
          owner: ownerId,
          parts: {},
          bones: options.bones || [],
          coverable: options.coverable ?? false,
          removable: options.removable ?? false,
          critical: options.critical ?? false,
          aliases: options.aliases || [],
        },
        methods: {},
      });
      return part;
    };

    // Create the body tree from bottom up, linking parts

    // === FINGERS ===
    const createFingers = async (side: string, handPart: RuntimeObject): Promise<void> => {
      const fingers = ['thumb', 'index finger', 'middle finger', 'ring finger', 'pinky'];
      for (const finger of fingers) {
        const fingerPart = await createPart(bodyPartId, `${side} ${finger}`, {
          bones: ['metacarpals', 'phalanges'],
          coverable: true,
          removable: true,
        });
        const fingerKey = finger.replace(' ', '');
        await handPart.call('addPart',fingerKey, fingerPart.id);
      }
    };

    // === HANDS ===
    const createHand = async (side: string): Promise<RuntimeObject> => {
      const hand = await createPart(handId || bodyPartId, `${side} hand`, {
        bones: ['wrist', 'metacarpals'],
        coverable: true,
        removable: true,
        aliases: [side === primaryHand ? 'primary hand' : 'secondary hand'],
      });
      await createFingers(side, hand);
      return hand;
    };

    // === ARM CHAIN ===
    const createArm = async (side: string): Promise<RuntimeObject> => {
      const hand = await createHand(side);

      const forearm = await createPart(bodyPartId, `${side} forearm`, {
        bones: ['radius', 'ulna'],
        coverable: true,
        removable: true,
      });
      await forearm.call('addPart','hand', hand.id);

      const arm = await createPart(bodyPartId, `${side} arm`, {
        bones: ['humerus'],
        coverable: true,
        removable: true,
      });
      await arm.call('addPart','forearm', forearm.id);

      const shoulder = await createPart(bodyPartId, `${side} shoulder`, {
        bones: ['clavicle', 'scapula'],
        coverable: true,
        removable: false,
      });
      await shoulder.call('addPart','arm', arm.id);

      return shoulder;
    };

    // === LEG CHAIN ===
    const createLeg = async (side: string): Promise<RuntimeObject> => {
      const foot = await createPart(bodyPartId, `${side} foot`, {
        bones: ['metatarsus', 'phalanges'],
        coverable: true,
        removable: true,
      });

      const leg = await createPart(bodyPartId, `${side} leg`, {
        bones: ['tibia', 'fibula'],
        coverable: true,
        removable: true,
      });
      await leg.call('addPart','foot', foot.id);

      const knee = await createPart(bodyPartId, `${side} knee`, {
        bones: ['patella'],
        coverable: true,
        removable: true,
      });
      await knee.call('addPart','leg', leg.id);

      const thigh = await createPart(bodyPartId, `${side} thigh`, {
        bones: ['femur'],
        coverable: true,
        removable: true,
      });
      await thigh.call('addPart','knee', knee.id);

      return thigh;
    };

    // === HEAD ===
    const createHead = async (): Promise<RuntimeObject> => {
      // Sensory organs
      const leftEye = await createPart(eyeId || bodyPartId, 'left eye', {
        coverable: true,
        removable: true,
      });
      const rightEye = await createPart(eyeId || bodyPartId, 'right eye', {
        coverable: true,
        removable: true,
      });
      const leftEar = await createPart(earId || bodyPartId, 'left ear', {
        coverable: true,
        removable: true,
      });
      const rightEar = await createPart(earId || bodyPartId, 'right ear', {
        coverable: true,
        removable: true,
      });
      const nose = await createPart(noseId || bodyPartId, 'nose', {
        coverable: true,
        removable: true,
      });
      const tongue = await createPart(tongueId || bodyPartId, 'tongue', {
        removable: true,
      });

      // Mouth
      const mouth = await createPart(mouthId || bodyPartId, 'mouth', {
        coverable: true,
      });
      await mouth.call('addPart','tongue', tongue.id);

      // Face
      const face = await createPart(bodyPartId, 'face', {
        coverable: true,
      });
      await face.call('addPart','leftEye', leftEye.id);
      await face.call('addPart','rightEye', rightEye.id);
      await face.call('addPart','leftEar', leftEar.id);
      await face.call('addPart','rightEar', rightEar.id);
      await face.call('addPart','nose', nose.id);
      await face.call('addPart','mouth', mouth.id);

      // Throat/Neck
      const throat = await createPart(bodyPartId, 'throat', {
        bones: ['larynx'],
        coverable: true,
        critical: true,
      });
      const neck = await createPart(bodyPartId, 'neck', {
        bones: ['cervical vertebrae'],
        coverable: true,
        critical: true,
      });
      await neck.call('addPart','throat', throat.id);

      // Scalp (with hair)
      const scalp = await createPart(bodyPartId, 'scalp', {
        coverable: true,
      });
      // Set hair properties separately (not passed to createPart)
      scalp.set('hairColor', 'brown');
      scalp.set('hairStyle', 'medium');

      // Head
      const head = await createPart(headId || bodyPartId, 'head', {
        bones: ['skull', 'jaw'],
        coverable: true,
        removable: true,
        critical: true,
      });
      await head.call('addPart','scalp', scalp.id);
      await head.call('addPart','neck', neck.id);
      await head.call('addPart','face', face.id);

      return head;
    };

    // === GROIN ===
    const createGroin = async (): Promise<RuntimeObject> => {
      const groin = await createPart(bodyPartId, 'groin', {
        bones: ['pelvis'],
        coverable: true,
      });

      if (sex === 'male') {
        const penis = await createPart(bodyPartId, 'penis', {
          removable: true,
        });
        const leftTesticle = await createPart(bodyPartId, 'left testicle', {
          removable: true,
        });
        const rightTesticle = await createPart(bodyPartId, 'right testicle', {
          removable: true,
        });
        await groin.call('addPart','penis', penis.id);
        await groin.call('addPart','leftTesticle', leftTesticle.id);
        await groin.call('addPart','rightTesticle', rightTesticle.id);
      } else if (sex === 'female') {
        const vagina = await createPart(bodyPartId, 'vagina', {});
        await groin.call('addPart','vagina', vagina.id);
      }
      // neuter = no additional parts

      return groin;
    };

    // === TORSO (ROOT) ===
    const head = await createHead();
    const rightShoulder = await createArm('right');
    const leftShoulder = await createArm('left');
    const rightThigh = await createLeg('right');
    const leftThigh = await createLeg('left');
    const groin = await createGroin();

    const leftChest = await createPart(bodyPartId, 'left chest', {
      bones: ['ribs'],
      coverable: true,
    });
    const rightChest = await createPart(bodyPartId, 'right chest', {
      bones: ['ribs'],
      coverable: true,
    });
    const stomach = await createPart(bodyPartId, 'stomach', {
      coverable: true,
    });
    const back = await createPart(bodyPartId, 'back', {
      bones: ['spine'],
      coverable: true,
      critical: true,
    });

    // Create torso and link everything
    const torso = await createPart(bodyPartId, 'torso', {
      bones: ['ribs', 'spine'],
      coverable: true,
      critical: true,
    });

    await torso.call('addPart','head', head.id);
    await torso.call('addPart','rightShoulder', rightShoulder.id);
    await torso.call('addPart','leftShoulder', leftShoulder.id);
    await torso.call('addPart','rightThigh', rightThigh.id);
    await torso.call('addPart','leftThigh', leftThigh.id);
    await torso.call('addPart','groin', groin.id);
    await torso.call('addPart','leftChest', leftChest.id);
    await torso.call('addPart','rightChest', rightChest.id);
    await torso.call('addPart','stomach', stomach.id);
    await torso.call('addPart','back', back.id);

    // Store primary hand preference on torso
    torso.set('primaryHand', primaryHand);

    return torso;
  }
}
