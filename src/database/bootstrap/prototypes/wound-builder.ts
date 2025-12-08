import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Wound prototype
 * Wounds are complex objects that exist on body parts.
 *
 * Wounds:
 * - Have type, severity, depth
 * - Can bleed (causes hydration/blood loss on body part)
 * - Can heal over time (naturally or with treatment)
 * - Can get infected (untreated wounds risk infection)
 * - Cause pain to the owner
 * - Can be examined for autopsy
 *
 * Wound lifecycle:
 * - Created via bodyPart.addWound()
 * - Ticks each game tick (bleed, heal, infect chance, pain)
 * - Removed when fully healed (healingProgress >= 100)
 */
export class WoundBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Wound',
        description: 'A wound.',
        // Wound type: cut, bruise, puncture, burn, laceration, abrasion, fracture
        type: 'cut',
        // Severity 0-100 (minor scrape to life-threatening)
        severity: 20,
        // Depth affects healing time and infection risk
        // 'superficial', 'shallow', 'deep', 'penetrating'
        depth: 'shallow',
        // Reference to the body part this wound is on
        bodyPart: null,
        // Bleeding rate 0-100 (0 = not bleeding, 100 = arterial)
        bleeding: 0,
        // Infection state
        infected: false,
        infectionSeverity: 0, // 0-100
        infectionType: null, // 'bacterial', 'necrotic', 'septic'
        // Healing progress 0-100 (100 = fully healed)
        healingProgress: 0,
        // Treatment state
        cleaned: false, // Has been cleaned/disinfected
        bandaged: false, // Has been bandaged
        stitched: false, // Has been stitched (for deep cuts)
        // Pain level 0-100
        painLevel: 20,
        // When inflicted (game tick)
        inflictedTick: 0,
        // What caused it (for autopsy/forensics)
        cause: null, // 'blade', 'blunt', 'claw', 'bite', 'fire', 'acid'
        // Attacker reference (if any)
        attacker: null,
      },
      methods: {},
    });

    // Initialize wound with proper values based on type and severity
    obj.setMethod('initialize', `
      /** Set up wound properties based on type and severity.
       *  @param type - Wound type
       *  @param severity - 0-100
       *  @param options - { depth, cause, attacker, bodyPart }
       */
      const type = args[0] || 'cut';
      const severity = args[1] || 20;
      const options = args[2] || {};

      self.type = type;
      self.severity = severity;
      self.depth = options.depth || 'shallow';
      self.cause = options.cause || null;
      self.attacker = options.attacker || null;
      self.bodyPart = options.bodyPart || null;
      self.inflictedTick = $.tick || 0;

      // Set bleeding based on type and severity
      // Cuts and lacerations bleed more than bruises
      const bleedingTypes = {
        cut: 0.8,
        laceration: 1.0,
        puncture: 0.6,
        abrasion: 0.3,
        bruise: 0,
        burn: 0.2,
        fracture: 0.1,
      };
      const bleedFactor = bleedingTypes[type] || 0.5;

      // Depth affects bleeding
      const depthMultiplier = {
        superficial: 0.3,
        shallow: 0.6,
        deep: 1.0,
        penetrating: 1.5,
      };
      const depthFactor = depthMultiplier[self.depth] || 0.6;

      self.bleeding = Math.min(100, Math.round(severity * bleedFactor * depthFactor));

      // Set pain based on type and severity
      const painTypes = {
        cut: 0.7,
        laceration: 0.9,
        puncture: 0.8,
        abrasion: 0.5,
        bruise: 0.6,
        burn: 1.0,
        fracture: 1.2,
      };
      const painFactor = painTypes[type] || 0.7;
      self.painLevel = Math.min(100, Math.round(severity * painFactor));

      // Generate description
      self.description = await self.generateDescription();

      return self;
    `);

    // Generate narrative description of the wound
    obj.setMethod('generateDescription', `
      const severity = self.severity || 20;
      const type = self.type || 'wound';
      const depth = self.depth || 'shallow';

      // Severity adjectives
      const severityAdj = await $.proportional.fromPercent([
        'minor',      // 0-20
        'moderate',   // 20-40
        'serious',    // 40-60
        'severe',     // 60-80
        'critical',   // 80-100
      ], severity);

      // Depth descriptions
      const depthDesc = {
        superficial: 'surface-level',
        shallow: '',
        deep: 'deep',
        penetrating: 'penetrating',
      };
      const depthAdj = depthDesc[depth] || '';

      // Type descriptions
      const typeDesc = {
        cut: 'cut',
        laceration: 'laceration',
        puncture: 'puncture wound',
        abrasion: 'abrasion',
        bruise: 'bruise',
        burn: 'burn',
        fracture: 'fracture',
      };
      const typeName = typeDesc[type] || type;

      // Build description
      let desc = 'A ' + severityAdj;
      if (depthAdj) desc += ' ' + depthAdj;
      desc += ' ' + typeName;

      // Add bleeding state
      if (self.bleeding > 50) {
        desc += ', bleeding profusely';
      } else if (self.bleeding > 20) {
        desc += ', bleeding steadily';
      } else if (self.bleeding > 0) {
        desc += ', oozing blood';
      }

      // Add infection state
      if (self.infected) {
        if (self.infectionSeverity > 60) {
          desc += ', badly infected';
        } else if (self.infectionSeverity > 30) {
          desc += ', showing signs of infection';
        } else {
          desc += ', slightly inflamed';
        }
      }

      // Add healing state
      if (self.healingProgress > 70) {
        desc += ', nearly healed';
      } else if (self.healingProgress > 40) {
        desc += ', healing';
      } else if (self.healingProgress > 20) {
        desc += ', beginning to heal';
      }

      desc += '.';
      return desc;
    `);

    // Process one tick of wound effects
    obj.setMethod('tick', `
      /** Process wound effects for one game tick.
       *  @returns { bled, healed, infected, pain }
       */
      const results = {
        bled: 0,
        healed: 0,
        infected: false,
        pain: 0,
        fullyHealed: false,
      };

      // Don't process if fully healed
      if (self.healingProgress >= 100) {
        results.fullyHealed = true;
        return results;
      }

      // === BLEEDING ===
      if (self.bleeding > 0) {
        const bodyPart = self.bodyPart ? await $.load(self.bodyPart) : null;
        if (bodyPart) {
          // Blood loss drains both hydration AND calories
          // Blood carries water and nutrients/energy
          const bleedAmount = self.bleeding / 10; // 0-10 per tick

          // Drain hydration (blood is mostly water)
          const currentHydration = bodyPart.hydration ?? 100;
          bodyPart.hydration = Math.max(0, currentHydration - bleedAmount);

          // Drain calories (blood carries nutrients, energy)
          // Each point of bleed = 5 calories lost
          const caloriesLost = self.bleeding * 0.5;
          const currentCalories = bodyPart.calories ?? 0;
          bodyPart.calories = Math.max(0, currentCalories - caloriesLost);

          results.bled = bleedAmount;

          // Bleeding slows naturally (clotting)
          // Faster if bandaged, slower if moving
          let clotRate = 0.5; // Base clotting per tick
          if (self.bandaged) clotRate = 2;
          if (self.stitched) clotRate = 5;

          self.bleeding = Math.max(0, self.bleeding - clotRate);
        }
      }

      // === PAIN ===
      if (self.painLevel > 0) {
        const bodyPart = self.bodyPart ? await $.load(self.bodyPart) : null;
        if (bodyPart) {
          const owner = bodyPart.owner ? await $.load(bodyPart.owner) : null;
          if (owner && owner.feel) {
            // Pain pulses periodically, not every tick
            const tick = $.tick || 0;
            if (tick % 10 === 0) { // Every 10 ticks
              await owner.feel({
                type: 'pain',
                intensity: self.painLevel,
                source: 'wound',
                location: bodyPart.name,
              });
              results.pain = self.painLevel;
            }
          }
        }

        // Pain slowly decreases as wound heals
        if (self.healingProgress > 30) {
          self.painLevel = Math.max(0, self.painLevel - 0.1);
        }
      }

      // === INFECTION RISK ===
      if (!self.infected && !self.cleaned && self.depth !== 'superficial') {
        // Infection chance increases over time for uncleaned wounds
        const ticksSinceInflicted = ($.tick || 0) - (self.inflictedTick || 0);
        const baseChance = 0.001; // 0.1% per tick base
        const depthMultiplier = {
          superficial: 0,
          shallow: 1,
          deep: 2,
          penetrating: 3,
        };
        const depthFactor = depthMultiplier[self.depth] || 1;

        // Dirty wounds (punctures, bites) more likely to infect
        const causeMultiplier = {
          bite: 3,
          claw: 2,
          dirty: 2,
          blade: 1,
          blunt: 0.5,
        };
        const causeFactor = causeMultiplier[self.cause] || 1;

        const infectionChance = baseChance * depthFactor * causeFactor * (ticksSinceInflicted / 60);

        if (Math.random() < infectionChance) {
          await self.infect('bacterial');
          results.infected = true;
        }
      }

      // === INFECTION PROGRESSION ===
      if (self.infected) {
        // Infection worsens if untreated
        if (!self.cleaned) {
          self.infectionSeverity = Math.min(100, (self.infectionSeverity || 0) + 0.2);
        }

        // Infection causes additional pain
        self.painLevel = Math.min(100, self.painLevel + (self.infectionSeverity / 50));

        // Severe infection can become septic
        if (self.infectionSeverity > 80 && self.infectionType !== 'septic') {
          self.infectionType = 'septic';
          // Sepsis affects the whole body - notify owner
          const bodyPart = self.bodyPart ? await $.load(self.bodyPart) : null;
          if (bodyPart) {
            const owner = bodyPart.owner ? await $.load(bodyPart.owner) : null;
            if (owner && owner.addStatusEffect) {
              await owner.addStatusEffect('sepsis', 100, { source: self.id });
            }
          }
        }
      }

      // === HEALING ===
      // Dirty wounds DON'T heal - must be cleaned first
      // Clean wounds heal naturally, faster with treatment
      let healRate = 0;

      if (!self.cleaned) {
        // Dirty wound - no healing, just festering
        healRate = 0;
      } else {
        // Clean wound - base healing rate
        healRate = 0.2;

        // Treatment improves healing
        if (self.bandaged) healRate += 0.3;
        if (self.stitched && ['cut', 'laceration'].includes(self.type)) healRate += 0.5;

        // Can't heal while actively bleeding
        if (self.bleeding > 10) healRate = 0;

        // Infection drastically slows healing (even if cleaned after infection)
        if (self.infected) healRate *= 0.2;

        // Depth affects healing time
        const depthSlowdown = {
          superficial: 1.5,
          shallow: 1.0,
          deep: 0.5,
          penetrating: 0.25,
        };
        healRate *= depthSlowdown[self.depth] || 1.0;
      }

      if (healRate > 0) {
        self.healingProgress = Math.min(100, (self.healingProgress || 0) + healRate);
        results.healed = healRate;

        // Update description as wound heals
        self.description = await self.generateDescription();

        if (self.healingProgress >= 100) {
          results.fullyHealed = true;
        }
      }

      return results;
    `);

    // Cause the wound to bleed more (reopened, aggravated)
    obj.setMethod('aggravate', `
      /** Aggravate the wound, increasing bleeding and pain.
       *  @param amount - How much to aggravate (0-100)
       */
      const amount = args[0] || 20;

      self.bleeding = Math.min(100, (self.bleeding || 0) + amount);
      self.painLevel = Math.min(100, (self.painLevel || 0) + (amount / 2));
      self.healingProgress = Math.max(0, (self.healingProgress || 0) - (amount / 2));

      // Bandages come off if aggravated
      if (amount > 30) {
        self.bandaged = false;
      }

      self.description = await self.generateDescription();

      return {
        success: true,
        message: 'The wound reopens!',
        bleeding: self.bleeding,
      };
    `);

    // Infect the wound
    obj.setMethod('infect', `
      /** Infect the wound.
       *  @param type - Infection type ('bacterial', 'necrotic', 'septic')
       */
      const type = args[0] || 'bacterial';

      self.infected = true;
      self.infectionType = type;
      self.infectionSeverity = self.infectionSeverity || 10;
      self.painLevel = Math.min(100, (self.painLevel || 0) + 10);

      self.description = await self.generateDescription();

      return {
        success: true,
        type: type,
        message: 'The wound has become infected.',
      };
    `);

    // Clean/disinfect the wound
    obj.setMethod('clean', `
      /** Clean and disinfect the wound.
       *  @param thoroughness - 0-100, how well cleaned
       */
      const thoroughness = args[0] || 50;

      self.cleaned = true;

      // Cleaning can reduce or eliminate infection
      if (self.infected && self.infectionSeverity < 50) {
        if (thoroughness > 70) {
          self.infected = false;
          self.infectionSeverity = 0;
          self.infectionType = null;
        } else {
          self.infectionSeverity = Math.max(0, self.infectionSeverity - thoroughness);
        }
      }

      self.description = await self.generateDescription();

      return {
        success: true,
        message: self.infected
          ? 'You clean the wound, but the infection remains.'
          : 'The wound is now clean.',
      };
    `);

    // Bandage the wound
    obj.setMethod('bandage', `
      /** Apply a bandage to the wound.
       *  @param quality - 0-100, bandage quality
       */
      const quality = args[0] || 50;

      self.bandaged = true;

      // Good bandage reduces bleeding faster
      if (quality > 70) {
        self.bleeding = Math.max(0, self.bleeding - 20);
      }

      self.description = await self.generateDescription();

      return {
        success: true,
        message: 'The wound is now bandaged.',
      };
    `);

    // Stitch the wound (for cuts/lacerations)
    obj.setMethod('stitch', `
      /** Stitch the wound closed.
       *  @param skill - 0-100, stitching skill
       */
      const skill = args[0] || 50;

      if (!['cut', 'laceration'].includes(self.type)) {
        return {
          success: false,
          message: 'This type of wound cannot be stitched.',
        };
      }

      if (self.depth === 'superficial') {
        return {
          success: false,
          message: 'The wound is too shallow to require stitches.',
        };
      }

      self.stitched = true;
      self.bleeding = Math.max(0, self.bleeding - 30);

      // Poor stitching can cause problems
      if (skill < 30) {
        self.painLevel = Math.min(100, self.painLevel + 10);
      }

      self.description = await self.generateDescription();

      return {
        success: true,
        message: 'The wound has been stitched closed.',
      };
    `);

    // Get autopsy findings for this wound
    obj.setMethod('getAutopsyFindings', `
      /** Get forensic findings about this wound.
       *  @param examinerSkill - 0-100
       *  @param decay - Body decay level 0-100
       */
      const examinerSkill = args[0] || 50;
      const decay = args[1] || 0;
      const findings = [];

      const visibility = Math.max(0, 100 - decay);
      const canSeeDetail = (threshold) => (visibility + examinerSkill / 2) >= threshold;

      // Basic wound presence - easy to see
      if (canSeeDetail(20)) {
        findings.push(self.description || ('A ' + self.type + '.'));
      }

      // Wound age from tick
      if (canSeeDetail(60)) {
        const ticksSince = ($.tick || 0) - (self.inflictedTick || 0);
        if (ticksSince < 60) {
          findings.push('The wound appears recent.');
        } else if (ticksSince < 1440) {
          findings.push('The wound is hours old.');
        } else {
          findings.push('The wound is days old.');
        }
      }

      // Cause of wound
      if (canSeeDetail(50) && self.cause) {
        const causeDescriptions = {
          blade: 'The wound edges are clean, suggesting a bladed weapon.',
          blunt: 'The wound pattern suggests blunt force trauma.',
          claw: 'The wound has ragged edges consistent with claw marks.',
          bite: 'The wound pattern suggests a bite.',
          fire: 'The wound shows thermal damage.',
          acid: 'The wound shows chemical burns.',
        };
        if (causeDescriptions[self.cause]) {
          findings.push(causeDescriptions[self.cause]);
        }
      }

      // Infection visible
      if (canSeeDetail(40) && self.infected) {
        if (self.infectionType === 'septic') {
          findings.push('Signs of septic infection are present.');
        } else if (self.infectionType === 'necrotic') {
          findings.push('Necrotic tissue surrounds the wound.');
        } else {
          findings.push('The wound shows signs of bacterial infection.');
        }
      }

      // Treatment visible
      if (canSeeDetail(30)) {
        if (self.stitched) {
          findings.push('The wound was stitched.');
        }
        if (self.bandaged) {
          findings.push('Bandage remnants are present.');
        }
      }

      return findings;
    `);

    // Describe the wound for player viewing
    obj.setMethod('describe', `
      return self.description || await self.generateDescription();
    `);

    return obj;
  }
}
