import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Door prototype
 * Shared object for bidirectional access between rooms, used by exits and elevators.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Properties hold state with descriptions explaining meaning
 * - Abilities describe physics/rules as prose for AI interpretation
 * - canPass() provides simple property check for coded movement verbs
 * - AI narrator handles state transitions (unlock, pick, force) via abilities
 *
 * Properties:
 * - locked: Boolean - whether the door is locked
 * - open: Boolean - whether the door is swung open
 * - locks: Array of composable lock objects (each with their own abilities)
 * - lockDifficulty: Number - resistance to picking (1-10)
 * - durability: Number - structural integrity (0-100)
 * - material: String - what the door is made of
 */
export class DoorBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Door',
        description: 'A sturdy door between rooms.',
        locked: false,
        open: true,
        locks: [],
        lockDifficulty: 5,
        durability: 100,
        material: 'wood',
        autolockOnClose: false,
        // Abilities - physics rules for AI interpretation
        abilities: `Hinged door that swings open or closed. Passage blocked when 'open' is false or 'locked' is true.

UNLOCKING: If 'locks' array is empty, door can be unlocked freely. Otherwise, all locks in array must authorize the player (check each lock's abilities and verifiedUsers). May also have a 'code' property - correct code unlocks.

PICKING: Can be picked with thin rigid tools. Compare tool rigidity + player skill against 'lockDifficulty'. Success sets 'locked' to false.

FORCING: Can be forced open. Compare player strength against 'durability'. Success opens but damages door (reduce durability). May break if durability reaches 0.

CLOSING: Setting 'open' to false closes the door. If 'autolockOnClose' is true, also sets 'locked' to true.`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription('locked', "When true, door blocks passage and won't open without key, picking, or force");
    obj.setPropertyDescription('open', "When true, door is swung open allowing passage. When false, door is closed.");
    obj.setPropertyDescription('locks', "Array of lock objects. All must authorize player for unlock. Each lock has its own abilities and verifiedUsers.");
    obj.setPropertyDescription('lockDifficulty', "Resistance to picking, 1-10 scale. Higher = harder to pick.");
    obj.setPropertyDescription('durability', "Structural integrity 0-100. Forcing reduces it. At 0, door breaks.");
    obj.setPropertyDescription('material', "What door is made of. Wood splinters loudly, metal dents, glass shatters.");
    obj.setPropertyDescription('autolockOnClose', "If true, door automatically locks when closed.");

    // ═══════════════════════════════════════════════════════════════════
    // CODED INTERFACE - Simple property checks for infrastructure verbs
    // ═══════════════════════════════════════════════════════════════════

    // canPass() - Simple check for coded movement verbs
    // Returns true if passage is allowed, false if blocked
    // This is the ONLY method that coded movement needs to call
    obj.setMethod('canPass', `
      return self.open === true && self.locked !== true;
    `);

    // getBlockedReason() - Human-readable reason why passage is blocked
    // For movement verbs to show appropriate message
    obj.setMethod('getBlockedReason', `
      if (self.locked) {
        return 'The door is locked.';
      }
      if (!self.open) {
        return 'The door is closed.';
      }
      return null;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // LEGACY METHODS - Kept for backwards compatibility during transition
    // AI narrator should modify properties directly instead of calling these
    // ═══════════════════════════════════════════════════════════════════

    // canAccess - simplified, just reads properties
    obj.setMethod('canAccess', `
      if (self.locked) {
        return 'The door is locked.';
      }
      if (!self.open) {
        return 'The door is closed.';
      }
      return true;
    `);

    return obj;
  }
}
