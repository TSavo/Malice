import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Vendable: a vending container that sells items in its contents.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Abilities describe how vending works as prose for AI interpretation
 * - AI reads available items via getAvailableItems(), picks one, calls buyItem()
 * - Legacy vend() with $.prompt still works for direct interaction
 * - Payment handled via $bank (credits) or $cash (physical money)
 */
export class VendableBuilder {
  static readonly alias = 'vendable';
  static readonly parent = 'location';

  constructor(private manager: ObjectManager) {}

  async build(locationId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(locationId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Vendable',
        description: 'A vending container that sells the items it holds.',
        bankAccount: null, // target account ID to receive funds (for credits mode)
        bank: null, // bank object id/alias
        currency: 'credits', // 'cash' or 'credits' - payment method
        operator: null, // who receives cash payments (if currency='cash')
        defaultPrice: 0,
        owner: null, // agent id that can manage stock/prices
        locks: [], // optional composable locks controlling manage access
        spawnables: [], // [{ protoId, price, name, properties, randomize, autoNumber, numberPrefix }]
        // randomize: { propertyName: [option1, option2, ...] } - picks random value
        phoneDb: null, // optional phone directory to use for phone sales
        // Abilities - vending physics for AI interpretation
        abilities: `Automated vendor that dispenses items for payment.

BROWSING: Check 'contents' for physical items in stock, 'spawnables' for items created on demand. Each has a price. Use getAvailableItems() to get full list with prices.

PAYMENT MODES: Check 'currency' property to see how this vendor accepts payment:
- 'credits': Uses $bank. Transfers from buyer's bank account to vendor's 'bankAccount'. Legal, traceable.
- 'cash': Uses $cash. Takes physical dollars from buyer, gives to 'operator' (or machine keeps it). Contraband, anonymous.

TO BUY: Call buyItem(buyer, itemNameOrIndex) with the buyer and what they want. Handles payment automatically based on 'currency' setting. Returns { success, item, message } or { success: false, error }.

CHECKING FUNDS: Before buying, AI can verify buyer has funds:
- Credits: $bank.getAccountByOwner(buyer) then check balance
- Cash: $cash.has(buyer, price)

MANAGEMENT: Owner can stock items, set prices, configure spawnables. Requires passing any 'locks' on the machine.

SPAWNABLES: Some vendors create items on demand from templates. These never run out but are created fresh each purchase.`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription(
      'contents',
      'Physical items currently in stock. Each can be purchased once.',
    );
    obj.setPropertyDescription(
      'spawnables',
      'Templates for items created on demand. Never runs out.',
    );
    obj.setPropertyDescription(
      'currency',
      "'credits' for bank transfer, 'cash' for physical money.",
    );
    obj.setPropertyDescription(
      'defaultPrice',
      'Price for items without individual pricing.',
    );
    obj.setPropertyDescription(
      'bankAccount',
      'Account ID receiving credit payments.',
    );
    obj.setPropertyDescription(
      'operator',
      'Agent receiving cash payments (or null = machine keeps it).',
    );

    obj.setMethod(
      'listItems',
      `
      const viewer = args[0];
      const contents = self.contents || [];
      const currency = self.currency || 'credits';
      if (!contents.length) return 'This vendor is empty.';
      let out = 'Available items:\\n';
      for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        if (!item) continue;
        const price = item.price ?? self.defaultPrice ?? 0;
        const priceStr = currency === 'cash' ? '$' + price : price + ' cr';
        out += \`  \${i + 1}) \${item.name || 'Item'} - \${priceStr}\\n\`;
      }
      return out.trim();
    `,
    );

    // AI-callable: get structured list of available items
    obj.setMethod(
      'getAvailableItems',
      `
      /** Get all items available for purchase with prices.
       *  Use this to see what can be bought before calling buyItem().
       *  @returns Array of { index, name, price, type: 'stock'|'spawnable' }
       */
      const currency = self.currency || 'credits';
      const contents = self.contents || [];
      const spawnables = self.spawnables || [];
      const items = [];

      for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        if (!item) continue;
        const price = item.price ?? self.defaultPrice ?? 0;
        items.push({
          index: i + 1,
          name: item.name || 'Item',
          price,
          priceDisplay: currency === 'cash' ? '$' + price : price + ' credits',
          type: 'stock',
        });
      }

      for (let i = 0; i < spawnables.length; i++) {
        const spawn = spawnables[i];
        const price = spawn.price ?? self.defaultPrice ?? 0;
        items.push({
          index: contents.length + i + 1,
          name: spawn.name || 'Item',
          price,
          priceDisplay: currency === 'cash' ? '$' + price : price + ' credits',
          type: 'spawnable',
        });
      }

      return items;
    `,
    );

    // AI-callable: purchase a specific item by name or index
    obj.setMethod(
      'buyItem',
      `
      /** Purchase a specific item from this vendor.
       *  Handles payment automatically based on currency setting.
       *  @param buyer - The agent making the purchase
       *  @param selection - Item name (string) or index number
       *  @returns { success, item, message } or { success: false, error }
       */
      const buyer = args[0];
      const selection = args[1];

      if (!buyer) return { success: false, error: 'No buyer specified.' };
      if (selection === undefined) return { success: false, error: 'No item specified.' };

      const currency = self.currency || 'credits';
      const bank = self.bank || $.bank || null;
      const account = self.bankAccount;
      const contents = self.contents || [];
      const spawnables = self.spawnables || [];

      // Build unified item list
      const saleItems = [];
      for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        if (!item) continue;
        saleItems.push({ type: 'existing', item, price: item.price ?? self.defaultPrice ?? 0, index: i });
      }
      for (let i = 0; i < spawnables.length; i++) {
        const spawn = spawnables[i];
        saleItems.push({ type: 'spawn', spawn, price: spawn.price ?? self.defaultPrice ?? 0, index: i, name: spawn.name || 'Item' });
      }

      if (!saleItems.length) return { success: false, error: 'Out of stock.' };

      // Find the requested item
      let selected = null;
      if (typeof selection === 'number') {
        // By index (1-based)
        if (selection >= 1 && selection <= saleItems.length) {
          selected = saleItems[selection - 1];
        }
      } else if (typeof selection === 'string') {
        // By name (case-insensitive partial match)
        const searchLower = selection.toLowerCase();
        selected = saleItems.find(s => {
          const name = s.type === 'spawn' ? s.name : (s.item?.name || '');
          return name.toLowerCase().includes(searchLower);
        });
      }

      if (!selected) return { success: false, error: 'Item not found: ' + selection };

      const price = selected.price;
      const label = selected.type === 'spawn' ? selected.name : (selected.item?.name || 'item');
      const priceStr = currency === 'cash' ? '$' + price : price + ' credits';

      // Process payment
      if (currency === 'credits') {
        if (!bank || !account) return { success: false, error: 'Vendor not configured for credit payments.' };
        const buyerAccounts = await bank.getAccountByOwner(buyer);
        if (!buyerAccounts || !buyerAccounts.length) return { success: false, error: 'You have no bank account.' };
        const buyerAccountId = buyerAccounts[0].accountId;
        const tx = await bank.transfer(buyerAccountId, account, price, 'vend-' + Date.now(), 'Vending purchase');
        if (!tx?.success) return { success: false, error: tx?.error || 'Payment failed.' };
      } else {
        if (!$cash) return { success: false, error: 'Cash system unavailable.' };
        const takeResult = await $cash.take(buyer, price);
        if (!takeResult.success) return { success: false, error: takeResult.message };
        const operator = self.operator;
        if (operator) {
          await $cash.give(operator, price);
        }
      }

      // Deliver the item
      let deliveredItem = null;

      if (selected.type === 'existing') {
        const { item, index } = selected;
        const newContents = [...contents];
        newContents.splice(index, 1);
        self.contents = newContents;
        deliveredItem = item;
      } else {
        const spawn = selected.spawn;
        const protoId = spawn.protoId || spawn.prototype || null;
        if (!protoId) return { success: false, error: 'Spawn config missing prototype.' };
        if (!$.recycler) return { success: false, error: 'Spawner unavailable.' };
        const properties = { ...(spawn.properties || {}) };

        // Apply randomized properties
        const randomize = spawn.randomize || {};
        for (const key of Object.keys(randomize)) {
          const options = randomize[key];
          if (Array.isArray(options) && options.length > 0) {
            properties[key] = options[Math.floor(Math.random() * options.length)];
          }
        }

        // Auto-assign phone number if requested
        if (spawn.autoNumber && self.phoneDb) {
          const db = self.phoneDb;
          if (!db || !db.register) return { success: false, error: 'Phone directory unavailable.' };
          const prefix = spawn.numberPrefix || '';
          const number = prefix + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
          properties.number = number;
          properties.phoneDb = db;
          deliveredItem = await $.recycler.create({ parent: protoId, properties }, buyer);
          await db.register(number, deliveredItem);
        } else {
          deliveredItem = await $.recycler.create({ parent: protoId, properties }, buyer);
        }
      }

      if (!deliveredItem) return { success: false, error: 'Delivery failed.' };

      // Move to buyer
      await deliveredItem.moveTo(buyer);

      return {
        success: true,
        item: deliveredItem,
        message: 'You buy ' + (deliveredItem.name || 'the item') + ' for ' + priceStr + '.',
      };
    `,
    );

    // Legacy interactive vend - still works for direct "use vending machine" interaction
    obj.setMethod(
      'vend',
      `
      const buyer = args[0];
      if (!buyer) return 'No buyer specified.';

      const currency = self.currency || 'credits';
      const bank = self.bank || $.bank || null;
      const account = self.bankAccount;
      
      // Validate payment configuration
      if (currency === 'credits') {
        if (!bank || !account) return 'Vendor is not configured for credit payments.';
      }
      // Cash mode doesn't require bank config

      const contents = self.contents || [];
      const spawnables = self.spawnables || [];
      if (!contents.length && !spawnables.length) return 'Out of stock.';

      // Build menu across physical contents and spawnables
      let menu = 'What do you want to buy?\\n';
      const saleItems = [];
      for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        if (!item) continue;
        const price = item.price ?? self.defaultPrice ?? 0;
        const priceStr = currency === 'cash' ? '$' + price : price + ' cr';
        saleItems.push({ type: 'existing', item, price, index: i });
        menu += \`  \${saleItems.length}) \${item.name || 'Item'} - \${priceStr}\\n\`;
      }
      for (let i = 0; i < spawnables.length; i++) {
        const spawn = spawnables[i];
        const price = spawn.price ?? self.defaultPrice ?? 0;
        const priceStr = currency === 'cash' ? '$' + price : price + ' cr';
        const name = spawn.name || 'Spawned Item';
        saleItems.push({ type: 'spawn', spawn, price, index: i });
        menu += \`  \${saleItems.length}) \${name} - \${priceStr}\\n\`;
      }
      if (!saleItems.length) return 'Nothing for sale.';

      // Prompt selection
      const choiceRaw = await $.prompt(buyer, menu.trim() + '\\nEnter number:');
      const choice = Number(choiceRaw);
      if (!Number.isInteger(choice) || choice < 1 || choice > saleItems.length) {
        return 'Invalid selection.';
      }

      const selected = saleItems[choice - 1];
      const price = selected.price;
      const label = selected.type === 'spawn' ? (selected.spawn.name || 'item') : (selected.item.name || 'item');
      const priceStr = currency === 'cash' ? '$' + price : price + ' credits';
      const confirm = await $.prompt(buyer, \`Buy \${label} for \${priceStr}? (y/n)\`);
      if ((confirm || '').toLowerCase()[0] !== 'y') return 'Cancelled.';

      // Process payment based on currency mode
      if (currency === 'credits') {
        // Bank transfer
        const buyerAccounts = await bank.getAccountByOwner(buyer);
        if (!buyerAccounts || !buyerAccounts.length) return 'You have no bank account.';
        const buyerAccountId = buyerAccounts[0].accountId;

        const tx = await bank.transfer(buyerAccountId, account, price, \`vend-\${Date.now()}\`, 'Vending purchase');
        if (!tx?.success) return tx?.error || 'Payment failed.';
      } else {
        // Cash payment via $cash utility
        if (!$cash) return 'Cash system unavailable.';

        const takeResult = await $cash.take(buyer, price);
        if (!takeResult.success) return takeResult.message;

        // Give cash to operator if configured
        const operator = self.operator;
        if (operator) {
          await $cash.give(operator, price);
        }
        // If no operator, cash is burned (machine keeps it)
      }

      let deliveredItem = null;

      if (selected.type === 'existing') {
        const { item, index } = selected;
        // Remove from vendor contents and reparent item to buyer inventory
        const newContents = [...contents];
        newContents.splice(index, 1);
        self.contents = newContents;
        deliveredItem = item;
      } else {
        const spawn = selected.spawn;
        const protoId = spawn.protoId || spawn.prototype || null;
        if (!protoId) return 'Spawn config missing prototype.';
        if (!$.recycler) return 'Spawner unavailable.';
        const properties = { ...(spawn.properties || {}) };

        // Apply randomized properties
        const randomize = spawn.randomize || {};
        for (const key of Object.keys(randomize)) {
          const options = randomize[key];
          if (Array.isArray(options) && options.length > 0) {
            properties[key] = options[Math.floor(Math.random() * options.length)];
          }
        }

        // Auto-assign phone number if requested
        if (spawn.autoNumber && self.phoneDb) {
          const db = self.phoneDb;
          if (!db || !db.register) return 'Phone directory unavailable.';
          const prefix = spawn.numberPrefix || '';
          const number = prefix + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
          properties.number = number;
          properties.phoneDb = db;
          const obj = await $.recycler.create({ parent: protoId, properties }, buyer);
          await db.register(number, obj);
          deliveredItem = obj;
        } else {
          deliveredItem = await $.recycler.create({ parent: protoId, properties }, buyer);
        }
      }

      if (!deliveredItem) return 'Delivery failed.';

      const inv = Array.isArray(buyer.inventory) ? [...buyer.inventory] : [];
      inv.push(deliveredItem);
      buyer.inventory = inv;
      await deliveredItem.moveTo(buyer);

      return \`You buy \${deliveredItem.name || 'the item'} for \${priceStr}.\`;
    `,
    );

    // Owner management: stock and set prices using prompts/menus
    obj.setMethod(
      'manage',
      `
      const actor = args[0];
      if (!actor) return 'No actor provided.';

      // Enforce composable locks before allowing management (ownership is handled by locks)
      const locks = Array.isArray(self.locks) ? self.locks : [];
      for (const lock of locks) {
        if (!lock || !lock.canAccess) continue;
        const result = await lock.canAccess(actor, self);
        if (result !== true) return result;
      }

      const contents = self.contents || [];
      const currency = self.currency || 'credits';
      const operator = self.operator;
      
      // Build current status
      let status = '=== CURRENT CONFIG ===\\n';
      status += 'Currency: ' + (currency === 'cash' ? 'CASH' : 'CREDITS') + '\\n';
      if (currency === 'cash') {
        status += 'Cash goes to: ' + (operator ? (operator.name || 'someone') : '(machine keeps it)') + '\\n';
      } else {
        status += 'Bank account: ' + (self.bankAccount || '(not set)') + '\\n';
      }
      status += 'Default price: ' + (self.defaultPrice ?? 0) + '\\n';
      status += 'Items stocked: ' + contents.length + '\\n';
      
      const menu = status + '\\nManage vending machine:\\n' +
        '  1) Stock from inventory\\n' +
        '  2) Set price for item\\n' +
        '  3) Set default price\\n' +
        '  4) Set currency (cash/credits)\\n' +
        '  5) Set payment destination\\n' +
        '  6) Configure spawnables\\n' +
        '  7) Exit';
      const choiceRaw = await $.prompt(actor, menu + '\\nChoose:');
      const choice = Number(choiceRaw);


      if (choice === 1) {
        // Move an item from owner inventory into machine
        const inv = Array.isArray(actor.inventory) ? actor.inventory : [];
        if (!inv.length) return 'You have no items to stock.';
        let invMenu = 'Pick item to stock:\n';
        const items = [];
        for (let i = 0; i < inv.length; i++) {
          const itm = inv[i];
          if (!itm) continue;
          items.push(itm);
          invMenu += \`  \${items.length}) \${itm.name || 'Item'}\n\`;
        }
        if (!items.length) return 'You have no items to stock.';
        const pickRaw = await $.prompt(actor, invMenu.trim() + '\nEnter number:');
        const pick = Number(pickRaw);
        if (!Number.isInteger(pick) || pick < 1 || pick > items.length) return 'Invalid selection.';
        const itm = items[pick - 1];
        // remove from actor inventory
        const newInv = inv.filter(obj => obj !== itm);
        actor.inventory = newInv;
        // add to vendor contents
        const newContents = Array.isArray(self.contents) ? [...self.contents] : [];
        newContents.push(itm);
        self.contents = newContents;
        await itm.moveTo(self);
        return \`\${itm.name || 'Item'} stocked.\`;
      }

      if (choice === 2) {
        const items = Array.isArray(self.contents) ? self.contents : [];
        if (!items.length) return 'No items to price.';
        let m = 'Pick item to price:\n';
        const loaded = [];
        for (let i = 0; i < items.length; i++) {
          const itm = items[i];
          if (!itm) continue;
          loaded.push(itm);
          m += \`  \${loaded.length}) \${itm.name || 'Item'} (current: \${itm.price ?? 'unset'})\n\`;
        }
        if (!loaded.length) return 'No items to price.';
        const pickRaw = await $.prompt(actor, m.trim() + '\nEnter number:');
        const pick = Number(pickRaw);
        if (!Number.isInteger(pick) || pick < 1 || pick > loaded.length) return 'Invalid selection.';
        const itm = loaded[pick - 1];
        const priceRaw = await $.prompt(actor, 'Enter new price:');
        const price = Number(priceRaw);
        if (!Number.isFinite(price) || price < 0) return 'Invalid price.';
        itm.price = price;
        return \`\${itm.name || 'Item'} priced at \${price}.\`;
      }

      if (choice === 3) {
        const priceRaw = await $.prompt(actor, 'Enter default price:');
        const price = Number(priceRaw);
        if (!Number.isFinite(price) || price < 0) return 'Invalid price.';
        self.defaultPrice = price;
        return \`Default price set to \${price}.\`;
      }

      if (choice === 4) {
        // Set currency type
        const currentCurrency = self.currency || 'credits';
        const currMenu = 'Select payment method (current: ' + currentCurrency + '):\\n' +
          '  1) Cash (physical dollars)\\n' +
          '  2) Credits (bank transfer)';
        
        const currRaw = await $.prompt(actor, currMenu + '\\nChoose:');
        const currChoice = Number(currRaw);
        
        if (currChoice === 1) {
          self.currency = 'cash';
          return 'Currency set to CASH. Customers pay with physical dollars.';
        } else if (currChoice === 2) {
          self.currency = 'credits';
          return 'Currency set to CREDITS. Customers pay via bank transfer.';
        } else {
          return 'Cancelled.';
        }
      }

      if (choice === 5) {
        // Set payment destination (operator for cash, bank account for credits)
        const currencyMode = self.currency || 'credits';
        
        if (currencyMode === 'cash') {
          // Set cash operator
          const currentOp = self.operator;
          let prompt = 'Who should receive cash payments?\\n';
          prompt += '  1) Me (' + actor.name + ')\\n';
          prompt += '  2) No one (machine keeps it)';
          if (currentOp) {
            prompt += '\\n\\nCurrently: ' + (currentOp.name || 'someone');
          }
          
          const opRaw = await $.prompt(actor, prompt + '\\nChoose:');
          const opChoice = Number(opRaw);
          
          if (opChoice === 1) {
            self.operator = actor;
            return 'You will now receive cash payments.';
          } else if (opChoice === 2) {
            self.operator = null;
            return 'Machine will keep cash payments.';
          } else {
            return 'Cancelled.';
          }
        } else {
          // Set bank account for credits
          const currentAcct = self.bankAccount;
          await actor.tell('Current bank account: ' + (currentAcct || '(not set)'));
          
          const acct = await $.prompt(actor, 'Enter bank account ID to receive credits:');
          if (!acct || acct.trim() === '') return 'Cancelled.';
          
          self.bankAccount = acct.trim();
          
          // Optionally update bank reference
          const bankRef = await $.prompt(actor, 'Bank object alias (blank to use default $.bank):');
          if (bankRef && bankRef.trim() !== '') {
            self.bank = bankRef.trim();
          }
          
          return 'Bank account set to ' + acct.trim() + '.';
        }
      }

      if (choice === 6) {
        const isBuilder = !!(actor.isWizard || actor.canBuild);
        if (!isBuilder) return 'Only builders/admins can configure spawnables.';

        const spawnables = Array.isArray(self.spawnables) ? [...self.spawnables] : [];
        const actionMenu = 'Spawnables:\n' +
          '  1) List\n' +
          '  2) Add\n' +
          '  3) Remove\n' +
          '  4) Back';
        const actRaw = await $.prompt(actor, actionMenu + '\nChoose:');
        const act = Number(actRaw);
        if (act === 1) {
          if (!spawnables.length) return 'No spawnables configured.';
          let out = 'Configured spawnables:\n';
          for (let i = 0; i < spawnables.length; i++) {
            const s = spawnables[i];
            out += \`  \${i + 1}) \${s.name || 'Item'} proto=\${s.protoId || s.prototype} price=\${s.price ?? self.defaultPrice ?? 0}\`;
            if (s.autoNumber) out += ' autoNumber';
            out += '\n';
          }
          return out.trim();
        }
        if (act === 2) {
          const protoRaw = await $.prompt(actor, 'Prototype id/alias:');
          if (!protoRaw) return 'Cancelled.';
          const protoId = Number(protoRaw) || protoRaw;
          const name = await $.prompt(actor, 'Display name (blank=prototype name):');
          const priceRaw = await $.prompt(actor, 'Price (blank=default):');
          const price = priceRaw === '' ? null : Number(priceRaw);
          if (price !== null && (!Number.isFinite(price) || price < 0)) return 'Invalid price.';
          const autoNumberRaw = await $.prompt(actor, 'Auto-assign phone number? (y/n):');
          const autoNumber = (autoNumberRaw || '').toLowerCase().startsWith('y');
          const numberPrefix = autoNumber ? await $.prompt(actor, 'Number prefix (blank=none):') : '';
          spawnables.push({ protoId, name: name || undefined, price: price ?? undefined, autoNumber, numberPrefix: numberPrefix || undefined });
          self.spawnables = spawnables;
          return 'Spawnable added.';
        }
        if (act === 3) {
          if (!spawnables.length) return 'No spawnables to remove.';
          let out = 'Remove which?\n';
          for (let i = 0; i < spawnables.length; i++) {
            const s = spawnables[i];
            out += \`  \${i + 1}) \${s.name || 'Item'}\n\`;
          }
          const idxRaw = await $.prompt(actor, out.trim() + '\nEnter number:');
          const idx = Number(idxRaw);
          if (!Number.isInteger(idx) || idx < 1 || idx > spawnables.length) return 'Invalid selection.';
          spawnables.splice(idx - 1, 1);
          self.spawnables = spawnables;
          return 'Removed.';
        }
        return 'Exited spawnables.';
      }

      return 'Exited management.';
    `,
    );

    return obj;
  }
}
