import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Incinerator prototype
 * A disposal unit that burns items. Inherits from Disposal.
 *
 * Properties (inherited + new):
 * - temperature: Operating temperature in degrees
 * - fuelLevel: Current fuel level (0-100)
 * - fuelConsumption: Fuel used per item burned
 * - ashProduction: Whether burning produces ash
 * - operational: Whether the incinerator is currently operational
 *
 * Methods:
 * - burn(agent, item): Burn an item (alias for deposit)
 * - ignite(agent): Turn on the incinerator
 * - extinguish(agent): Turn off the incinerator
 */
export class IncineratorBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Incinerator',
        description: 'An industrial incinerator, its metal housing radiating heat.',
        destroyMessage: 'The item catches fire and is reduced to ash in seconds.',
        temperature: 1200,
        fuelLevel: 100,
        fuelConsumption: 1,
        ashProduction: false,
        operational: true,
        processingTime: 0,
        capacity: 0,
        acceptedTypes: [],
        rejectedTypes: [],

        abilities: `High-temperature disposal unit. Burns items to ash. Extends $.disposal.

OPERATION: 'operational' must be true to burn. ignite() turns on, extinguish() turns off.

FUEL: 'fuelLevel' 0-100. Each item consumes 'fuelConsumption'. Out of fuel = can't burn.

TEMPERATURE: 'temperature' degrees. Affects what can be destroyed. Higher temps destroy more materials.

BURNING: burn()/deposit() instantly destroys item if operational and fueled. Emits 'itemBurned' event.

EVIDENCE DESTRUCTION: Perfect for disposing of incriminating items. Leaves no trace (unless ashProduction enabled).

VERBS: 'burn/incinerate/deposit/put/throw %o in %i', 'ignite/light %i', 'extinguish/turn off %i'.`,
      },
      methods: {},
    });

    obj.setMethod('deposit', `
      /** Burn an item in the incinerator. Overrides disposal deposit. */
      const agent = args[0];
      const item = args[1];

      if (!item) {
        return { success: false, message: 'Burn what?' };
      }

      // Check if operational
      if (!self.operational) {
        return { success: false, message: 'The incinerator is not operational. It needs to be ignited first.' };
      }

      // Check fuel
      if (self.fuelLevel <= 0) {
        return { success: false, message: 'The incinerator is out of fuel.' };
      }

      // Check if we can accept this item
      const canAccept = await self.canAccept(item);
      if (!canAccept) {
        return { success: false, message: 'This incinerator cannot burn that type of item.' };
      }

      // Remove item from agent's inventory
      if (agent.removeFromInventory) {
        await agent.removeFromInventory(item);
      } else if (agent.location && agent.location.removeContent) {
        await agent.location.removeContent(item);
      }

      // Consume fuel
      self.fuelLevel = Math.max(0, self.fuelLevel - self.fuelConsumption);

      // Recycle the item
      if ($.recycler && $.recycler.recycle) {
        await $.recycler.recycle(item);
      }

      // Emit event for any hooks
      if (self.emit) {
        await self.emit('itemBurned', { item: item, agent: agent });
      }

      const message = self.destroyMessage || 'The item catches fire and is reduced to ash.';
      return { success: true, message: message };
    `);

    obj.setMethod('burn', `
      /** Alias for deposit - burn an item. */
      return await self.deposit(args[0], args[1]);
    `);

    obj.setMethod('ignite', `
      /** Turn on the incinerator. */
      const agent = args[0];

      if (self.operational) {
        return { success: false, message: 'The incinerator is already running.' };
      }

      if (self.fuelLevel <= 0) {
        return { success: false, message: 'The incinerator is out of fuel.' };
      }

      self.operational = true;
      return { success: true, message: 'You ignite the incinerator. Flames roar to life inside the chamber.' };
    `);

    obj.setMethod('extinguish', `
      /** Turn off the incinerator. */
      const agent = args[0];

      if (!self.operational) {
        return { success: false, message: 'The incinerator is already off.' };
      }

      self.operational = false;
      return { success: true, message: 'You shut down the incinerator. The flames die down.' };
    `);

    obj.setMethod('describe', `
      /** Override describe to show operational status. */
      let desc = self.description || 'An incinerator.';

      if (self.operational) {
        desc += ' The chamber glows with intense heat, flames visible through the inspection window.';
      } else {
        desc += ' The chamber is dark and cold.';
      }

      if (self.fuelLevel <= 10) {
        desc += ' A warning light indicates low fuel.';
      }

      return desc;
    `);

    // Add property descriptions
    obj.setPropertyDescription('temperature', 'Operating temperature in degrees (affects what materials can be destroyed)');
    obj.setPropertyDescription('fuelLevel', 'Current fuel level from 0-100');
    obj.setPropertyDescription('fuelConsumption', 'Amount of fuel consumed per item burned');
    obj.setPropertyDescription('ashProduction', 'Whether burning items produces ash residue');
    obj.setPropertyDescription('operational', 'Whether the incinerator is currently ignited and functional');

    return obj;
  }
}
