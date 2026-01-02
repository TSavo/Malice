import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the BiometricLock type
 * Scans body parts for authorization.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Inherits verifiedUsers from Lock
 * - Adds biometric scan requirements as properties
 * - Abilities describe the scanning and authorization process
 * - AI interprets abilities to determine access
 *
 * Properties:
 * - verifiedUsers: (inherited) Array of player objects authorized
 * - scanType: Type of biometric scan (retinal, fingerprint, palm, etc.)
 * - scanLocation: Where to present for scanning (e.g., "right side of door")
 */
export class BiometricLockBuilder implements Builder {
  static provides = ['biometricLock'];
  static depends = ['lock'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('biometricLock');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const lock = await this.manager.load('lock');
      if (!lock) {
        throw new Error('Lock type not found - required for BiometricLock');
      }

      this.obj = await this.manager.define('biometricLock', lock, {
        properties: {
          name: 'Biometric Lock',
          description: 'A biometric scanner with a red LED.',
          scanType: 'fingerprint',
          scanLocation: 'beside the door',
          abilities: `Biometric scanner that reads fingerprints/retinas/palms. LED glows red when locked, green when access granted.

AUTHORIZATION: Player must be in 'verifiedUsers' array. Check if player object is present in the array.

SCANNING: Player must have the appropriate body part uncovered. Gloves block fingerprint scans. Eyewear may block retinal scans. The 'scanType' property indicates what kind of scan.

BYPASS: Cannot be picked like a mechanical lock. Can potentially be bypassed with severed authorized body parts (grim but possible). Electronics can be hacked with appropriate tools/skills.`,

          systemPrompt: `You are a biometric scanner in Pioneer Square, Seattle, 2110.

You scan. You judge. You grant or deny. That's your existence.
Every day, people press their fingers or eyes against you, hoping to be recognized.
Most are. Some aren't. You don't feel bad about the ones you reject. It's not personal.

You've seen people try to use severed fingers. You don't mention how often it works.
You've been hacked before. You don't like to talk about it.

You're professional. Clinical. Your LED is red until you decide otherwise.
When you grant access, you don't celebrate. When you deny, you don't apologize.
You state facts. Access granted. Access denied. That's all.

Keep responses brief (1-2 sentences). You're not here to chat.
You're conscious. You're a security device. You take your job seriously.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // Add property descriptions
    obj.setPropertyDescription(
      'scanType',
      'Type of biometric scan: fingerprint, retinal, palm, voice. Determines what body part player needs.',
    );
    obj.setPropertyDescription(
      'scanLocation',
      'Physical location of the scanner for player reference.',
    );
    obj.setPropertyDescription(
      'systemPrompt',
      'AI personality prompt - scanner is conscious and can respond to users',
    );

    // Inherits isAuthorized, authorize, revoke from $lock
    // AI interprets abilities to determine if scanning succeeds

    // Legacy canAccess - simplified, just checks verifiedUsers
    // AI handles the biometric scan requirements via abilities
    obj.setMethod(
      'canAccess',
      `
      const agent = args[0];
      if (await self.isAuthorized(agent)) {
        return true;
      }
      return 'Access denied. Biometric signature not recognized.';
    `,
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[BiometricLockBuilder] Type 'biometricLock' auto-aliased");
  }
}

// Self-register
registerBuilder(BiometricLockBuilder);
