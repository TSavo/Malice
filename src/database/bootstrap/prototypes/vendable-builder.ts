import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Vendable: a vending container that sells items in its contents.
 * Uses $.prompt for selection/confirmation, $.bank for payment, and $.recycler to issue receipts.
 */
export class VendableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(locationId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: locationId,
      properties: {
         name: 'Vendable',
         description: 'A vending container that sells the items it holds.',
         bankAccount: null, // target account ID to receive funds
         bank: null, // bank object id/alias
         defaultPrice: 0,
         owner: null, // agent id that can manage stock/prices
         locks: [], // optional composable locks controlling manage access
         spawnables: [], // [{ protoId, price, name, properties, autoNumber, numberPrefix }]
         phoneDb: null, // optional phone directory to use for phone sales
       },
       methods: {},
     });


    obj.setMethod('listItems', `
      const viewer = args[0];
      const contents = self.contents || [];
      if (!contents.length) return 'This vendor is empty.';
      let out = 'Available items:\n';
      for (let i = 0; i < contents.length; i++) {
        const item = await $.load(contents[i]);
        if (!item) continue;
        const price = item.price ?? self.defaultPrice ?? 0;
        out += \`  \${i + 1}) \${item.name || 'Item'} - \${price}\n\`;
      }
      return out.trim();
    `);

    obj.setMethod('vend', `
      const buyer = args[0];
      if (!buyer) return 'No buyer specified.';

      const bank = self.bank ? await $.load(self.bank) : ($.bank || null);
      const account = self.bankAccount;
      if (!bank || !account) return 'Vendor is not configured for payments.';

      const contents = self.contents || [];
      const spawnables = self.spawnables || [];
      if (!contents.length && !spawnables.length) return 'Out of stock.';

      // Build menu across physical contents and spawnables
      let menu = 'What do you want to buy?\n';
      const saleItems = [];
      for (let i = 0; i < contents.length; i++) {
        const item = await $.load(contents[i]);
        if (!item) continue;
        const price = item.price ?? self.defaultPrice ?? 0;
        saleItems.push({ type: 'existing', item, price, index: i });
        menu += \`  \${saleItems.length}) \${item.name || 'Item'} - \${price}\n\`;
      }
      for (let i = 0; i < spawnables.length; i++) {
        const spawn = spawnables[i];
        const price = spawn.price ?? self.defaultPrice ?? 0;
        const name = spawn.name || 'Spawned Item';
        saleItems.push({ type: 'spawn', spawn, price, index: i });
        menu += \`  \${saleItems.length}) \${name} - \${price}\n\`;
      }
      if (!saleItems.length) return 'Nothing for sale.';

      // Prompt selection
      const choiceRaw = await $.prompt(buyer, menu.trim() + '\nEnter number:');
      const choice = Number(choiceRaw);
      if (!Number.isInteger(choice) || choice < 1 || choice > saleItems.length) {
        return 'Invalid selection.';
      }

      const selected = saleItems[choice - 1];
      const price = selected.price;
      const label = selected.type === 'spawn' ? (selected.spawn.name || 'item') : (selected.item.name || 'item');
      const confirm = await $.prompt(buyer, \`Buy \${label} for \${price}? (y/n)\`);
      if ((confirm || '').toLowerCase()[0] !== 'y') return 'Cancelled.';

      // Locate buyer account
      const buyerAccounts = await bank.getAccountByOwner(buyer);
      if (!buyerAccounts || !buyerAccounts.length) return 'You have no bank account.';
      const buyerAccountId = buyerAccounts[0].accountId;

      const tx = await bank.transfer(buyerAccountId, account, price, \`vend-${Date.now()}\`, 'Vending purchase');
      if (!tx?.success) return tx?.error || 'Payment failed.';

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

        // Auto-assign phone number if requested
        if (spawn.autoNumber && self.phoneDb) {
          const db = await $.load(self.phoneDb);
          if (!db || !db.register) return 'Phone directory unavailable.';
          const prefix = spawn.numberPrefix || '';
          const number = prefix + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
          properties.number = number;
          properties.phoneDb = db.id;
          const obj = await $.recycler.create({ parent: protoId, properties }, buyer);
          await db.register(number, obj);
          deliveredItem = obj;
        } else {
          deliveredItem = await $.recycler.create({ parent: protoId, properties }, buyer);
        }
      }

      if (!deliveredItem) return 'Delivery failed.';

      const inv = Array.isArray(buyer.inventory) ? [...buyer.inventory] : [];
      inv.push(deliveredItem.id);
      buyer.inventory = inv;
      deliveredItem.location = buyer.id;

      return \`You buy \${deliveredItem.name || 'the item'} for \${price}.\`;
    `);


    // Owner management: stock and set prices using prompts/menus
    obj.setMethod('manage', `
      const actor = args[0];
      if (!actor) return 'No actor provided.';

      // Enforce composable locks before allowing management (ownership is handled by locks)
      const locks = Array.isArray(self.locks) ? self.locks : [];
      for (const lock of locks) {
        if (!lock) continue;
        const lockObj = typeof lock === 'number' ? await $.load(lock) : lock;
        if (!lockObj || !lockObj.canAccess) continue;
        const result = await lockObj.canAccess(actor, self);
        if (result !== true) return result;
      }

      const contents = self.contents || [];
      const menu = 'Manage vending machine:\n' +
        '  1) Stock from inventory\n' +
        '  2) Set price for item\n' +
        '  3) Set default price\n' +
        '  4) Set bank account\n' +
        '  5) Configure spawnables\n' +
        '  6) Exit';
      const choiceRaw = await $.prompt(actor, menu + '\nChoose:');
      const choice = Number(choiceRaw);


      if (choice === 1) {
        // Move an item from owner inventory into machine
        const inv = Array.isArray(actor.inventory) ? actor.inventory : [];
        if (!inv.length) return 'You have no items to stock.';
        let invMenu = 'Pick item to stock:\n';
        const items = [];
        for (let i = 0; i < inv.length; i++) {
          const itm = await $.load(inv[i]);
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
        const newInv = inv.filter(id => id !== itm.id);
        actor.inventory = newInv;
        // add to vendor contents
        const newContents = Array.isArray(self.contents) ? [...self.contents] : [];
        newContents.push(itm.id);
        self.contents = newContents;
        itm.location = self.id;
        return \`\${itm.name || 'Item'} stocked.\`;
      }

      if (choice === 2) {
        const items = Array.isArray(self.contents) ? self.contents : [];
        if (!items.length) return 'No items to price.';
        let m = 'Pick item to price:\n';
        const loaded = [];
        for (let i = 0; i < items.length; i++) {
          const itm = await $.load(items[i]);
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
        const acct = await $.prompt(actor, 'Enter bank account id to receive funds:');
        if (!acct) return 'No account provided.';
        self.bankAccount = acct;
        // allow updating bank reference too
        const bankRef = await $.prompt(actor, 'Enter bank object id/alias (blank to keep current):');
        if (bankRef) self.bank = bankRef;
        return 'Bank payout updated.';
      }

      if (choice === 5) {
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
    `);


    return obj;
  }
}
