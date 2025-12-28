import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the CallButton prototype
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
export class CallButtonBuilder {
  static readonly alias = 'callButton';
  static readonly parent = 'describable';

  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parent = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parent!,
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

    return obj;
  }
}
