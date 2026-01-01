import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the ElevatorDoor type
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
export class ElevatorDoorBuilder implements Builder {
  static provides = ['elevatorDoor'];
  static depends = ['door'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('elevatorDoor');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const door = await this.manager.load('door');
      if (!door) {
        throw new Error('Door type not found - required for ElevatorDoor');
      }

      this.obj = await this.manager.define('elevatorDoor', door, {
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
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

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
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    console.log("[ElevatorDoorBuilder] Type 'elevatorDoor' auto-aliased");
  }
}

// Self-register
registerBuilder(ElevatorDoorBuilder);
