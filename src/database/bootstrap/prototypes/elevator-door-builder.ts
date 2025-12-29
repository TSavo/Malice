import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the ElevatorDoor prototype
 * A door that only allows passage when the elevator is present at this floor.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - canPass() checks elevator presence for coded movement verbs
 * - Abilities describe the door's behavior for AI interpretation
 *
 * Properties:
 * - elevator: objref - the elevator this door connects to
 * - floor: number - which floor this door is on
 */
export class ElevatorDoorBuilder {
  static readonly alias = 'elevatorDoor';
  static readonly parent = 'door';

  constructor(private manager: ObjectManager) {}

  async build(doorId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(doorId);
    const obj = await this.manager.create({
      parent: parent!,
      properties: {
        name: 'Elevator Doors',
        description:
          'Brushed steel elevator doors that slide open when the elevator arrives.',
        elevator: null,
        floor: 0,
        // Override door defaults - elevator doors are automatic
        locked: false,
        open: false, // Controlled by elevator presence, not manual
        abilities: `Automatic elevator doors that only open when elevator is present.

PASSAGE: Blocked unless elevator is at this floor with doors open.
Check: self.elevator?.currentFloor === self.floor AND self.elevator?.doorsOpen

AUTOMATIC: Doors slide open/closed with elevator arrival/departure.
Cannot be manually opened - controlled by elevator system.

FORCING: Heavy steel construction. Would require significant force or tools to pry open.
Even if forced, there may be no elevator car behind them (empty shaft).`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription(
      'elevator',
      'Reference to the elevator these doors connect to',
    );
    obj.setPropertyDescription('floor', 'The floor number these doors are on');

    // Override canPass to check elevator presence
    obj.setMethod(
      'canPass',
      `
      /** Check if passage through elevator doors is allowed.
       *  Only allows passage when elevator is at this floor with doors open.
       *  @returns boolean
       */
      if (!self.elevator) return false;
      return self.elevator.currentFloor === self.floor && self.elevator.doorsOpen === true;
    `,
    );

    // Override getBlockedReason for better feedback
    obj.setMethod(
      'getBlockedReason',
      `
      /** Return reason why passage is blocked.
       *  @returns string describing why doors won't open
       */
      if (!self.elevator) {
        return 'The elevator doors are sealed shut.';
      }
      if (self.elevator.currentFloor !== self.floor) {
        return 'The elevator is not at this floor.';
      }
      if (!self.elevator.doorsOpen) {
        return 'The elevator doors are closed.';
      }
      return 'The elevator doors block your path.';
    `,
    );

    return obj;
  }
}
