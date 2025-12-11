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
 * - scanners: Array of scan requirements
 *   Example: [
 *     { type: 'retinal', part: 'eye', message: 'Retinal scan failed.' },
 *     { type: 'fingerprint', part: 'hand', message: 'Fingerprint scan failed.' }
 *   ]
 * - legacy fields (scannerType, requiredBodyPart) are still supported for single-scan configs
 *
 * Methods:
 * - canAccess(agent, target): Checks required scans and authorization
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
         scannerType: 'retinal', // legacy single-scan type
         requiredBodyPart: 'eye', // legacy single-scan part
         scanners: [], // preferred multi-scan config: [{ type, part, message? }]
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
 
        // Helper: check a single scan requirement (including coverage)
        const runScan = async (scan) => {
          const requiredPart = scan?.part || self.requiredBodyPart;
          if (!requiredPart) return true;
 
          const parts = agent.bodyParts || {};
          let matchedPart = null;
          for (const partName in parts) {
            const partId = parts[partName];
            const part = typeof partId === 'number' ? await $.load(partId) : partId;
            if (part && part.partType === requiredPart) {
              matchedPart = part;
              break;
            }
          }
 
          if (!matchedPart) {
            return scan?.message || 'Biometric scan failed: missing required body part.';
          }
 
          // Check for clothing/coverage blocking the scan
          let wornItems = [];
          if (matchedPart.getWornItems) {
            wornItems = await matchedPart.getWornItems();
          } else if (Array.isArray(matchedPart.worn)) {
            for (const id of matchedPart.worn) {
              const item = await $.load(id);
              if (item) wornItems.push(item);
            }
          }
 
          if (wornItems.length > 0) {
            const outermost = wornItems[wornItems.length - 1];
            const blockerName = outermost?.name || 'clothing';
            return scan?.message || ('Biometric scan blocked by ' + blockerName + '.');
          }
 
          return true;
        };
 
        // Determine scans to run (prefer scanners[]; else legacy single scan)
        const scans = (self.scanners && self.scanners.length > 0)
          ? self.scanners
          : [{ type: self.scannerType, part: self.requiredBodyPart }];
 
        for (const scan of scans) {
          const result = await runScan(scan);
          if (result !== true) {
            return result;
          }
        }
 
        // Check authorization list for this target
        const authMap = self.authorizedUsers || {};
        const authorized = authMap[target];
 
        // If no list exists for this target, treat as unlocked after scans
        if (authorized === undefined) {
          return true;
        }
 
        if (!Array.isArray(authorized) || authorized.length === 0) {
          return 'Access denied. Biometric signature not recognized.';
        }
 
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
