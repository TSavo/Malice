import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Corpse prototype
 * A dead body left behind when a player dies.
 *
 * Corpses:
 * - Inherit from Decayable (they rot over time)
 * - Have contents (lootable inventory from dead player)
 * - Can be examined
 * - Eventually decay completely and are recycled
 *
 * Decay timeline (1 tick = 1 minute):
 * - Fresh: 0-10% - recently dead
 * - Stiff: 10-30% - rigor mortis
 * - Bloated: 30-50% - decomposition gases
 * - Decaying: 50-80% - advanced decomposition
 * - Skeletal: 80-100% - mostly bones
 * - At 100%: recycled
 */
export class CorpseBuilder {
  constructor(private manager: ObjectManager) {}

  async build(decayableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: decayableId,
      properties: {
        name: 'Corpse',
        description: 'A lifeless body.',
        // Original identity
        originalName: null,
        // Physical - average human body
        width: 50, // cm
        height: 180,
        depth: 30,
        weight: 70000, // grams (~70kg)
        // Inventory from dead player
        contents: [],
        // Corpse-specific decay - this is hardcore survival
        // ~2 weeks to fully decompose (20160 ticks)
        // 100% / 20160 = ~0.005% per tick
        decayRate: 0.005,
        decayCondition: 'always', // Always decaying
        // Can be searched/looted
        searched: false,
      },
      methods: {},
    });

    // Get the body object inside this corpse
    obj.setMethod('getBody', `
      const contents = self.contents || [];
      for (const id of contents) {
        const obj = await $.load(id);
        // Body has torso, head, etc - check for body-like properties
        if (obj && (obj.torso !== undefined || obj.getPart)) {
          return obj;
        }
      }
      return null;
    `);

    // Describe corpse with decay state
    obj.setMethod('describe', `
      const decay = self.decayLevel || 0;
      const name = self.originalName || 'someone';
      let desc = '';

      if (decay < 10) {
        desc = 'The body of ' + name + ' lies here, seemingly at peace.';
        desc += ' The skin is pale but otherwise the body looks intact.';
      } else if (decay < 30) {
        desc = 'The stiff body of ' + name + ' lies here.';
        desc += ' Rigor mortis has set in, and the skin has taken on a waxy pallor.';
      } else if (decay < 50) {
        desc = 'The bloated remains of ' + name + ' lie here.';
        desc += ' Decomposition gases have swollen the body, and the smell is unpleasant.';
      } else if (decay < 80) {
        desc = 'The decaying remains of what was once ' + name + ' lie here.';
        desc += ' The flesh is discolored and falling away in places. The stench is overwhelming.';
      } else {
        desc = 'The skeletal remains of ' + name + ' lie here.';
        desc += ' Little flesh remains on the bones.';
      }

      // Get the actual body and describe visible wounds/state
      const body = await self.getBody();
      if (body) {
        // Check for missing/damaged parts
        const injuries = [];
        const leftArm = body.getPart ? await body.getPart('leftArm') : null;
        const rightArm = body.getPart ? await body.getPart('rightArm') : null;
        const leftLeg = body.getPart ? await body.getPart('leftLeg') : null;
        const rightLeg = body.getPart ? await body.getPart('rightLeg') : null;
        const head = body.getPart ? await body.getPart('head') : null;

        if (!leftArm) injuries.push('missing left arm');
        if (!rightArm) injuries.push('missing right arm');
        if (!leftLeg) injuries.push('missing left leg');
        if (!rightLeg) injuries.push('missing right leg');
        if (!head) injuries.push('missing head');

        if (injuries.length > 0) {
          desc += '\\r\\nThe body is ' + injuries.join(', ') + '.';
        }
      }

      // Check for items that could be looted
      if (!self.searched) {
        desc += '\\r\\nThe body could be searched for belongings.';
      } else {
        desc += '\\r\\nThe body has been searched.';
      }

      return desc;
    `);

    // Search/loot the corpse - looks in hands and on body
    obj.setMethod('search', `
      /** Search the corpse for items.
       *  @param searcher - The person searching
       *  @returns List of items found (in hands, on body)
       */
      const searcher = args[0];
      const items = [];

      // Get the body inside corpse
      const body = await self.getBody();
      if (body) {
        // Check hands for held items
        const leftArm = body.getPart ? await body.getPart('leftArm') : null;
        const rightArm = body.getPart ? await body.getPart('rightArm') : null;
        const leftHand = leftArm && leftArm.getPart ? await leftArm.getPart('hand') : null;
        const rightHand = rightArm && rightArm.getPart ? await rightArm.getPart('hand') : null;

        for (const hand of [leftHand, rightHand]) {
          if (hand && hand.contents) {
            for (const itemId of hand.contents) {
              const item = await $.load(itemId);
              if (item) {
                items.push({ id: itemId, name: item.name || 'something', location: 'hand' });
              }
            }
          }
        }

        // Check torso for worn/carried items
        const torso = body.getPart ? await body.getPart('torso') : null;
        if (torso && torso.contents) {
          for (const itemId of torso.contents) {
            const item = await $.load(itemId);
            if (item) {
              items.push({ id: itemId, name: item.name || 'something', location: 'torso' });
            }
          }
        }
      }

      // Mark as searched
      self.searched = true;

      if (items.length === 0) {
        return { success: false, message: 'The body has nothing of value.' };
      }

      return {
        success: true,
        message: 'You search the body and find:',
        items,
      };
    `);

    // Take an item from the corpse
    obj.setMethod('loot', `
      /** Take an item from the corpse.
       *  @param itemName - Name of item to take
       *  @param looter - The person looting
       *  @returns Result of looting
       */
      const itemName = args[0];
      const looter = args[1];
      const itemNameLower = (itemName || '').toLowerCase();

      // Get the body inside corpse
      const body = await self.getBody();
      if (!body) {
        return { success: false, message: 'The body has nothing to take.' };
      }

      // Search hands for the item
      const leftArm = body.getPart ? await body.getPart('leftArm') : null;
      const rightArm = body.getPart ? await body.getPart('rightArm') : null;
      const leftHand = leftArm && leftArm.getPart ? await leftArm.getPart('hand') : null;
      const rightHand = rightArm && rightArm.getPart ? await rightArm.getPart('hand') : null;

      for (const hand of [leftHand, rightHand]) {
        if (hand && hand.contents) {
          for (const itemId of hand.contents) {
            const item = await $.load(itemId);
            if (!item) continue;

            const name = (item.name || '').toLowerCase();
            const aliases = (item.aliases || []).map(a => a.toLowerCase());

            if (name === itemNameLower || name.includes(itemNameLower) || aliases.includes(itemNameLower)) {
              await item.moveTo(looter);
              return {
                success: true,
                message: 'You take ' + item.name + ' from the corpse.',
                item,
              };
            }
          }
        }
      }

      // Search torso
      const torso = body.getPart ? await body.getPart('torso') : null;
      if (torso && torso.contents) {
        for (const itemId of torso.contents) {
          const item = await $.load(itemId);
          if (!item) continue;

          const name = (item.name || '').toLowerCase();
          const aliases = (item.aliases || []).map(a => a.toLowerCase());

          if (name === itemNameLower || name.includes(itemNameLower) || aliases.includes(itemNameLower)) {
            await item.moveTo(looter);
            return {
              success: true,
              message: 'You take ' + item.name + ' from the corpse.',
              item,
            };
          }
        }
      }

      return { success: false, message: 'You don\\'t see that on the body.' };
    `);

    // Check if this can contain something (corpses can hold inventory)
    obj.setMethod('canContain', `
      // Corpses can contain items (dead player's inventory)
      return true;
    `);

    // === AUTOPSY HOOKS ===
    // Main autopsy method - examines corpse and returns narrative findings

    obj.setMethod('performAutopsy', `
      /** Perform an autopsy on this corpse.
       *  @param examiner - The person performing the autopsy
       *  @param examinerSkill - 0-100, skill level affects detail
       *  @returns Structured autopsy report with narrative findings
       */
      const examiner = args[0];
      const examinerSkill = args[1] || 50;

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

      const corpseDecay = self.decayLevel || 0;
      const body = await self.getBody();

      // OVERALL CONDITION based on corpse decay
      if (corpseDecay < 10) {
        report.overallCondition = 'The body is fresh, recently deceased.';
      } else if (corpseDecay < 30) {
        report.overallCondition = 'Rigor mortis has set in. Death occurred some time ago.';
      } else if (corpseDecay < 50) {
        report.overallCondition = 'The body is bloated with decomposition gases. Death occurred days ago.';
      } else if (corpseDecay < 80) {
        report.overallCondition = 'Advanced decomposition. Many details are difficult to determine.';
      } else {
        report.overallCondition = 'Only skeletal remains. Cause of death may be impossible to determine.';
      }

      if (!body) {
        report.summary = 'No body found within the corpse to examine.';
        return report;
      }

      // CAUSE OF DEATH ANALYSIS
      // Look at what likely killed them based on body state
      const visibility = Math.max(0, 100 - corpseDecay);
      const canSeeDetail = (threshold) => (visibility + examinerSkill / 2) >= threshold;

      // Check torso for starvation/dehydration
      const torso = body.getPart ? await body.getPart('torso') : null;
      if (torso && canSeeDetail(50)) {
        const calories = torso.calories || 0;
        const maxCalories = torso.maxCalories || 3000;
        const hydration = torso.hydration ?? 100;
        const maxHydration = torso.maxHydration || 100;

        // Starvation
        if (calories / maxCalories < 0.05) {
          report.causeOfDeath.push('Severe malnutrition consistent with starvation.');
        } else if (calories / maxCalories < 0.2 && canSeeDetail(70)) {
          report.causeOfDeath.push('Signs of significant malnutrition.');
        }

        // Dehydration
        if (hydration / maxHydration < 0.05 && canSeeDetail(40)) {
          report.causeOfDeath.push('Severe dehydration - tissues are desiccated.');
        } else if (hydration / maxHydration < 0.2 && canSeeDetail(60)) {
          report.causeOfDeath.push('Signs of significant dehydration.');
        }

        // Body fat state
        const fat = torso.fat || 0;
        if (fat < 5 && canSeeDetail(60)) {
          report.causeOfDeath.push('No body fat reserves - the body was emaciated.');
        }
      }

      // Check for trauma (wounds causing death)
      const traumaFindings = [];
      const checkPartForTrauma = async (part, partName) => {
        if (!part) return;
        const condition = part.condition || {};
        const wounds = condition.wounds || {};
        const brokenBones = condition.brokenBones || [];

        // Critical wounds
        for (const type of Object.keys(wounds)) {
          const typeWounds = wounds[type].filter(w => !w.healed);
          if (typeWounds.length > 0) {
            const bleeding = typeWounds.filter(w => w.bleeding).length;
            if (bleeding > 0 && corpseDecay < 30) {
              traumaFindings.push('Active bleeding from ' + type + 's on ' + partName + ' suggests blood loss.');
            }
            if (typeWounds.length >= 3) {
              traumaFindings.push('Severe ' + type + ' trauma to ' + partName + '.');
            }
          }
        }

        // Broken bones in critical areas
        for (const bone of brokenBones.filter(b => !b.healed)) {
          if (['skull', 'spine', 'ribs'].includes(bone.bone)) {
            traumaFindings.push('Fractured ' + bone.bone + ' - potentially fatal injury.');
          }
        }
      };

      // Check critical parts
      if (torso) await checkPartForTrauma(torso, 'torso');
      const head = body.getPart ? await body.getPart('head') : null;
      if (head) await checkPartForTrauma(head, 'head');

      if (traumaFindings.length > 0 && corpseDecay < 80) {
        report.causeOfDeath.push(...traumaFindings);
      }

      // MISSING PARTS
      const expectedParts = ['head', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
      for (const partName of expectedParts) {
        const part = body.getPart ? await body.getPart(partName) : null;
        if (!part) {
          report.missingParts.push(partName.replace(/([A-Z])/g, ' $1').toLowerCase().trim());
        }
      }

      // BODY PART FINDINGS - get detailed findings from each part
      if (body.getFullAutopsyFindings) {
        report.bodyFindings = await body.getFullAutopsyFindings(examinerSkill);
      }

      // STOMACH CONTENTS - what was their last meal?
      if (torso && canSeeDetail(30)) {
        const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
        if (stomach) {
          const contents = stomach.contents || [];
          if (contents.length === 0) {
            report.stomachContents.push('The stomach is empty.');
          } else {
            for (const itemId of contents) {
              const item = await $.load(itemId);
              if (item) {
                // Describe stomach contents narratively
                const sourceName = item.sourceName || 'unknown substance';
                const sourceType = item.sourceType || 'material';

                if (corpseDecay < 30) {
                  // Fresh - can identify
                  report.stomachContents.push('Partially digested ' + sourceName + '.');
                } else if (corpseDecay < 50) {
                  // Bloated - harder to identify
                  report.stomachContents.push('Decomposed ' + sourceType + ' matter.');
                } else {
                  // Very decayed - just note presence
                  report.stomachContents.push('Unidentifiable organic matter.');
                }

                // Check for poison
                if (item.poisoned && canSeeDetail(70)) {
                  report.stomachContents.push('The ' + sourceName + ' shows signs of contamination.');
                }
              }
            }
          }
        }
      }

      // TOXICOLOGY - check for status effects frozen at death
      // The body should have statusEffects from when they died
      if (body.statusEffects && canSeeDetail(60)) {
        const effects = body.statusEffects || {};
        for (const [effectName, effectData] of Object.entries(effects)) {
          const intensity = effectData.intensity || 0;
          if (intensity <= 0) continue;

          // Describe effects narratively
          if (effectName === 'sedation') {
            if (intensity > 50) {
              report.toxicology.push('High levels of sedative compounds detected.');
            } else if (intensity > 20) {
              report.toxicology.push('Moderate sedative presence.');
            }
          } else if (effectName === 'stimulation') {
            if (intensity > 50) {
              report.toxicology.push('High levels of stimulant compounds detected.');
            } else if (intensity > 20) {
              report.toxicology.push('Moderate stimulant presence.');
            }
          } else if (effectName === 'nausea') {
            report.toxicology.push('Signs of gastrointestinal distress.');
          } else if (effectName === 'euphoria') {
            report.toxicology.push('Traces of psychoactive compounds.');
          } else if (effectName === 'pain') {
            // Pain itself isn't a toxin, skip
          } else {
            // Generic effect
            if (intensity > 30) {
              report.toxicology.push('Unknown compound affecting ' + effectName + '.');
            }
          }
        }

        // Dangerous combination
        const sedation = (effects.sedation?.intensity || 0);
        const stimulation = (effects.stimulation?.intensity || 0);
        if (sedation > 30 && stimulation > 30 && canSeeDetail(80)) {
          report.causeOfDeath.push('Cardiac stress from mixed depressant and stimulant use.');
        }
      }

      // GENERATE SUMMARY
      if (report.causeOfDeath.length === 0) {
        if (corpseDecay >= 80) {
          report.summary = 'Cause of death cannot be determined due to advanced decomposition.';
        } else {
          report.summary = 'No obvious cause of death found. Further examination may be required.';
        }
      } else if (report.causeOfDeath.length === 1) {
        report.summary = 'Probable cause of death: ' + report.causeOfDeath[0];
      } else {
        report.summary = 'Multiple contributing factors to death identified.';
      }

      return report;
    `);

    // Format autopsy report as readable text
    obj.setMethod('formatAutopsyReport', `
      /** Format an autopsy report as readable text.
       *  @param report - Report from performAutopsy
       *  @returns Formatted string
       */
      const report = args[0];
      const lines = [];

      lines.push('=== AUTOPSY REPORT ===');
      lines.push('Subject: ' + report.subject);
      lines.push('');
      lines.push('CONDITION: ' + report.overallCondition);
      lines.push('');

      if (report.missingParts.length > 0) {
        lines.push('MISSING: ' + report.missingParts.join(', '));
        lines.push('');
      }

      if (report.causeOfDeath.length > 0) {
        lines.push('CAUSE OF DEATH:');
        for (const cause of report.causeOfDeath) {
          lines.push('  - ' + cause);
        }
        lines.push('');
      }

      if (report.stomachContents.length > 0) {
        lines.push('STOMACH CONTENTS:');
        for (const content of report.stomachContents) {
          lines.push('  - ' + content);
        }
        lines.push('');
      }

      if (report.toxicology.length > 0) {
        lines.push('TOXICOLOGY:');
        for (const tox of report.toxicology) {
          lines.push('  - ' + tox);
        }
        lines.push('');
      }

      // Body findings by part
      const partNames = Object.keys(report.bodyFindings || {});
      if (partNames.length > 0) {
        lines.push('EXAMINATION FINDINGS:');
        for (const partName of partNames) {
          const findings = report.bodyFindings[partName];
          if (findings.length > 0) {
            lines.push('  ' + partName + ':');
            for (const finding of findings) {
              lines.push('    - ' + finding);
            }
          }
        }
        lines.push('');
      }

      lines.push('SUMMARY: ' + report.summary);
      lines.push('======================');

      return lines.join('\\r\\n');
    `);

    // When decay reaches 100%, recycle the corpse and its contents
    obj.setMethod('onFullyDecayed', `
      /** Called when corpse is fully decomposed.
       *  Recycles the corpse and dumps remaining contents.
       */
      const contents = self.contents || [];
      const location = self.location;

      // Dump remaining contents to location
      if (location && contents.length > 0) {
        const room = await $.load(location);
        if (room) {
          for (const itemId of contents) {
            const item = await $.load(itemId);
            if (item) {
              await item.moveTo(location);
            }
          }
          // Announce if room has announce
          if (room.announce) {
            const name = self.originalName || 'someone';
            await room.announce('The remains of ' + name + ' crumble to dust, leaving behind some belongings.');
          }
        }
      }

      // Recycle self
      if ($.recycler) {
        await $.recycler.recycle(self);
      }
    `);

    return obj;
  }
}
