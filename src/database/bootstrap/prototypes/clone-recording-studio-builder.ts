import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the CloneRecordingStudio prototype
 * 
 * A recording studio captures player body data and stores it in a linked clone tank.
 * Players pay to create or update their backup.
 * 
 * Key mechanics:
 * - Hardwired to a specific tank (linkedTank property)
 * - Charges a fee (in cash or credits) for backup
 * - Captures: body template, appearance, preserved stats (maxCalories)
 * - Recording in one studio invalidates backups at other tanks
 * 
 * Usage:
 *   const studio = await $.recycler.create({ parent: $.cloneRecordingStudio });
 *   studio.linkedTank = someTank;     // Required: which tank to store backups
 *   studio.backupPrice = 500;         // Cost to backup
 *   studio.currency = 'cash';         // 'cash' or 'credits'
 *   studio.operator = somePlayer;     // Who receives payment
 *   
 *   // Player uses the studio
 *   await studio.backup(player);
 */
export class CloneRecordingStudioBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Clone Recording Studio',
        description:
          'A reclining chair surrounded by neural scanning equipment. Electrodes dangle from an articulated arm. A console displays pricing and status. Sit down, pay up, and your consciousness gets backed up—insurance against the permanent kind of death.',
        
        // Cannot be moved
        boltedDown: true,
        
        // Linked tank - where backups are stored (required)
        linkedTank: null,    // ObjRef to clone tank
        
        // Pricing
        backupPrice: 500,    // Cost to create/update backup
        currency: 'cash',    // 'cash' or 'credits'
        
        // Operator - who receives payment
        operator: null,      // ObjRef to player/NPC who receives payment
        
        // Owner - who can configure the studio
        owner: null,         // ObjRef to player/NPC who owns this studio
        
        // Aliases for commands
        aliases: ['studio', 'recording studio', 'backup station', 'chair'],
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // BACKUP OPERATIONS
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('backup', `
      /** Create or update a backup for a player.
       *  Charges the player, captures their body, stores in linked tank.
       *  @param player - The player to backup
       *  @returns { success, message, backupTimestamp? }
       */
      const player = args[0];
      
      if (!player || !player.id) {
        return { success: false, message: 'Invalid player.' };
      }
      
      // Check linked tank
      const tank = self.linkedTank;
      if (!tank) {
        return { success: false, message: 'This studio is not connected to a clone tank.' };
      }
      
      // Check if player can afford it
      const affordCheck = await self.canAfford(player);
      if (!affordCheck.canAfford) {
        return { success: false, message: affordCheck.message };
      }
      
      // Check if player has a body to backup
      const body = player.body;
      if (!body) {
        return { success: false, message: 'You have no body to backup.' };
      }
      
      // Charge the player
      const chargeResult = await self.chargePlayer(player);
      if (!chargeResult.success) {
        return { success: false, message: chargeResult.message };
      }
      
      // Capture body template
      const bodyTemplate = await self.captureBody(player);
      if (!bodyTemplate) {
        // Refund? For now, just fail
        return { success: false, message: 'Failed to capture body data.' };
      }
      
      // Capture appearance
      const appearance = await self.captureAppearance(player);
      
      // Capture preserved stats
      const preservedStats = await self.captureStats(player);
      
      // Build backup record
      const backupRecord = {
        playerId: player,
        playerName: player.name || 'Unknown',
        bodyTemplate: bodyTemplate,
        appearance: appearance,
        preservedStats: preservedStats,
        backupTimestamp: new Date(),
        backupLocation: self.location,
      };
      
      // Store in tank (this also invalidates old backups elsewhere)
      await tank.storeBackup(player, backupRecord);
      
      // Notify player
      if (player.tell) {
        await player.tell('');
        await player.tell('Neural scan complete. Your consciousness has been backed up.');
        await player.tell('Backup stored at: ' + (tank.name || 'linked tank'));
        await player.tell('Timestamp: ' + new Date().toLocaleString());
        await player.tell('');
        await player.tell('Remember: If you die, your clone will only have memories up to this moment.');
        await player.tell('Everything after now will be lost.');
      }
      
      return { 
        success: true, 
        message: 'Backup complete.',
        backupTimestamp: new Date()
      };
    `);

    obj.setMethod('canAfford', `
      /** Check if player can afford the backup.
       *  @param player - The player to check
       *  @returns { canAfford: boolean, message?: string }
       */
      const player = args[0];
      const price = self.backupPrice || 500;
      const currency = self.currency || 'cash';
      
      if (price === 0) {
        return { canAfford: true };
      }
      
      if (currency === 'credits') {
        // Check bank balance
        if (!$.bank) {
          return { canAfford: false, message: 'Banking system unavailable.' };
        }
        
        const accounts = await $.bank.getAccountByOwner(player);
        if (!accounts || !accounts.length) {
          return { canAfford: false, message: 'You have no bank account.' };
        }
        
        const balance = accounts[0].balance || 0;
        if (balance < price) {
          return { 
            canAfford: false, 
            message: 'Insufficient credits. Need ' + price + ', have ' + balance + '.' 
          };
        }
        
        return { canAfford: true };
        
      } else {
        // Check cash using $.cash utility (searches hands and pockets)
        const found = await $.cash.find(player);
        
        if (found.total < price) {
          return { 
            canAfford: false, 
            message: 'Insufficient cash. Need $' + price + ', have $' + found.total + '.' 
          };
        }
        
        return { canAfford: true };
      }
    `);

    obj.setMethod('chargePlayer', `
      /** Deduct payment from player and give to operator.
       *  @param player - The player to charge
       *  @returns { success, message }
       */
      const player = args[0];
      const price = self.backupPrice || 500;
      const currency = self.currency || 'cash';
      const operator = self.operator;
      
      if (price === 0) {
        return { success: true };
      }
      
      if (currency === 'credits') {
        // Transfer via bank
        if (!$.bank) {
          return { success: false, message: 'Banking system unavailable.' };
        }
        
        const playerAccounts = await $.bank.getAccountByOwner(player);
        if (!playerAccounts || !playerAccounts.length) {
          return { success: false, message: 'You have no bank account.' };
        }
        
        let operatorAccountId = null;
        if (operator) {
          const operatorAccounts = await $.bank.getAccountByOwner(operator);
          if (operatorAccounts && operatorAccounts.length) {
            operatorAccountId = operatorAccounts[0].accountId;
          }
        }
        
        if (operatorAccountId) {
          // Transfer to operator
          const tx = await $.bank.transfer(
            playerAccounts[0].accountId,
            operatorAccountId,
            price,
            'backup-' + Date.now(),
            'Clone backup fee'
          );
          if (!tx?.success) {
            return { success: false, message: tx?.error || 'Transfer failed.' };
          }
        } else {
          // Burn credits (no operator)
          const tx = await $.bank.burn(
            playerAccounts[0].accountId,
            price,
            'backup-' + Date.now(),
            'Clone backup fee'
          );
          if (!tx?.success) {
            return { success: false, message: tx?.error || 'Payment failed.' };
          }
        }
        
        return { success: true };
        
      } else {
        // Take cash from player using $.cash utility
        const takeResult = await $.cash.take(player, price);
        if (!takeResult.success) {
          return { success: false, message: takeResult.message };
        }
        
        // Give cash to operator if present
        if (operator) {
          const giveResult = await $.cash.give(operator, price);
          // If give fails, operator has no place for cash - it's lost
          // (This shouldn't normally happen - operators should have hands/pockets)
        }
        // If no operator, money is burned (already taken from player)
        
        return { success: true };
      }
    `);

    obj.setMethod('captureBody', `
      /** Capture player's body as a memento template.
       *  @param player - The player whose body to capture
       *  @returns JSON string of body template, or null on failure
       */
      const player = args[0];
      const body = player.body;
      
      if (!body) return null;
      if (!$.memento) return null;
      
      try {
        // Gather all body parts into an array
        const allParts = [body];
        
        const gatherParts = (part) => {
          if (!part || !part.parts) return;
          const parts = part.parts;
          for (const [key, subpart] of Object.entries(parts)) {
            if (subpart) {
              allParts.push(subpart);
              gatherParts(subpart);
            }
          }
        };
        
        gatherParts(body);
        
        // Capture as template
        const template = await $.memento.capture(allParts);
        return template;
        
      } catch (e) {
        console.error('Failed to capture body:', e);
        return null;
      }
    `);

    obj.setMethod('captureAppearance', `
      /** Capture player's appearance data.
       *  @param player - The player whose appearance to capture
       *  @returns Appearance object
       */
      const player = args[0];
      const body = player.body;
      
      const appearance = {
        sex: player.sex || 'female',
      };
      
      // Try to get appearance from body parts
      if (body) {
        // Skin tone from torso
        if (body.skinTone) appearance.skinTone = body.skinTone;
        
        // Try to find head for face features
        const head = body.parts?.head;
        if (head) {
          const face = head.parts?.face;
          if (face) {
            // Eyes
            const leftEye = face.parts?.leftEye;
            if (leftEye?.eyeColor) appearance.eyeColor = leftEye.eyeColor;
            
            // Nose
            const nose = face.parts?.nose;
            if (nose?.noseShape) appearance.noseShape = nose.noseShape;
          }
          
          // Hair
          const scalp = head.parts?.scalp;
          if (scalp) {
            if (scalp.hairColor) appearance.hairColor = scalp.hairColor;
            if (scalp.hairStyle) appearance.hairStyle = scalp.hairStyle;
          }
        }
      }
      
      return appearance;
    `);

    obj.setMethod('captureStats', `
      /** Capture stats to preserve across resurrection.
       *  Currently: maxCalories for each body part (trained capacity).
       *  @param player - The player whose stats to capture
       *  @returns { maxCalories: { partName: value, ... } }
       */
      const player = args[0];
      const body = player.body;
      
      const preservedStats = {
        maxCalories: {}
      };
      
      if (!body) return preservedStats;
      
      // Capture torso
      if (body.maxCalories !== undefined) {
        preservedStats.maxCalories.torso = body.maxCalories;
      }
      
      // Capture all parts recursively
      const capturePart = (part, prefix) => {
        if (!part || !part.parts) return;
        
        const parts = part.parts;
        for (const [key, subpart] of Object.entries(parts)) {
          if (!subpart) continue;
          
          const partName = subpart.name?.toLowerCase().replace(/\\s+/g, '_') || key;
          
          if (subpart.maxCalories !== undefined) {
            preservedStats.maxCalories[partName] = subpart.maxCalories;
          }
          
          capturePart(subpart, partName + '_');
        }
      };
      
      capturePart(body, '');
      
      return preservedStats;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      /** Describe the studio, including pricing and linked tank. */
      let desc = self.name + '\\n' + self.description;
      
      const price = self.backupPrice || 500;
      const currency = self.currency || 'cash';
      const tank = self.linkedTank;
      
      desc += '\\n\\n';
      
      if (price === 0) {
        desc += 'BACKUP: Free';
      } else if (currency === 'credits') {
        desc += 'BACKUP: ' + price + ' credits';
      } else {
        desc += 'BACKUP: $' + price + ' cash';
      }
      
      if (tank) {
        desc += '\\nLINKED TO: ' + (tank.name || 'Clone Tank');
        if (tank.location && tank.location.name) {
          desc += ' (' + tank.location.name + ')';
        }
      } else {
        desc += '\\nSTATUS: Not connected to any tank (non-functional)';
      }
      
      return desc;
    `);

    obj.setMethod('shortDesc', `
      const price = self.backupPrice || 500;
      const currency = self.currency || 'cash';
      
      if (price === 0) {
        return 'clone recording studio (free)';
      } else if (currency === 'credits') {
        return 'clone recording studio (' + price + ' cr)';
      } else {
        return 'clone recording studio ($' + price + ')';
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // ROOM VERBS - Available when player is in same room
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('getRoomVerbs', `
      /** Return verbs available when in same room as the studio. */
      return [
        { pattern: ['backup', 'record backup', 'clone backup'], method: 'doBackup' },
        { pattern: ['check backup', 'backup status'], method: 'doCheckBackup' },
        { pattern: ['manage studio', 'manage recording studio'], method: 'doManage' },
      ];
    `);

    obj.setMethod('doBackup', `
      /** Handle 'backup' command from player. */
      const player = args[0];
      const result = await self.backup(player);
      
      if (!result.success) {
        await player.tell(result.message);
      }
      // Success message is handled in backup() method
    `);

    obj.setMethod('doCheckBackup', `
      /** Handle 'check backup' command - show backup status. */
      const player = args[0];
      const tank = self.linkedTank;
      
      if (!tank) {
        await player.tell('This studio is not connected to any tank.');
        return;
      }
      
      const backup = await tank.getBackup(player);
      
      if (!backup) {
        await player.tell('You have no backup stored in the linked tank.');
        await player.tell('Use BACKUP to create one.');
      } else {
        await player.tell('');
        await player.tell('=== BACKUP STATUS ===');
        await player.tell('Tank: ' + (tank.name || 'Clone Tank'));
        await player.tell('Timestamp: ' + new Date(backup.backupTimestamp).toLocaleString());
        await player.tell('');
        await player.tell('If you die, you will resurrect with memories up to this timestamp.');
        await player.tell('Use BACKUP to update your backup (will overwrite current).');
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // OWNER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('manage', `
      /** Owner management menu for configuring the studio.
       *  @param actor - The player trying to manage
       */
      const actor = args[0];
      if (!actor) return 'No actor provided.';
      
      // Check ownership
      const owner = self.owner;
      const isOwner = owner && owner.id === actor.id;
      const isWizard = actor.isWizard || actor.isAdmin;
      
      if (!isOwner && !isWizard) {
        return 'You are not the owner of this studio.';
      }
      
      // Build current settings display
      const price = self.backupPrice ?? 500;
      const currency = self.currency || 'cash';
      const operator = self.operator;
      const tank = self.linkedTank;
      
      let settings = '=== CURRENT SETTINGS ===\\n';
      settings += 'Price: ' + (currency === 'credits' ? price + ' credits' : '$' + price + ' cash') + '\\n';
      settings += 'Payment to: ' + (operator ? (operator.name || 'Operator') : '(none - payments burned)') + '\\n';
      settings += 'Linked tank: ' + (tank ? (tank.name || 'Clone Tank') : '(not connected)') + '\\n';
      settings += '\\n';
      
      const menu = settings + 
        'Manage Clone Recording Studio:\\n' +
        '  1) Set backup price\\n' +
        '  2) Set currency (cash/credits)\\n' +
        '  3) Set payment recipient\\n' +
        '  4) View current settings\\n' +
        '  5) Exit';
      
      const choiceRaw = await $.prompt(actor, menu + '\\nChoose:');
      const choice = Number(choiceRaw);
      
      // 1) Set backup price
      if (choice === 1) {
        const currentPrice = self.backupPrice ?? 500;
        const priceRaw = await $.prompt(actor, 'Enter new backup price (current: ' + currentPrice + '):');
        
        if (!priceRaw || priceRaw.trim() === '') {
          return 'Cancelled.';
        }
        
        const newPrice = Number(priceRaw);
        if (!Number.isFinite(newPrice) || newPrice < 0) {
          return 'Invalid price. Must be a positive number.';
        }
        
        self.backupPrice = newPrice;
        
        if (newPrice === 0) {
          return 'Backup price set to FREE.';
        } else {
          const curr = self.currency || 'cash';
          return 'Backup price set to ' + (curr === 'credits' ? newPrice + ' credits' : '$' + newPrice + ' cash') + '.';
        }
      }
      
      // 2) Set currency
      if (choice === 2) {
        const currentCurrency = self.currency || 'cash';
        const currMenu = 'Select currency (current: ' + currentCurrency + '):\\n' +
          '  1) Cash (physical dollars)\\n' +
          '  2) Credits (bank transfer)';
        
        const currRaw = await $.prompt(actor, currMenu + '\\nChoose:');
        const currChoice = Number(currRaw);
        
        if (currChoice === 1) {
          self.currency = 'cash';
          return 'Currency set to CASH. Players will pay with physical dollars.';
        } else if (currChoice === 2) {
          self.currency = 'credits';
          return 'Currency set to CREDITS. Players will pay via bank transfer.';
        } else {
          return 'Cancelled.';
        }
      }
      
      // 3) Set payment recipient
      if (choice === 3) {
        const currentOp = self.operator;
        let prompt = 'Who should receive payments?\\n';
        prompt += '  1) Me (' + actor.name + ')\\n';
        prompt += '  2) Specify by name\\n';
        prompt += '  3) No one (burn payments)';
        if (currentOp) {
          prompt += '\\n\\nCurrent recipient: ' + (currentOp.name || 'Unknown');
        }
        
        const opRaw = await $.prompt(actor, prompt + '\\nChoose:');
        const opChoice = Number(opRaw);
        
        if (opChoice === 1) {
          self.operator = actor;
          return 'You are now the payment recipient.';
        } else if (opChoice === 2) {
          const nameRaw = await $.prompt(actor, 'Enter player name:');
          if (!nameRaw || nameRaw.trim() === '') {
            return 'Cancelled.';
          }
          
          // Try to find player by name
          const targetName = nameRaw.trim();
          let found = null;
          
          // Search connected players first
          if ($.players && $.players.forEach) {
            $.players.forEach(p => {
              if (p && p.name && p.name.toLowerCase() === targetName.toLowerCase()) {
                found = p;
              }
            });
          }
          
          if (!found) {
            return 'Player not found: ' + targetName + '. They must be online.';
          }
          
          self.operator = found;
          return 'Payment recipient set to ' + found.name + '.';
        } else if (opChoice === 3) {
          self.operator = null;
          return 'Payment recipient cleared. Payments will be burned.';
        } else {
          return 'Cancelled.';
        }
      }
      
      // 4) View current settings
      if (choice === 4) {
        let info = '\\n=== STUDIO CONFIGURATION ===\\n';
        info += 'Name: ' + (self.name || 'Clone Recording Studio') + '\\n';
        info += 'Owner: ' + (owner ? (owner.name || 'Unknown') : '(none)') + '\\n';
        info += 'Price: ' + (currency === 'credits' ? price + ' credits' : '$' + price + ' cash') + '\\n';
        info += 'Currency: ' + currency + '\\n';
        info += 'Payment to: ' + (operator ? (operator.name || 'Unknown') : '(burned)') + '\\n';
        info += 'Linked tank: ' + (tank ? (tank.name || 'Clone Tank') : '(not connected)') + '\\n';
        if (tank && tank.location) {
          info += 'Tank location: ' + (tank.location.name || 'Unknown') + '\\n';
        }
        info += '\\nUse MANAGE again to change settings.';
        
        return info;
      }
      
      // 5 or other) Exit
      return 'Exited management.';
    `);

    obj.setMethod('doManage', `
      /** Handle 'manage' command from owner. */
      const actor = args[0];
      const result = await self.manage(actor);
      
      if (result && actor.tell) {
        await actor.tell(result);
      }
    `);

    return obj;
  }
}
