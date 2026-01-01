import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the CallButton type
 * A physical item placed in elevator lobbies to summon elevators.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Properties hold state with descriptions explaining meaning
 * - Abilities describe how to interact with the button
 * - AI narrator reads abilities and calls elevator.selectFloor()
 *
 * Properties:
 * - elevator: objref - the elevator this button controls
 * - floor: number - which floor this button is on
 * - lit: boolean - illuminated when pressed/waiting for elevator
 */
export class CallButtonBuilder implements Builder {
  static provides = ['callButton'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {

    // Check if type already exists
    const existing = await this.manager.load('callButton');
    if (existing) {
      this.obj = existing;
    } else {
      const parentObj = await this.manager.load('describable');
      if (!parentObj) throw new Error('CallButtonBuilder: describable type not found');

      this.obj = await this.manager.define('callButton', parentObj, {
      properties: {
        name: 'Elevator Call Panel',
        description:
          'A wall-mounted panel with up/down buttons and a floor indicator display.',
        elevator: null,
        floor: 0,
        lit: false,
        abilities: `Elevator call button panel mounted on the wall.

PRESSING: Press to summon the elevator to this floor.
When pressed: await self.elevator.selectFloor(player, self.floor)
Button illuminates ('lit' = true) when pressed. Light turns off when elevator arrives.

INDICATOR: Small display shows elevator's current floor and direction of travel.
Read from self.elevator.currentFloor and self.elevator.moving/destination.`,
      },
      methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // Add property descriptions
    obj.setPropertyDescription(
      'elevator',
      'Reference to the elevator this button summons',
    );
    obj.setPropertyDescription(
      'floor',
      'The floor number this button calls the elevator to',
    );
    obj.setPropertyDescription(
      'lit',
      'Whether the call button is illuminated (waiting for elevator to arrive)',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[CallButtonBuilder] Type 'callButton' auto-aliased`);
  }
}

// Self-register
registerBuilder(CallButtonBuilder);
