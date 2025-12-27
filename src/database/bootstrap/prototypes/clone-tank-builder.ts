import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the CloneTank prototype
 *
 * A clone tank stores backup data for players and handles resurrection.
 * When a player with a backup dies, they can choose to resurrect from the tank.
 *
 * Key mechanics:
 * - Stores one backup per player (new backup overwrites old)
 * - Resurrection takes time (growthDuration minutes)
 * - Clone spawns inside the tank when ready
 * - Backup data is ERASED on resurrection (must re-backup)
 * - Preserves: appearance, maxCalories (trained capacity), skills
 * - Resets: wounds healed, tattoos removed, calories set to minimums
 *
 * Usage:
 *   const tank = await $.recycler.create({ parent: $.cloneTank });
 *   tank.owner = somePlayer;  // Who owns this tank
 *
 *   // Recording studio stores backups here
 *   await tank.storeBackup(player, backupRecord);
 *
 *   // On death, resurrection begins
 *   await tank.beginResurrection(player);
 *   // ... minutes later ...
 *   await tank.completeResurrection();
 */
export class CloneTankBuilder {
  static readonly alias = 'cloneTank';
  static readonly parent = 'describable';

  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Clone Tank',
        description:
          'A cylindrical glass tank filled with murky amniotic fluid. Cables and tubes snake from the base into the ceiling. Status lights blink lazily on the control panel. This is where the dead come back—if they paid their dues.',

        // Cannot be moved
        boltedDown: true,

        // Clone data storage: { [playerId]: BackupRecord }
        cloneData: {},

        // Current resurrection in progress
        occupant: null, // Player being resurrected (ObjRef)
        growthStarted: null, // When resurrection started (Date)
        growthDuration: 5, // Minutes to grow a clone

        // Ownership
        owner: null, // Who owns this tank (ObjRef)

        // Aliases for commands
        aliases: ['tank', 'clone tank', 'cloning tank'],

        abilities: `Resurrection device that grows clones from backup data.

BACKUP STORAGE: 'cloneData' stores backup records keyed by player ID. One backup per player per tank. New backup overwrites old.

RESURRECTION: beginResurrection(player) starts clone growth. Takes 'growthDuration' minutes. completeResurrection() spawns finished clone.

GROWTH PHASES: 'occupant' is current resurrection. 'growthStarted' timestamp. getResurrectionProgress() returns percentage and time remaining.

PRESERVATION: Backups preserve appearance, trained maxCalories (strength), skills. Memories up to backup timestamp.

RESET: New clone has wounds healed, calories at minimum, no tattoos. Must eat and recover.

CONSUMPTION: Backup data ERASED after resurrection. Must re-backup at recording studio.

IMMOVABLE: 'boltedDown' true. Cannot be moved.`,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // BACKUP DATA MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'hasBackup',
      `
      /** Check if a player has backup data in this tank.
       *  @param player - The player to check
       *  @returns true if backup exists
       */
      const player = args[0];
      if (!player || !player.id) return false;
      
      const cloneData = self.cloneData || {};
      return !!cloneData[player.id];
    `,
    );

    obj.setMethod(
      'getBackup',
      `
      /** Get backup record for a player.
       *  @param player - The player to get backup for
       *  @returns BackupRecord or null
       */
      const player = args[0];
      if (!player || !player.id) return null;
      
      const cloneData = self.cloneData || {};
      return cloneData[player.id] || null;
    `,
    );

    obj.setMethod(
      'storeBackup',
      `
      /** Store backup data for a player. Overwrites any existing backup.
       *  Also sets player.cloneBackupTank to this tank.
       *  @param player - The player being backed up
       *  @param record - The backup record to store
       */
      const player = args[0];
      const record = args[1];
      
      if (!player || !player.id) {
        throw new Error('Invalid player for backup');
      }
      if (!record) {
        throw new Error('Invalid backup record');
      }
      
      // Clear any existing backup on other tanks
      if (player.cloneBackupTank && player.cloneBackupTank.id !== self.id) {
        const oldTank = player.cloneBackupTank;
        if (oldTank.deleteBackup) {
          await oldTank.deleteBackup(player);
        }
      }
      
      // Store the backup
      const cloneData = self.cloneData || {};
      cloneData[player.id] = record;
      self.cloneData = cloneData;
      
      // Update player's reference to this tank
      player.cloneBackupTank = self;
      
      return true;
    `,
    );

    obj.setMethod(
      'deleteBackup',
      `
      /** Remove backup data for a player.
       *  Clears player.cloneBackupTank if it points to this tank.
       *  @param player - The player whose backup to delete
       */
      const player = args[0];
      if (!player || !player.id) return false;
      
      const cloneData = self.cloneData || {};
      if (!cloneData[player.id]) return false;
      
      delete cloneData[player.id];
      self.cloneData = cloneData;
      
      // Clear player's reference if it points to us
      if (player.cloneBackupTank && player.cloneBackupTank.id === self.id) {
        player.cloneBackupTank = null;
      }
      
      return true;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // RESURRECTION
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'beginResurrection',
      `
      /** Begin growing a clone for resurrection.
       *  @param player - The player to resurrect
       *  @returns { success, message, estimatedTime? }
       */
      const player = args[0];
      
      if (!player || !player.id) {
        return { success: false, message: 'Invalid player.' };
      }
      
      // Check if tank is already occupied
      if (self.occupant) {
        return { success: false, message: 'Tank is already growing a clone.' };
      }
      
      // Check if player has backup here
      const backup = await self.getBackup(player);
      if (!backup) {
        return { success: false, message: 'No backup data found for this player.' };
      }
      
      // Start resurrection
      self.occupant = player;
      self.growthStarted = new Date();
      
      const duration = self.growthDuration || 5;
      
      // Schedule completion
      // The tick system will call completeResurrection when ready
      // For now we just set the state
      
      return { 
        success: true, 
        message: 'Clone growth initiated.',
        estimatedTime: duration,
        backupTimestamp: backup.backupTimestamp
      };
    `,
    );

    obj.setMethod(
      'getResurrectionProgress',
      `
      /** Get current resurrection progress.
       *  @returns { inProgress, occupant?, progress?, minutesRemaining? }
       */
      if (!self.occupant || !self.growthStarted) {
        return { inProgress: false };
      }
      
      const started = new Date(self.growthStarted);
      const now = new Date();
      const elapsedMs = now.getTime() - started.getTime();
      const elapsedMinutes = elapsedMs / 60000;
      const duration = self.growthDuration || 5;
      
      const progress = Math.min(100, (elapsedMinutes / duration) * 100);
      const minutesRemaining = Math.max(0, duration - elapsedMinutes);
      
      return {
        inProgress: true,
        occupant: self.occupant,
        progress: Math.floor(progress),
        minutesRemaining: Math.ceil(minutesRemaining),
        ready: progress >= 100
      };
    `,
    );

    obj.setMethod(
      'completeResurrection',
      `
      /** Complete resurrection - create new body and eject clone.
       *  Called when growth timer completes.
       *  @returns { success, message, player? }
       */
      const progressInfo = await self.getResurrectionProgress();
      
      if (!progressInfo.inProgress) {
        return { success: false, message: 'No resurrection in progress.' };
      }
      
      if (!progressInfo.ready) {
        return { 
          success: false, 
          message: 'Clone not ready yet. ' + progressInfo.minutesRemaining + ' minutes remaining.' 
        };
      }
      
      const player = self.occupant;
      const backup = await self.getBackup(player);
      
      if (!backup) {
        // Backup was deleted during growth? Abort.
        self.occupant = null;
        self.growthStarted = null;
        return { success: false, message: 'Backup data was lost during growth.' };
      }
      
      // Create new body from template
      let newBody = null;
      if (backup.bodyTemplate && $.memento) {
        try {
          const clones = await $.memento.rehydrate(backup.bodyTemplate);
          newBody = clones['%0']; // First object is the torso (body root)
        } catch (e) {
          console.error('Failed to rehydrate body template:', e);
        }
      }
      
      // If template failed, create fresh body via bodyFactory
      if (!newBody && $.bodyFactory) {
        const appearance = backup.appearance || {};
        newBody = await $.bodyFactory.createHumanBody(
          player,
          appearance.sex || 'female',
          appearance
        );
      }
      
      if (!newBody) {
        self.occupant = null;
        self.growthStarted = null;
        return { success: false, message: 'Failed to create clone body.' };
      }
      
      // Apply preserved stats (maxCalories for trained capacity)
      if (backup.preservedStats && backup.preservedStats.maxCalories) {
        await self.applyPreservedStats(newBody, backup.preservedStats);
      }
      
      // Reset body to fresh state:
      // - Wounds healed (decayLevel = 0)
      // - Calories at minimum
      // - No tattoos (TODO: when tattoo system exists)
      await self.resetBodyToFresh(newBody);
      
      // Attach body to player
      player.body = newBody;
      newBody.owner = player;
      
      // Move player into the tank's room
      const tankRoom = self.location;
      if (tankRoom) {
        player.location = tankRoom;
        if (tankRoom.addContent) {
          await tankRoom.addContent(player);
        }
      }
      
      // Clear resurrection state
      self.occupant = null;
      self.growthStarted = null;
      
      // DELETE the backup data (must re-backup after resurrection)
      await self.deleteBackup(player);
      
      // Notify player
      if (player.tell) {
        await player.tell('');
        await player.tell('You gasp, choking on amniotic fluid as the tank drains.');
        await player.tell('Memory fragments reassemble. You remember... up to a point.');
        await player.tell('');
        await player.tell('Your last backup was: ' + new Date(backup.backupTimestamp).toLocaleString());
        await player.tell('Everything after that moment is gone.');
        await player.tell('');
      }
      
      // Announce to room
      if (tankRoom && tankRoom.announce) {
        await tankRoom.announce(
          'The clone tank hisses and drains. A figure stirs within, then slumps forward as the glass retracts. ' +
          (player.name || 'Someone') + ' has been reborn.',
          [player]
        );
      }
      
      return { 
        success: true, 
        message: 'Resurrection complete.',
        player: player,
        backupTimestamp: backup.backupTimestamp
      };
    `,
    );

    obj.setMethod(
      'applyPreservedStats',
      `
      /** Apply preserved stats (maxCalories) to a new body.
       *  @param body - The torso (root of body tree)
       *  @param preservedStats - { maxCalories: { partName: value, ... } }
       */
      const body = args[0];
      const preservedStats = args[1];
      
      if (!body || !preservedStats) return;
      
      const maxCaloriesMap = preservedStats.maxCalories || {};
      
      // Apply to torso
      if (maxCaloriesMap.torso && body.maxCalories !== undefined) {
        body.maxCalories = maxCaloriesMap.torso;
      }
      
      // Apply to all parts recursively
      const applyToParts = async (part) => {
        if (!part || !part.parts) return;
        
        const parts = part.parts;
        for (const [key, subpart] of Object.entries(parts)) {
          if (!subpart) continue;
          
          // Find matching preserved stat by part name
          const partName = subpart.name?.toLowerCase().replace(/\\s+/g, '_');
          if (partName && maxCaloriesMap[partName] !== undefined) {
            if (subpart.maxCalories !== undefined) {
              subpart.maxCalories = maxCaloriesMap[partName];
            }
          }
          
          // Recurse
          await applyToParts(subpart);
        }
      };
      
      await applyToParts(body);
    `,
    );

    obj.setMethod(
      'resetBodyToFresh',
      `
      /** Reset body to fresh clone state.
       *  - All wounds healed (decayLevel = 0)
       *  - Calories at minimum (10% of max)
       *  - Hydration at 50%
       *  @param body - The torso (root of body tree)
       */
      const body = args[0];
      if (!body) return;
      
      // Reset torso
      body.decayLevel = 0;
      body.calories = Math.floor((body.maxCalories || 100) * 0.1);
      if (body.hydration !== undefined) {
        body.hydration = Math.floor((body.maxHydration || 100) * 0.5);
      }
      if (body.fat !== undefined) {
        body.fat = 10; // Minimal fat
      }
      
      // Reset all parts recursively
      const resetPart = async (part) => {
        if (!part || !part.parts) return;
        
        const parts = part.parts;
        for (const [key, subpart] of Object.entries(parts)) {
          if (!subpart) continue;
          
          // Reset decay
          if (subpart.decayLevel !== undefined) {
            subpart.decayLevel = 0;
          }
          
          // Reset calories to minimum
          if (subpart.calories !== undefined && subpart.maxCalories !== undefined) {
            subpart.calories = Math.floor(subpart.maxCalories * 0.1);
          }
          
          // Recurse
          await resetPart(subpart);
        }
      };
      
      await resetPart(body);
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // TICK PROCESSING
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'tick',
      `
      /** Called each game tick to check resurrection progress. */
      if (!self.occupant) return;
      
      const progress = await self.getResurrectionProgress();
      if (progress.ready) {
        await self.completeResurrection();
      }
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'describe',
      `
      /** Describe the tank, including current state. */
      let desc = self.name + '\\n' + self.description;
      
      const progress = await self.getResurrectionProgress();
      if (progress.inProgress) {
        const occupantName = progress.occupant?.name || 'Someone';
        desc += '\\n\\nThe tank is active. A figure floats in the murky fluid—' + 
                occupantName + ' is being regrown. Progress: ' + progress.progress + 
                '%. Estimated time remaining: ' + progress.minutesRemaining + ' minutes.';
      } else {
        // Check how many backups are stored
        const cloneData = self.cloneData || {};
        const backupCount = Object.keys(cloneData).length;
        if (backupCount === 0) {
          desc += '\\n\\nThe tank is empty and dormant. No backup data on file.';
        } else {
          desc += '\\n\\nThe tank is dormant. ' + backupCount + ' backup' + 
                  (backupCount === 1 ? '' : 's') + ' stored.';
        }
      }
      
      return desc;
    `,
    );

    obj.setMethod(
      'shortDesc',
      `
      const progress = await self.getResurrectionProgress();
      if (progress.inProgress) {
        return 'clone tank (active - ' + progress.progress + '%)';
      }
      return 'clone tank';
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // CONTAINMENT - Tank can contain the resurrecting player
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'canContain',
      `
      /** Only the occupant can be "in" the tank during resurrection. */
      const item = args[0];

      // During resurrection, the occupant is conceptually inside
      if (self.occupant && item.id === self.occupant.id) {
        return true;
      }

      return 'The clone tank cannot hold that.';
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'cloneData',
      'Map of player IDs to backup records, one backup per player',
    );
    obj.setPropertyDescription(
      'occupant',
      'Player currently being resurrected (ObjRef), null if idle',
    );
    obj.setPropertyDescription(
      'growthStarted',
      'Timestamp when current resurrection began (Date)',
    );
    obj.setPropertyDescription(
      'growthDuration',
      'Minutes required to grow a clone (default 5)',
    );
    obj.setPropertyDescription('owner', 'Player who owns this tank (ObjRef)');

    return obj;
  }
}
