import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

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
    console.log('[BiometricLockBuilder] Type \'biometricLock\' auto-aliased');
  }
}

// Self-register
registerBuilder(BiometricLockBuilder);
