import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the BiometricLock prototype
 * Scans body parts for authorization.
 *
 * Inherits from Lock.
 *
 * Properties:
 * - authorizedUsers: Map of target (e.g., floor number) to array of authorized player objects
 *   Example: { 1: [player1, player2], 35: [adminPlayer] }
 * - scannerType: Type of biometric scan ('retinal', 'fingerprint', 'palm', 'voice')
 * - requiredBodyPart: Body part needed for scan (e.g., 'eye', 'hand', 'head')
 *
 * Methods:
 * - canAccess(agent, target): Checks if agent has required body part and is authorized
 */
export class BiometricLockBuilder {
  constructor(private manager: ObjectManager) {}

  async build(lockId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: lockId,
      properties: {
        name: 'Biometric Lock',
        description: 'A biometric scanner with a red LED.',
        authorizedUsers: {}, // { target: [player objects] }
        scannerType: 'retinal', // 'retinal', 'fingerprint', 'palm', 'voice'
        requiredBodyPart: 'eye', // Body part needed
      },
      methods: {},
    });

    obj.setMethod('canAccess', `
      /** Check if agent can access target via biometric scan.
       *  @param agent - The agent requesting access
       *  @param target - The target (floor number, room, etc.)
       *  @returns true to allow, or rejection string to deny
       */
      const agent = args[0];
      const target = args[1];

      // Check if agent has required body part
      const requiredPart = self.requiredBodyPart;
      if (requiredPart && agent.bodyParts) {
        const parts = agent.bodyParts || {};
        let hasPart = false;

        // Check if agent has the required body part type
        for (const partName in parts) {
          const partId = parts[partName];
          const part = typeof partId === 'number' ? await $.load(partId) : partId;
          if (part && part.partType === requiredPart) {
            hasPart = true;
            break;
          }
        }

        if (!hasPart) {
          return 'Biometric scan failed: missing required body part.';
        }
      }

      // Check authorization list for this target
      const authorized = self.authorizedUsers[target] || [];
      
      // Check if agent is in authorized list
      if (!authorized.some(user => user === agent)) {
        return 'Access denied. Biometric signature not recognized.';
      }

      return true; // Authorized
    `);

    obj.setMethod('authorize', `
      /** Add a user to the authorized list for a target.
       *  @param user - Player object to authorize
       *  @param target - Target (floor, room, etc.)
       */
      const user = args[0];
      const target = args[1];

      const auth = self.authorizedUsers || {};
      if (!auth[target]) {
        auth[target] = [];
      }
      
      // Add if not already present
      if (!auth[target].some(u => u === user)) {
        auth[target].push(user);
      }
      
      self.authorizedUsers = auth;
    `);

    obj.setMethod('revoke', `
      /** Remove a user from the authorized list for a target.
       *  @param user - Player object to revoke
       *  @param target - Target (floor, room, etc.)
       */
      const user = args[0];
      const target = args[1];

      const auth = self.authorizedUsers || {};
      if (!auth[target]) return;

      auth[target] = auth[target].filter(u => u !== user);
      self.authorizedUsers = auth;
    `);

    return obj;
  }
}
