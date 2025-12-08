import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the SkeletalRemains prototype
 * The final stage of a corpse - bones that persist indefinitely.
 *
 * Skeletal remains:
 * - Do NOT decay further - bones last forever
 * - Can still be searched (though most items have rotted/been looted)
 * - Can be examined for autopsy (limited to bone trauma)
 * - Can be scattered, buried, or left as grim landmarks
 * - Contain the original body (now skeletal)
 */
export class SkeletalRemainsBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Skeletal Remains',
        description: 'A pile of bones.',
        // Original identity - needs autopsy to determine
        originalName: null,
        // Physical - just bones now
        width: 50, // cm - scattered
        height: 30,
        depth: 50,
        weight: 10000, // grams (~10kg of bones)
        // NO DECAY - bones are permanent
        decayRate: 0,
        decayLevel: 100, // Already fully decayed
        // Contents - the skeletal body and any remaining items
        contents: [],
        // Can be searched
        searched: false,
      },
      methods: {},
    });

    // Get the body inside (skeletal now)
    obj.setMethod('getBody', `
      const contents = self.contents || [];
      for (const id of contents) {
        const obj = await $.load(id);
        if (obj && (obj.torso !== undefined || obj.getPart)) {
          return obj;
        }
      }
      return null;
    `);

    // Describe skeletal remains
    obj.setMethod('describe', `
      const name = self.originalName;
      let desc = '';

      if (name) {
        // If we somehow know who it was (maybe tagged?)
        desc = 'The skeletal remains of ' + name + ' lie here.';
      } else {
        desc = 'A pile of bones lies here, bleached and scattered.';
      }

      desc += ' Little remains but the skeleton itself.';

      // Check for items
      if (!self.searched) {
        desc += '\\r\\nThere might be something among the bones.';
      }

      return desc;
    `);

    // Search the remains
    obj.setMethod('search', `
      const searcher = args[0];
      const items = [];

      const body = await self.getBody();
      if (body) {
        // Check hands for held items (unlikely to remain, but possible)
        const leftArm = body.getPart ? await body.getPart('leftArm') : null;
        const rightArm = body.getPart ? await body.getPart('rightArm') : null;
        const leftHand = leftArm && leftArm.getPart ? await leftArm.getPart('hand') : null;
        const rightHand = rightArm && rightArm.getPart ? await rightArm.getPart('hand') : null;

        for (const hand of [leftHand, rightHand]) {
          if (hand && hand.contents) {
            for (const itemId of hand.contents) {
              const item = await $.load(itemId);
              if (item) {
                items.push({ id: itemId, name: item.name || 'something', location: 'bones' });
              }
            }
          }
        }

        // Check torso for items
        const torso = body.getPart ? await body.getPart('torso') : null;
        if (torso && torso.contents) {
          for (const itemId of torso.contents) {
            const item = await $.load(itemId);
            if (item) {
              items.push({ id: itemId, name: item.name || 'something', location: 'bones' });
            }
          }
        }
      }

      self.searched = true;

      if (items.length === 0) {
        return { success: false, message: 'Nothing but bones.' };
      }

      return {
        success: true,
        message: 'You sift through the bones and find:',
        items,
      };
    `);

    // Loot from remains
    obj.setMethod('loot', `
      const itemName = args[0];
      const looter = args[1];
      const itemNameLower = (itemName || '').toLowerCase();

      const body = await self.getBody();
      if (!body) {
        return { success: false, message: 'Nothing but bones.' };
      }

      // Search through body parts for the item
      const searchParts = async (part) => {
        if (!part) return null;
        if (part.contents) {
          for (const itemId of part.contents) {
            const item = await $.load(itemId);
            if (!item) continue;
            const name = (item.name || '').toLowerCase();
            const aliases = (item.aliases || []).map(a => a.toLowerCase());
            if (name === itemNameLower || name.includes(itemNameLower) || aliases.includes(itemNameLower)) {
              await item.moveTo(looter);
              return item;
            }
          }
        }
        // Check child parts
        const parts = part.parts || {};
        for (const partName of Object.keys(parts)) {
          const childId = parts[partName];
          if (childId) {
            const child = await $.load(childId);
            const found = await searchParts(child);
            if (found) return found;
          }
        }
        return null;
      };

      const found = await searchParts(body);
      if (found) {
        return {
          success: true,
          message: 'You take ' + found.name + ' from among the bones.',
          item: found,
        };
      }

      return { success: false, message: 'You don\\'t find that among the bones.' };
    `);

    // Limited autopsy - only bone trauma visible
    obj.setMethod('performAutopsy', `
      const examiner = args[0];
      const examinerSkill = args[1] || 50;

      const report = {
        subject: self.originalName || 'Unknown',
        timeOfExamination: 'present',
        overallCondition: 'Skeletal remains only. Soft tissue examination impossible.',
        causeOfDeath: [],
        bodyFindings: {},
        stomachContents: ['No stomach remains to examine.'],
        toxicology: ['Toxicology impossible on skeletal remains.'],
        missingParts: [],
        summary: null,
      };

      const body = await self.getBody();
      if (!body) {
        report.summary = 'No skeletal structure found to examine.';
        return report;
      }

      // Can only see bone trauma now
      const checkBoneTrauma = async (part, partName) => {
        if (!part) return;
        const condition = part.condition || {};
        const brokenBones = condition.brokenBones || [];

        for (const bone of brokenBones.filter(b => !b.healed)) {
          if (['skull', 'spine', 'ribs'].includes(bone.bone)) {
            report.causeOfDeath.push('Fractured ' + bone.bone + ' - potentially fatal injury.');
          }
          if (!report.bodyFindings[partName]) {
            report.bodyFindings[partName] = [];
          }
          report.bodyFindings[partName].push('The ' + bone.bone + ' is broken.');
        }
      };

      // Check all parts for bone damage
      const torso = body.getPart ? await body.getPart('torso') : null;
      const head = body.getPart ? await body.getPart('head') : null;
      const leftArm = body.getPart ? await body.getPart('leftArm') : null;
      const rightArm = body.getPart ? await body.getPart('rightArm') : null;
      const leftLeg = body.getPart ? await body.getPart('leftLeg') : null;
      const rightLeg = body.getPart ? await body.getPart('rightLeg') : null;

      await checkBoneTrauma(torso, 'Torso');
      await checkBoneTrauma(head, 'Head');
      await checkBoneTrauma(leftArm, 'Left Arm');
      await checkBoneTrauma(rightArm, 'Right Arm');
      await checkBoneTrauma(leftLeg, 'Left Leg');
      await checkBoneTrauma(rightLeg, 'Right Leg');

      // Missing parts
      if (!head) report.missingParts.push('head');
      if (!leftArm) report.missingParts.push('left arm');
      if (!rightArm) report.missingParts.push('right arm');
      if (!leftLeg) report.missingParts.push('left leg');
      if (!rightLeg) report.missingParts.push('right leg');

      // Summary
      if (report.causeOfDeath.length === 0) {
        report.summary = 'No bone trauma detected. Cause of death cannot be determined from skeletal remains alone.';
      } else {
        report.summary = 'Bone trauma detected. ' + report.causeOfDeath[0];
      }

      return report;
    `);

    // Format report (same as corpse)
    obj.setMethod('formatAutopsyReport', `
      const report = args[0];
      const lines = [];

      lines.push('=== AUTOPSY REPORT (SKELETAL) ===');
      lines.push('Subject: ' + report.subject);
      lines.push('');
      lines.push('CONDITION: ' + report.overallCondition);
      lines.push('');

      if (report.missingParts.length > 0) {
        lines.push('MISSING BONES: ' + report.missingParts.join(', '));
        lines.push('');
      }

      if (report.causeOfDeath.length > 0) {
        lines.push('BONE TRAUMA:');
        for (const cause of report.causeOfDeath) {
          lines.push('  - ' + cause);
        }
        lines.push('');
      }

      lines.push('SOFT TISSUE: None remaining.');
      lines.push('TOXICOLOGY: Impossible.');
      lines.push('');

      lines.push('SUMMARY: ' + report.summary);
      lines.push('=================================');

      return lines.join('\\r\\n');
    `);

    // Can contain the body
    obj.setMethod('canContain', `
      return true;
    `);

    return obj;
  }
}
