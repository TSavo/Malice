import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * PhoneDb: singleton registry mapping numbers to phone objects.
 * Remains a singleton object (not a type) since there should only be one directory.
 */
export class PhoneDbBuilder implements Builder {
  static provides = ['phoneDb'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.phoneDb) {
      this.obj = $.phoneDb;
      return;
    }

    const parentObj = $.describable;
    if (!parentObj) throw new Error('PhoneDbBuilder: $describable not found');

    this.obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Phone Directory',
        description: 'Maps phone numbers to phone devices.',
        abilities: `Central registry mapping phone numbers to physical devices.

REGISTRATION: Phones register their number via register(number, phone).
Unregister via unregister(number) when phone is destroyed or reassigned.

LOOKUP: findPhoneByNumber(number) returns the phone object or null.
Used by phone system to route calls to physical devices.

PERSISTENCE: Registry survives server restarts. Numbers are strings
to support formats like "555-1234" or extension codes.`,
        registry: {}, // { number: phoneId }
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'register',
      `
      const number = args[0];
      const phone = args[1];
      if (!number || !phone) return 'number and phone required';
      const reg = self.registry || {};
      reg[number] = phone;
      self.registry = reg;
    `,
    );

    obj.setMethod(
      'unregister',
      `
      const number = args[0];
      if (!number) return;
      const reg = self.registry || {};
      delete reg[number];
      self.registry = reg;
    `,
    );

    obj.setMethod(
      'findPhoneByNumber',
      `
      const number = args[0];
      if (!number) return null;
      const reg = self.registry || {};
      return reg[number] || null;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    // Register in memory for immediate access
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'phoneDb', this.obj.id);
  }
}

// Self-register
registerBuilder(PhoneDbBuilder);
