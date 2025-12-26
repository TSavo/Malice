import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the SealedBox prototype
 * Tamper-proof containers for delivery jobs.
 *
 * Properties:
 * - Cannot be opened by players
 * - Has destination info (room ID or name)
 * - Can be picked up and carried
 * - Triggers hooks when deposited at correct location
 * - Tamper seal can be broken (fails delivery, consequences)
 */
export class SealedBoxBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Sealed Box',
        description: 'A white plastic case with black tamper strips and a barcode label. The seal is intact.',
        // Delivery info
        destinationId: null,      // Room ID where this should be delivered
        destinationName: null,    // Human-readable destination
        contents: null,           // What's inside (for description only, not accessible)
        // Tracking
        packageCode: null,        // Unique tracking code
        assignedTo: null,         // Player assigned to deliver
        assignedAt: null,         // ISO timestamp
        // Status
        sealed: true,             // Tamper seal intact
        delivered: false,         // Has been delivered
        // Weight for carrying
        weight: 2,                // kg

        abilities: `Tamper-proof container for courier delivery jobs.

SEALED: Cannot be opened by players. open() explains why. Contents are inaccessible until delivered.

TAMPERING: breakSeal() destroys the seal, voids delivery, triggers 'packageTampered' plot hook. Consequences for the courier.

DELIVERY: 'destinationId' is target room. onArrived() checks if destination reached. markDelivered() completes delivery, triggers 'packageDelivered' hook.

ASSIGNMENT: assign(player, destId, destName) assigns the delivery job. Generates tracking 'packageCode'.

TRACKING: 'packageCode' unique identifier. 'assignedTo' is courier, 'assignedAt' is assignment time.

PLOT HOOKS: Triggers 'packageTampered', 'packageDelivered', 'packageArrivedAtDestination' for story tracking.

WEIGHT: Packages have 'weight' for carrying mechanics.`,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // PREVENT OPENING
    // ═══════════════════════════════════════════════════════════════════

    // open() - cannot be opened
    obj.setMethod('open', `
      if (!self.sealed) {
        return 'The seal has already been broken. The box is empty.';
      }
      return 'The box is sealed with tamper-proof strips. Opening it would destroy the seal and void the delivery.';
    `);

    // breakSeal() - intentionally break the seal (consequences)
    obj.setMethod('breakSeal', `
      if (!self.sealed) {
        return { success: false, error: 'The seal is already broken.' };
      }

      self.sealed = false;
      self.description = 'A white plastic case with torn tamper strips. The seal has been broken. Whatever was inside is gone—or was never there.';

      // Trigger plot hooks for tampering
      await self.triggerPlotHooks('packageTampered', {
        packageCode: self.packageCode,
        tamperedBy: args[0]?.id || null,
        tamperedByName: args[0]?.name || 'unknown',
      });

      return {
        success: true,
        message: 'You break the tamper seal. The strips tear with a satisfying rip. The box is now worthless for delivery purposes.',
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DELIVERY
    // ═══════════════════════════════════════════════════════════════════

    // checkDeliveryLocation() - verify current location matches destination
    obj.setMethod('checkDeliveryLocation', `
      if (!self.destinationId) {
        return { valid: false, reason: 'No destination assigned.' };
      }

      const location = self.location;
      if (!location) {
        return { valid: false, reason: 'Box is not in a location.' };
      }

      const locId = typeof location === 'object' ? location.id : location;

      if (locId === self.destinationId) {
        return { valid: true };
      }

      return { valid: false, reason: 'Wrong location.' };
    `);

    // markDelivered() - mark as successfully delivered
    obj.setMethod('markDelivered', `
      if (self.delivered) {
        return { success: false, error: 'Already delivered.' };
      }

      if (!self.sealed) {
        return { success: false, error: 'Cannot deliver a tampered package.' };
      }

      self.delivered = true;

      // Trigger plot hooks for delivery
      await self.triggerPlotHooks('packageDelivered', {
        packageCode: self.packageCode,
        destinationId: self.destinationId,
        deliveredBy: args[0]?.id || null,
        deliveredByName: args[0]?.name || 'unknown',
      });

      return { success: true };
    `);

    // onArrived() - check if arrived at destination, trigger hooks
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      if (!dest || self.delivered) return;

      // Check if this is the destination
      const destId = typeof dest === 'object' ? dest.id : dest;

      if (destId === self.destinationId && self.sealed) {
        // Arrived at destination with seal intact
        await self.triggerPlotHooks('packageArrivedAtDestination', {
          packageCode: self.packageCode,
          destinationId: self.destinationId,
          deliveredBy: mover?.id || null,
          deliveredByName: mover?.name || 'unknown',
        });
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // ASSIGNMENT
    // ═══════════════════════════════════════════════════════════════════

    // assign(player, destinationId, destinationName) - assign delivery job
    obj.setMethod('assign', `
      const player = args[0];
      const destId = args[1];
      const destName = args[2];

      if (!player) {
        return { success: false, error: 'Player required.' };
      }

      self.assignedTo = player;
      self.assignedAt = new Date().toISOString();
      self.destinationId = destId;
      self.destinationName = destName || 'Unknown';

      // Generate tracking code if not set
      if (!self.packageCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'PKG-';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        self.packageCode = code;
      }

      return {
        success: true,
        packageCode: self.packageCode,
        destination: self.destinationName,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      let desc = self.name + '\\r\\n';
      desc += self.description + '\\r\\n';

      if (self.packageCode) {
        desc += '\\r\\nTracking: ' + self.packageCode;
      }

      if (self.destinationName && !self.delivered) {
        desc += '\\r\\nDestination: ' + self.destinationName;
      }

      if (self.delivered) {
        desc += '\\r\\nStatus: DELIVERED';
      } else if (!self.sealed) {
        desc += '\\r\\nStatus: TAMPERED - VOID';
      } else {
        desc += '\\r\\nStatus: In transit';
      }

      return desc;
    `);

    obj.setMethod('shortDesc', `
      if (self.delivered) {
        return 'delivered package';
      }
      if (!self.sealed) {
        return 'tampered package';
      }
      return 'sealed package' + (self.packageCode ? ' (' + self.packageCode + ')' : '');
    `);

    // Property descriptions
    obj.setPropertyDescription('destinationId', 'Room ID where package should be delivered (integer)');
    obj.setPropertyDescription('destinationName', 'Human-readable destination name (string)');
    obj.setPropertyDescription('packageCode', 'Unique tracking code (e.g., PKG-ABC123)');
    obj.setPropertyDescription('assignedTo', 'Player assigned to deliver this package (ObjRef)');
    obj.setPropertyDescription('assignedAt', 'ISO timestamp when package was assigned');
    obj.setPropertyDescription('sealed', 'Whether tamper seal is intact (boolean)');
    obj.setPropertyDescription('delivered', 'Whether package has been successfully delivered (boolean)');

    return obj;
  }
}
