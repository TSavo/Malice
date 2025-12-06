import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Head prototype
 * Contains sensory organs and brain
 */
export class HeadBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Head',
        description: 'A head',
        bones: ['skull', 'jaw', 'teeth'],
        coverable: true,
        removable: true,
        critical: true, // Death if destroyed
      },
      methods: {},
    });

    // Check if can see (needs at least one working eye)
    obj.setMethod('canSee', `
      const face = await self.getPart('face');
      if (!face) return false;

      const leftEye = await face.getPart('leftEye');
      const rightEye = await face.getPart('rightEye');

      const leftCanSee = leftEye && await leftEye.canSee();
      const rightCanSee = rightEye && await rightEye.canSee();

      return leftCanSee || rightCanSee;
    `);

    // Check if can hear (needs at least one working ear)
    obj.setMethod('canHear', `
      const face = await self.getPart('face');
      if (!face) return false;

      const leftEar = await face.getPart('leftEar');
      const rightEar = await face.getPart('rightEar');

      const leftCanHear = leftEar && await leftEar.canHear();
      const rightCanHear = rightEar && await rightEar.canHear();

      return leftCanHear || rightCanHear;
    `);

    // Check if can speak (needs tongue and empty mouth)
    obj.setMethod('canSpeak', `
      const face = await self.getPart('face');
      if (!face) return false;

      const mouth = await face.getPart('mouth');
      if (!mouth) return false;

      const tongue = await mouth.getPart('tongue');
      if (!tongue || !tongue.canSpeak) return false;

      // Can't speak with mouth full
      if (!(await mouth.isEmpty())) return false;

      return await tongue.canSpeak();
    `);

    // Check if can smell (needs working nose)
    obj.setMethod('canSmell', `
      const face = await self.getPart('face');
      if (!face) return false;

      const nose = await face.getPart('nose');
      if (!nose || !nose.canSmell) return false;

      return await nose.canSmell();
    `);

    // Check if can taste (needs tongue)
    obj.setMethod('canTaste', `
      const face = await self.getPart('face');
      if (!face) return false;

      const mouth = await face.getPart('mouth');
      if (!mouth) return false;

      const tongue = await mouth.getPart('tongue');
      if (!tongue || !tongue.canTaste) return false;

      return await tongue.canTaste();
    `);

    // Check if can think (needs brain - we assume brain is intact if head exists)
    obj.setMethod('canThink', `
      // Can think as long as head isn't destroyed
      const condition = self.condition || {};
      return !condition.destroyed && !condition.braindead;
    `);

    return obj;
  }
}
