import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the HumanRemains prototype
 * Dried/desiccated remains - between corpse and skeleton.
 *
 * Human remains:
 * - Dried tissue clinging to bones
 * - Decay very slowly (months to become skeletal)
 * - Can still be searched
 * - Limited autopsy possible (bone trauma, maybe some tissue)
 * - Eventually become $.skeletalRemains
 */
export class HumanRemainsBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Human Remains',
        description: 'Dried remains of a human.',
        // Original identity
        originalName: null,
        // Physical
        width: 50,
        height: 40,
        depth: 40,
        weight: 15000, // grams (~15kg - dried out)
        // Very slow decay - months to become skeletal
        // 6 months = 259200 ticks, 100% / 259200 = ~0.000386% per tick
        decayRate: 0.000386,
        decayLevel: 0, // Starts fresh as human remains
        decayCondition: 'always',
        // Contents
        contents: [],
        searched: false,
      },
      methods: {},
    });

    // Get the body inside
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

    // Describe with decay state
    obj.setMethod('describe', `
      const decay = self.decayLevel || 0;

      const descriptions = [
        // 0-20%: Recently dried
        'Desiccated human remains lie here. Dried skin and sinew cling to the bones.',
        // 20-40%
        'Withered human remains lie here. The dried flesh is cracked and peeling from the bones.',
        // 40-60%
        'Old human remains lie here. Scraps of dried tissue hang from the yellowing bones.',
        // 60-80%
        'Ancient-looking remains lie here. Little more than bone with traces of dried matter.',
        // 80-100%
        'Near-skeletal remains lie here. The last remnants of tissue are flaking away.',
      ];

      let desc = await $.proportional.fromPercent(descriptions, decay);

      if (!self.searched) {
        desc += '\\r\\nThere might be something among the remains.';
      }

      return desc;
    `);

    // Search
    obj.setMethod('search', `
      const searcher = args[0];
      const items = [];

      const body = await self.getBody();
      if (body) {
        const leftArm = body.getPart ? await body.getPart('leftArm') : null;
        const rightArm = body.getPart ? await body.getPart('rightArm') : null;
        const leftHand = leftArm && leftArm.getPart ? await leftArm.getPart('hand') : null;
        const rightHand = rightArm && rightArm.getPart ? await rightArm.getPart('hand') : null;

        for (const hand of [leftHand, rightHand]) {
          if (hand && hand.contents) {
            for (const itemId of hand.contents) {
              const item = await $.load(itemId);
              if (item) {
                items.push({ id: itemId, name: item.name || 'something', location: 'remains' });
              }
            }
          }
        }

        const torso = body.getPart ? await body.getPart('torso') : null;
        if (torso && torso.contents) {
          for (const itemId of torso.contents) {
            const item = await $.load(itemId);
            if (item) {
              items.push({ id: itemId, name: item.name || 'something', location: 'remains' });
            }
          }
        }
      }

      self.searched = true;

      if (items.length === 0) {
        return { success: false, message: 'Nothing but dried remains.' };
      }

      return {
        success: true,
        message: 'You search the remains and find:',
        items,
      };
    `);

    // Loot
    obj.setMethod('loot', `
      const itemName = args[0];
      const looter = args[1];
      const itemNameLower = (itemName || '').toLowerCase();

      const body = await self.getBody();
      if (!body) {
        return { success: false, message: 'Nothing to take.' };
      }

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
          message: 'You take ' + found.name + ' from the remains.',
          item: found,
        };
      }

      return { success: false, message: 'You don\\'t find that among the remains.' };
    `);

    // Autopsy - limited, mainly bone trauma
    obj.setMethod('performAutopsy', `
      const examiner = args[0];
      const examinerSkill = args[1] || 50;
      const decay = self.decayLevel || 0;

      const report = {
        subject: self.originalName || 'Unknown',
        timeOfExamination: 'present',
        overallCondition: null,
        causeOfDeath: [],
        bodyFindings: {},
        stomachContents: [],
        toxicology: [],
        missingParts: [],
        summary: null,
      };

      const conditions = [
        'Desiccated remains. Some tissue analysis may be possible.',
        'Dried remains. Limited soft tissue examination possible.',
        'Partially skeletonized. Examination mostly limited to bones.',
        'Largely skeletal. Only traces of tissue remain.',
        'Near-skeletal. Soft tissue examination impossible.',
      ];
      report.overallCondition = await $.proportional.fromPercent(conditions, decay);

      const body = await self.getBody();
      if (!body) {
        report.summary = 'No remains found to examine.';
        return report;
      }

      // Bone trauma always visible
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

      const torso = body.getPart ? await body.getPart('torso') : null;
      const head = body.getPart ? await body.getPart('head') : null;

      await checkBoneTrauma(torso, 'Torso');
      await checkBoneTrauma(head, 'Head');

      // Missing parts
      if (!head) report.missingParts.push('head');
      const leftArm = body.getPart ? await body.getPart('leftArm') : null;
      const rightArm = body.getPart ? await body.getPart('rightArm') : null;
      const leftLeg = body.getPart ? await body.getPart('leftLeg') : null;
      const rightLeg = body.getPart ? await body.getPart('rightLeg') : null;
      if (!leftArm) report.missingParts.push('left arm');
      if (!rightArm) report.missingParts.push('right arm');
      if (!leftLeg) report.missingParts.push('left leg');
      if (!rightLeg) report.missingParts.push('right leg');

      // Stomach - only if early decay
      if (decay < 30) {
        report.stomachContents.push('Stomach tissue too degraded for content analysis.');
      } else {
        report.stomachContents.push('No stomach remains.');
      }

      report.toxicology.push('Toxicology unreliable on desiccated tissue.');

      if (report.causeOfDeath.length === 0) {
        report.summary = 'No obvious bone trauma. Cause of death cannot be determined.';
      } else {
        report.summary = 'Bone trauma detected. ' + report.causeOfDeath[0];
      }

      return report;
    `);

    // Format report
    obj.setMethod('formatAutopsyReport', `
      const report = args[0];
      const lines = [];

      lines.push('=== AUTOPSY REPORT (DESICCATED) ===');
      lines.push('Subject: ' + report.subject);
      lines.push('');
      lines.push('CONDITION: ' + report.overallCondition);
      lines.push('');

      if (report.missingParts.length > 0) {
        lines.push('MISSING: ' + report.missingParts.join(', '));
        lines.push('');
      }

      if (report.causeOfDeath.length > 0) {
        lines.push('BONE TRAUMA:');
        for (const cause of report.causeOfDeath) {
          lines.push('  - ' + cause);
        }
        lines.push('');
      }

      lines.push('SUMMARY: ' + report.summary);
      lines.push('===================================');

      return lines.join('\\r\\n');
    `);

    // When fully decayed, become skeletal remains
    obj.setMethod('onFullyDecayed', `
      const skeletalProto = $.skeletalRemains;
      if (!skeletalProto) {
        return; // Can't transform, just stay as is
      }

      const location = self.location;
      const body = await self.getBody();

      // Create skeletal remains
      const skeleton = await $.create({
        parent: skeletalProto,
        properties: {
          name: 'skeletal remains',
          originalName: self.originalName,
          contents: body ? [body.id] : [],
          searched: self.searched,
        },
      });

      // Update body location
      if (body) {
        body.location = skeleton.id;
      }

      // Move skeleton to our location
      if (location) {
        await skeleton.moveTo(location);
        const room = await $.load(location);
        if (room && room.announce) {
          await room.announce('The dried remains crumble, leaving only bones behind.');
        }
      }

      // Remove self
      if ($.recycler) {
        self.contents = []; // Don't recycle the body
        await $.recycler.recycle(self);
      }
    `);

    obj.setMethod('canContain', `
      return true;
    `);

    return obj;
  }
}
