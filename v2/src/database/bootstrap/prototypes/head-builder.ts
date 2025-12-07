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

    // Aggregate vision from both eyes
    // Returns { max, percent } - combined capacity and current function
    obj.setMethod('canSee', `
      const face = await self.getPart('face');
      if (!face) return { max: 0, percent: 0 };

      const leftEye = await face.getPart('leftEye');
      const rightEye = await face.getPart('rightEye');

      // Get each eye's stats
      const left = leftEye ? await leftEye.canSee() : { max: 0, percent: 0 };
      const right = rightEye ? await rightEye.canSee() : { max: 0, percent: 0 };

      // Combine max: sum of both, but with diminishing returns for second eye
      // First eye = 100%, second eye adds 50% of its max (depth perception, peripheral)
      let combinedMax;
      if (left.max >= right.max) {
        combinedMax = left.max + Math.floor(right.max * 0.5);
      } else {
        combinedMax = right.max + Math.floor(left.max * 0.5);
      }

      if (combinedMax === 0) return { max: 0, percent: 0 };

      // Combined percent: weighted average by max
      const leftEffective = left.max * (left.percent / 100);
      const rightEffective = right.max * (right.percent / 100);
      const totalEffective = leftEffective + rightEffective * 0.5; // Same diminishing returns
      const percent = Math.round((totalEffective / combinedMax) * 100);

      return { max: combinedMax, percent };
    `);

    // Aggregate hearing from both ears
    // Returns { max, percent } - combined capacity and current function
    obj.setMethod('canHear', `
      const face = await self.getPart('face');
      if (!face) return { max: 0, percent: 0 };

      const leftEar = await face.getPart('leftEar');
      const rightEar = await face.getPart('rightEar');

      // Get each ear's stats
      const left = leftEar ? await leftEar.canHear() : { max: 0, percent: 0 };
      const right = rightEar ? await rightEar.canHear() : { max: 0, percent: 0 };

      // Combine max: sum of both, with diminishing returns for second ear
      // First ear = 100%, second ear adds 50% (directional hearing, filtering)
      let combinedMax;
      if (left.max >= right.max) {
        combinedMax = left.max + Math.floor(right.max * 0.5);
      } else {
        combinedMax = right.max + Math.floor(left.max * 0.5);
      }

      if (combinedMax === 0) return { max: 0, percent: 0 };

      // Combined percent: weighted average by max
      const leftEffective = left.max * (left.percent / 100);
      const rightEffective = right.max * (right.percent / 100);
      const totalEffective = leftEffective + rightEffective * 0.5;
      const percent = Math.round((totalEffective / combinedMax) * 100);

      return { max: combinedMax, percent };
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
