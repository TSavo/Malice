import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Admin prototype
 * Extends Player with world-building commands like @dig, @create, @destroy
 *
 * Admin commands use @ prefix and $.prompt for interactive input:
 * - @dig: Create a new room with exits
 * - @create: Create objects
 * - @destroy: Remove objects
 * - @teleport: Move to any room
 * - @set: Set properties on objects
 * - @examine: Deep inspect objects
 */
export class AdminBuilder {
  constructor(private manager: ObjectManager) {}

  async build(playerId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: playerId,
      properties: {
        name: 'Admin',
        description: 'Base prototype for admin characters with building powers',
        isAdmin: true,
      },
      methods: {},
    });

    this.addConnectionOverride(obj);
    this.addBuildingCommands(obj);
    this.addTeleportCommands(obj);
    this.addInspectCommands(obj);
    this.addEvalCommands(obj);

    return obj;
  }

  private addConnectionOverride(obj: RuntimeObject): void {
    // Override connect to register admin verbs
    obj.setMethod('connect', `
      // Call parent connect first
      const parentConnect = self.__proto__ && self.__proto__.connect;
      if (parentConnect) {
        await parentConnect.call(self, args[0]);
      }

      // Register admin verbs
      await self.registerVerb('@dig', self);
      await self.registerVerb('@link', self);
      await self.registerVerb(['@unlink %s'], self, '@unlink');
      await self.registerVerb(['@set %s', '@set %s %s'], self, '@set');
      await self.registerVerb(['@create', '@create %s'], self, '@create');
      await self.registerVerb(['@destroy %s'], self, '@destroy');
      await self.registerVerb(['@teleport %s', '@tp %s'], self, '@teleport');
      await self.registerVerb(['@goto %s'], self, '@goto');
      await self.registerVerb(['@summon %s'], self, '@summon');
      await self.registerVerb(['@examine %s', '@examine', '@x %s', '@x'], self, '@examine');
      await self.registerVerb(['@find %s'], self, '@find');
      await self.registerVerb('@where', self);
      await self.registerVerb(['@setVerb %s %s', '@setverb %s %s'], self, '@setVerb');
      await self.registerVerb(['@listVerbs %s', '@listverbs %s'], self, '@listVerbs');
      await self.registerVerb(['@rmVerb %s %s', '@rmverb %s %s'], self, '@rmVerb');
      await self.registerVerb(['@eval %s'], self, '@eval');
      await self.registerVerb('@evalm', self);

      await self.tell('');
      await self.tell('[Admin commands: @dig, @link, @teleport, @examine, @set, @create, @destroy, @eval, @evalm]');
    `);
  }

  private addBuildingCommands(obj: RuntimeObject): void {
    // @dig - Interactive room creation
    obj.setMethod('@dig', `
      /** Create a new room with interactive prompts.
       *  Gathers: name, description, coordinates, exit back to current room.
       */
      const currentRoom = self.location ? await $.load(self.location) : null;

      await self.tell('=== @dig: Create New Room ===\\r\\n');

      // 1. Room name
      const name = await $.prompt.question(self, 'Room name: ');
      if (!name) {
        await self.tell('Cancelled.');
        return;
      }

      // 2. Room description
      const description = await $.prompt.question(self, 'Room description: ');
      if (description === null) {
        await self.tell('Cancelled.');
        return;
      }

      // 3. Coordinates - suggest based on direction from current room
      let suggestX = 0, suggestY = 0, suggestZ = 0;
      if (currentRoom) {
        suggestX = currentRoom.x || 0;
        suggestY = currentRoom.y || 0;
        suggestZ = currentRoom.z || 0;
      }

      await self.tell('\\r\\nCoordinates (current room: ' + suggestX + ',' + suggestY + ',' + suggestZ + ')');

      const xStr = await $.prompt.question(self, 'X coordinate [' + suggestX + ']: ');
      const x = xStr === '' ? suggestX : parseInt(xStr, 10);
      if (isNaN(x)) {
        await self.tell('Invalid number. Cancelled.');
        return;
      }

      const yStr = await $.prompt.question(self, 'Y coordinate [' + suggestY + ']: ');
      const y = yStr === '' ? suggestY : parseInt(yStr, 10);
      if (isNaN(y)) {
        await self.tell('Invalid number. Cancelled.');
        return;
      }

      const zStr = await $.prompt.question(self, 'Z coordinate [' + suggestZ + ']: ');
      const z = zStr === '' ? suggestZ : parseInt(zStr, 10);
      if (isNaN(z)) {
        await self.tell('Invalid number. Cancelled.');
        return;
      }

      // 4. Create exit from current room?
      let exitDirection = null;
      let returnDirection = null;
      if (currentRoom) {
        const createExit = await $.prompt.yesorno(self, '\\r\\nCreate exit from current room?');
        if (createExit) {
          exitDirection = await $.prompt.question(self, 'Exit direction (e.g., north, east, up): ');
          if (exitDirection) {
            returnDirection = await $.prompt.question(self, 'Return direction (e.g., south, west, down): ');
          }
        }
      }

      // 5. Confirm
      await self.tell('\\r\\n=== Confirm Room Creation ===');
      await self.tell('Name: ' + name);
      await self.tell('Description: ' + description);
      await self.tell('Coordinates: ' + x + ',' + y + ',' + z);
      if (exitDirection) {
        await self.tell('Exit: ' + exitDirection + ' -> new room');
        await self.tell('Return: ' + returnDirection + ' -> current room');
      }

      const confirmed = await $.prompt.yesorno(self, '\\r\\nCreate this room?');
      if (!confirmed) {
        await self.tell('Cancelled.');
        return;
      }

      // 6. Create the room
      const aliases = $.system.aliases || {};
      const roomProtoId = aliases.room;
      if (!roomProtoId) {
        await self.tell('Error: Room prototype not found.');
        return;
      }

      const newRoom = await $.create({
        parent: roomProtoId,
        properties: {
          name: name,
          description: description,
          x: x,
          y: y,
          z: z,
        },
      });

      await self.tell('\\r\\nCreated room #' + newRoom.id + ': ' + name);

      // 7. Create exits if requested
      if (exitDirection && currentRoom) {
        const exitProtoId = aliases.exit;
        if (exitProtoId) {
          // Exit from current to new
          const exitToNew = await $.create({
            parent: exitProtoId,
            properties: {
              name: exitDirection,
              aliases: self.getExitAliases(exitDirection),
              destRoom: newRoom.id,
            },
          });
          await currentRoom.addExit(exitToNew);
          await self.tell('Created exit ' + exitDirection + ' (#' + exitToNew.id + ')');

          // Return exit from new to current
          if (returnDirection) {
            const exitToCurrent = await $.create({
              parent: exitProtoId,
              properties: {
                name: returnDirection,
                aliases: self.getExitAliases(returnDirection),
                destRoom: currentRoom.id,
              },
            });
            await newRoom.addExit(exitToCurrent);
            await self.tell('Created exit ' + returnDirection + ' (#' + exitToCurrent.id + ')');
          }
        }
      }

      await self.tell('\\r\\nDone! Use "@teleport #' + newRoom.id + '" to go there.');
    `);

    // Helper to get standard aliases for directions
    obj.setMethod('getExitAliases', `
      const direction = args[0]?.toLowerCase();
      const aliasMap = {
        north: ['n'],
        south: ['s'],
        east: ['e'],
        west: ['w'],
        northeast: ['ne'],
        northwest: ['nw'],
        southeast: ['se'],
        southwest: ['sw'],
        up: ['u'],
        down: ['d', 'dn'],
        in: ['i'],
        out: ['o'],
      };
      return aliasMap[direction] || [];
    `);

    // @link - Create an exit between two existing rooms
    obj.setMethod('@link', `
      /** Create an exit from current room to another room.
       *  Usage: @link
       */
      const currentRoom = self.location ? await $.load(self.location) : null;
      if (!currentRoom) {
        await self.tell('You must be in a room to create an exit.');
        return;
      }

      await self.tell('=== @link: Create Exit ===\\r\\n');

      // 1. Destination room
      const destStr = await $.prompt.question(self, 'Destination room ID (e.g., 42): ');
      if (!destStr) {
        await self.tell('Cancelled.');
        return;
      }
      const destId = parseInt(destStr.replace('#', ''), 10);
      if (isNaN(destId)) {
        await self.tell('Invalid room ID.');
        return;
      }

      const destRoom = await $.load(destId);
      if (!destRoom) {
        await self.tell('Room #' + destId + ' not found.');
        return;
      }

      // 2. Exit direction
      const exitDirection = await $.prompt.question(self, 'Exit direction (e.g., north): ');
      if (!exitDirection) {
        await self.tell('Cancelled.');
        return;
      }

      // 3. Create return exit?
      const createReturn = await $.prompt.yesorno(self, 'Create return exit?');
      let returnDirection = null;
      if (createReturn) {
        returnDirection = await $.prompt.question(self, 'Return direction: ');
      }

      // 4. Confirm
      await self.tell('\\r\\n=== Confirm ===');
      await self.tell('From: ' + currentRoom.name + ' (#' + currentRoom.id + ')');
      await self.tell('To: ' + destRoom.name + ' (#' + destRoom.id + ')');
      await self.tell('Direction: ' + exitDirection);
      if (returnDirection) {
        await self.tell('Return: ' + returnDirection);
      }

      const confirmed = await $.prompt.yesorno(self, '\\r\\nCreate exit?');
      if (!confirmed) {
        await self.tell('Cancelled.');
        return;
      }

      // 5. Create exits
      const aliases = $.system.aliases || {};
      const exitProtoId = aliases.exit;
      if (!exitProtoId) {
        await self.tell('Error: Exit prototype not found.');
        return;
      }

      const exitToNew = await $.create({
        parent: exitProtoId,
        properties: {
          name: exitDirection,
          aliases: self.getExitAliases(exitDirection),
          destRoom: destRoom.id,
        },
      });
      await currentRoom.addExit(exitToNew);
      await self.tell('Created exit ' + exitDirection + ' (#' + exitToNew.id + ')');

      if (returnDirection) {
        const exitToCurrent = await $.create({
          parent: exitProtoId,
          properties: {
            name: returnDirection,
            aliases: self.getExitAliases(returnDirection),
            destRoom: currentRoom.id,
          },
        });
        await destRoom.addExit(exitToCurrent);
        await self.tell('Created exit ' + returnDirection + ' (#' + exitToCurrent.id + ')');
      }

      await self.tell('\\r\\nDone!');
    `);

    // @unlink - Remove an exit
    obj.setMethod('@unlink', `
      /** Remove an exit from current room.
       *  Usage: @unlink <direction>
       */
      const direction = command.replace('@unlink', '').trim().toLowerCase();
      if (!direction) {
        await self.tell('Usage: @unlink <direction>');
        return;
      }

      const currentRoom = self.location ? await $.load(self.location) : null;
      if (!currentRoom) {
        await self.tell('You must be in a room.');
        return;
      }

      const exit = await currentRoom.findExit(direction);
      if (!exit) {
        await self.tell('No exit "' + direction + '" found in this room.');
        return;
      }

      const confirmed = await $.prompt.yesorno(self, 'Remove exit ' + exit.name + ' (#' + exit.id + ')?');
      if (!confirmed) {
        await self.tell('Cancelled.');
        return;
      }

      await currentRoom.removeExit(exit);
      await self.tell('Removed exit ' + exit.name + '.');
    `);

    // @set - Set a property on an object
    obj.setMethod('@set', `
      /** Set a property on an object.
       *  Usage: @set #123.property = value
       *  Usage: @set here.property = value
       */
      const input = command.replace('@set', '').trim();
      const match = input.match(/^(#?\\d+|here|me)\\.([\\w]+)\\s*=\\s*(.+)$/i);

      if (!match) {
        await self.tell('Usage: @set #123.property = value');
        await self.tell('       @set here.property = value');
        await self.tell('       @set me.property = value');
        return;
      }

      const targetRef = match[1].toLowerCase();
      const propName = match[2];
      const valueStr = match[3];

      // Resolve target
      let target;
      if (targetRef === 'here') {
        target = self.location ? await $.load(self.location) : null;
      } else if (targetRef === 'me') {
        target = self;
      } else {
        const targetId = parseInt(targetRef.replace('#', ''), 10);
        target = await $.load(targetId);
      }

      if (!target) {
        await self.tell('Object not found.');
        return;
      }

      // Parse value - try JSON first, then string
      let value;
      try {
        value = JSON.parse(valueStr);
      } catch {
        value = valueStr;
      }

      // Set the property
      target.set(propName, value);
      await self.tell('Set ' + target.name + ' (#' + target.id + ').' + propName + ' = ' + JSON.stringify(value));
    `);

    // @create - Create a generic object
    obj.setMethod('@create', `
      /** Create a new object.
       *  Usage: @create [parent_id]
       */
      const parentStr = command.replace('@create', '').trim();

      await self.tell('=== @create: Create Object ===\\r\\n');

      // 1. Parent
      let parentId;
      if (parentStr) {
        parentId = parseInt(parentStr.replace('#', ''), 10);
      } else {
        const parentInput = await $.prompt.question(self, 'Parent object ID [1]: ');
        parentId = parentInput ? parseInt(parentInput.replace('#', ''), 10) : 1;
      }

      if (isNaN(parentId)) {
        await self.tell('Invalid parent ID.');
        return;
      }

      // 2. Name
      const name = await $.prompt.question(self, 'Object name: ');
      if (!name) {
        await self.tell('Cancelled.');
        return;
      }

      // 3. Description
      const description = await $.prompt.question(self, 'Description: ');

      // 4. Create
      const newObj = await $.create({
        parent: parentId,
        properties: {
          name: name,
          description: description || '',
        },
      });

      await self.tell('Created object #' + newObj.id + ': ' + name);
    `);

    // @destroy - Destroy an object
    obj.setMethod('@destroy', `
      /** Destroy an object.
       *  Usage: @destroy #123
       */
      const input = command.replace('@destroy', '').trim();
      const targetId = parseInt(input.replace('#', ''), 10);

      if (isNaN(targetId)) {
        await self.tell('Usage: @destroy #123');
        return;
      }

      const target = await $.load(targetId);
      if (!target) {
        await self.tell('Object #' + targetId + ' not found.');
        return;
      }

      // Safety checks
      if (targetId < 10) {
        await self.tell('Cannot destroy system objects (ID < 10).');
        return;
      }

      await self.tell('Object: #' + target.id + ' ' + target.name);
      await self.tell('Description: ' + (target.description || '(none)'));

      const confirmed = await $.prompt.yesorno(self, '\\r\\nDestroy this object? This cannot be undone!');
      if (!confirmed) {
        await self.tell('Cancelled.');
        return;
      }

      await $.destroy(targetId);
      await self.tell('Destroyed object #' + targetId + '.');
    `);
  }

  private addTeleportCommands(obj: RuntimeObject): void {
    // @teleport - Move to any room
    obj.setMethod('@teleport', `
      /** Teleport to a room.
       *  Usage: @teleport #123
       *  Usage: @teleport <x> <y> [z]
       */
      const input = command.replace('@teleport', '').replace('@tp', '').trim();

      let destRoom;

      // Check if it's coordinates
      const coordMatch = input.match(/^(-?\\d+)\\s+(-?\\d+)(?:\\s+(-?\\d+))?$/);
      if (coordMatch) {
        const x = parseInt(coordMatch[1], 10);
        const y = parseInt(coordMatch[2], 10);
        const z = coordMatch[3] ? parseInt(coordMatch[3], 10) : 0;

        // Find room at coordinates
        // This is inefficient but works for now - should have spatial index
        const aliases = $.system.aliases || {};
        const roomProtoId = aliases.room;

        // Search all objects for matching room
        // TODO: Use a proper spatial index
        await self.tell('Searching for room at ' + x + ',' + y + ',' + z + '...');

        // For now, just tell them we can't search
        await self.tell('Coordinate search not implemented. Use @teleport #roomId instead.');
        return;
      }

      // Must be an object ID
      const destId = parseInt(input.replace('#', ''), 10);
      if (isNaN(destId)) {
        await self.tell('Usage: @teleport #roomId');
        await self.tell('       @teleport x y [z]');
        return;
      }

      destRoom = await $.load(destId);
      if (!destRoom) {
        await self.tell('Room #' + destId + ' not found.');
        return;
      }

      // Move there
      await self.moveTo(destRoom, self);
      await self.tell('\\r\\nTeleported to #' + destRoom.id + ': ' + destRoom.name);

      // Show room description
      if (destRoom.describe) {
        const desc = await destRoom.describe(self);
        await self.tell(desc);
      }
    `);

    // Register @tp as alias
    obj.setMethod('@tp', `
      // Alias for @teleport
      const newCommand = command.replace('@tp', '@teleport');
      return await self['@teleport']();
    `);

    // @goto - Teleport to player (by name)
    obj.setMethod('@goto', `
      /** Teleport to a player's location.
       *  Usage: @goto playername
       */
      const targetName = command.replace('@goto', '').trim().toLowerCase();
      if (!targetName) {
        await self.tell('Usage: @goto <playername>');
        return;
      }

      // Find player by name
      const authMgr = await $.load($.system.aliases.authManager);
      if (!authMgr || !authMgr.findPlayerByName) {
        await self.tell('Cannot search for players.');
        return;
      }

      const targetPlayer = await authMgr.findPlayerByName(targetName);
      if (!targetPlayer) {
        await self.tell('Player "' + targetName + '" not found.');
        return;
      }

      if (!targetPlayer.location) {
        await self.tell(targetPlayer.name + ' is not in a room.');
        return;
      }

      const destRoom = await $.load(targetPlayer.location);
      if (!destRoom) {
        await self.tell('Could not load ' + targetPlayer.name + "'s location.");
        return;
      }

      await self.moveTo(destRoom, self);
      await self.tell('\\r\\nTeleported to ' + targetPlayer.name + ' at #' + destRoom.id + ': ' + destRoom.name);

      if (destRoom.describe) {
        const desc = await destRoom.describe(self);
        await self.tell(desc);
      }
    `);

    // @summon - Bring a player here
    obj.setMethod('@summon', `
      /** Summon a player to your location.
       *  Usage: @summon playername
       */
      const targetName = command.replace('@summon', '').trim().toLowerCase();
      if (!targetName) {
        await self.tell('Usage: @summon <playername>');
        return;
      }

      const currentRoom = self.location ? await $.load(self.location) : null;
      if (!currentRoom) {
        await self.tell('You must be in a room to summon someone.');
        return;
      }

      // Find player by name
      const authMgr = await $.load($.system.aliases.authManager);
      if (!authMgr || !authMgr.findPlayerByName) {
        await self.tell('Cannot search for players.');
        return;
      }

      const targetPlayer = await authMgr.findPlayerByName(targetName);
      if (!targetPlayer) {
        await self.tell('Player "' + targetName + '" not found.');
        return;
      }

      await targetPlayer.moveTo(currentRoom, self);
      await self.tell('Summoned ' + targetPlayer.name + ' to your location.');
      await targetPlayer.tell('\\r\\nYou have been summoned by ' + self.name + '!');

      if (currentRoom.describe) {
        const desc = await currentRoom.describe(targetPlayer);
        await targetPlayer.tell(desc);
      }
    `);
  }

  private addInspectCommands(obj: RuntimeObject): void {
    // @examine - Deep inspect an object
    obj.setMethod('@examine', `
      /** Examine an object's internals.
       *  Usage: @examine #123
       *  Usage: @examine here
       *  Usage: @examine me
       */
      const input = command.replace('@examine', '').replace('@x', '').trim();

      let target;
      const lowerInput = input.toLowerCase();

      if (lowerInput === 'here') {
        target = self.location ? await $.load(self.location) : null;
      } else if (lowerInput === 'me') {
        target = self;
      } else {
        const targetId = parseInt(input.replace('#', ''), 10);
        if (!isNaN(targetId)) {
          target = await $.load(targetId);
        }
      }

      if (!target) {
        await self.tell('Usage: @examine #123 | here | me');
        return;
      }

      await self.tell('=== Object #' + target.id + ' ===');
      await self.tell('Name: ' + target.name);
      await self.tell('Parent: #' + (target.parent || 'none'));
      await self.tell('Location: #' + (target.location || 'none'));

      // Show coordinates if room
      if (target.x !== undefined) {
        await self.tell('Coordinates: ' + target.x + ',' + target.y + ',' + target.z);
      }

      // Show contents
      const contents = target.contents || [];
      if (contents.length > 0) {
        await self.tell('Contents: ' + contents.map(id => '#' + id).join(', '));
      }

      // Show exits if room
      const exits = target.exits || [];
      if (exits.length > 0) {
        await self.tell('Exits: ' + exits.map(id => '#' + id).join(', '));
      }

      // Show key properties
      await self.tell('\\r\\n--- Properties ---');
      const skipProps = ['name', 'description', 'parent', 'location', 'contents', 'exits', 'x', 'y', 'z'];
      const props = target.getProperties ? target.getProperties() : {};

      for (const [key, value] of Object.entries(props)) {
        if (skipProps.includes(key)) continue;
        if (key.startsWith('_')) continue; // Skip internal

        let displayValue;
        if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
          if (displayValue.length > 60) {
            displayValue = displayValue.substring(0, 57) + '...';
          }
        } else {
          displayValue = String(value);
        }
        await self.tell('  ' + key + ': ' + displayValue);
      }

      // Show methods
      await self.tell('\\r\\n--- Methods ---');
      const methods = target.getMethods ? target.getMethods() : {};
      const methodNames = Object.keys(methods);
      if (methodNames.length > 0) {
        await self.tell('  ' + methodNames.join(', '));
      } else {
        await self.tell('  (none)');
      }
    `);

    // @x as alias for @examine
    obj.setMethod('@x', `
      const newCommand = command.replace('@x', '@examine');
      return await self['@examine']();
    `);

    // @find - Find objects by name or type
    obj.setMethod('@find', `
      /** Find objects matching criteria.
       *  Usage: @find <name pattern>
       */
      const pattern = command.replace('@find', '').trim().toLowerCase();
      if (!pattern) {
        await self.tell('Usage: @find <name pattern>');
        return;
      }

      await self.tell('Searching for objects matching "' + pattern + '"...');
      await self.tell('(Object search not fully implemented yet)');
      // TODO: Implement object search
    `);

    // @where - Show coordinates
    obj.setMethod('@where', `
      /** Show current room coordinates.
       *  Usage: @where
       */
      const currentRoom = self.location ? await $.load(self.location) : null;
      if (!currentRoom) {
        await self.tell('You are not in a room.');
        return;
      }

      const x = currentRoom.x || 0;
      const y = currentRoom.y || 0;
      const z = currentRoom.z || 0;

      await self.tell('Current location: ' + currentRoom.name + ' (#' + currentRoom.id + ')');
      await self.tell('Coordinates: ' + x + ', ' + y + ', ' + z);
    `);

    // @setVerb - Set/edit a method on an object using multiline input
    obj.setMethod('@setVerb', `
      /** Set a method on an object using multiline input.
       *  Usage: @setVerb #123 methodName
       *  Usage: @setVerb here methodName
       */
      const input = command.replace(/@setverb|@setVerb/i, '').trim();
      const match = input.match(/^(#?\\d+|here|me)\\s+(\\w+)$/i);

      if (!match) {
        await self.tell('Usage: @setVerb #123 methodName');
        await self.tell('       @setVerb here methodName');
        return;
      }

      const targetRef = match[1].toLowerCase();
      const methodName = match[2];

      // Resolve target
      let target;
      if (targetRef === 'here') {
        target = self.location ? await $.load(self.location) : null;
      } else if (targetRef === 'me') {
        target = self;
      } else {
        const targetId = parseInt(targetRef.replace('#', ''), 10);
        target = await $.load(targetId);
      }

      if (!target) {
        await self.tell('Object not found.');
        return;
      }

      await self.tell('=== @setVerb: ' + target.name + ' (#' + target.id + ').' + methodName + ' ===');

      // Show existing method if any
      const methods = target.getMethods ? target.getMethods() : {};
      if (methods[methodName]) {
        await self.tell('Current code:');
        await self.tell(methods[methodName]);
        await self.tell('');
      }

      await self.tell('Enter method code (end with . on its own line):');

      const code = await $.prompt.multiline(self);

      if (!code || code.trim() === '') {
        await self.tell('Empty code - cancelled.');
        return;
      }

      // Confirm
      await self.tell('\\r\\n--- Code Preview ---');
      await self.tell(code);
      await self.tell('--- End Preview ---\\r\\n');

      const confirmed = await $.prompt.yesorno(self, 'Set this method?');
      if (!confirmed) {
        await self.tell('Cancelled.');
        return;
      }

      // Set the method
      target.setMethod(methodName, code);
      await self.tell('Set ' + target.name + ' (#' + target.id + ').' + methodName);
    `);

    // @listVerbs - List all methods on an object
    obj.setMethod('@listVerbs', `
      /** List all methods on an object.
       *  Usage: @listVerbs #123
       */
      const input = command.replace(/@listverbs|@listVerbs/i, '').trim();

      let target;
      const lowerInput = input.toLowerCase();

      if (lowerInput === 'here') {
        target = self.location ? await $.load(self.location) : null;
      } else if (lowerInput === 'me') {
        target = self;
      } else {
        const targetId = parseInt(input.replace('#', ''), 10);
        if (!isNaN(targetId)) {
          target = await $.load(targetId);
        }
      }

      if (!target) {
        await self.tell('Usage: @listVerbs #123 | here | me');
        return;
      }

      await self.tell('=== Methods on ' + target.name + ' (#' + target.id + ') ===');

      const methods = target.getMethods ? target.getMethods() : {};
      const methodNames = Object.keys(methods);

      if (methodNames.length === 0) {
        await self.tell('(no methods)');
        return;
      }

      for (const name of methodNames.sort()) {
        const code = methods[name];
        const lines = code.split('\\n').length;
        const preview = code.substring(0, 50).replace(/\\n/g, ' ');
        await self.tell('  ' + name + ' (' + lines + ' lines): ' + preview + (code.length > 50 ? '...' : ''));
      }
    `);

    // @rmVerb - Remove a method from an object
    obj.setMethod('@rmVerb', `
      /** Remove a method from an object.
       *  Usage: @rmVerb #123 methodName
       */
      const input = command.replace(/@rmverb|@rmVerb/i, '').trim();
      const match = input.match(/^(#?\\d+|here|me)\\s+(\\w+)$/i);

      if (!match) {
        await self.tell('Usage: @rmVerb #123 methodName');
        return;
      }

      const targetRef = match[1].toLowerCase();
      const methodName = match[2];

      // Resolve target
      let target;
      if (targetRef === 'here') {
        target = self.location ? await $.load(self.location) : null;
      } else if (targetRef === 'me') {
        target = self;
      } else {
        const targetId = parseInt(targetRef.replace('#', ''), 10);
        target = await $.load(targetId);
      }

      if (!target) {
        await self.tell('Object not found.');
        return;
      }

      const methods = target.getMethods ? target.getMethods() : {};
      if (!methods[methodName]) {
        await self.tell(target.name + ' (#' + target.id + ') has no method "' + methodName + '".');
        return;
      }

      const confirmed = await $.prompt.yesorno(self, 'Remove ' + target.name + '.' + methodName + '?');
      if (!confirmed) {
        await self.tell('Cancelled.');
        return;
      }

      target.removeMethod(methodName);
      await self.tell('Removed ' + target.name + ' (#' + target.id + ').' + methodName);
    `);
  }

  private addEvalCommands(obj: RuntimeObject): void {
    // @eval - Execute single-line MOO code
    obj.setMethod('@eval', `
      /** Execute arbitrary MOO code.
       *  Usage: @eval <code>
       *  Example: @eval self.name = "Test"
       *  Example: @eval await $.load(42).describe()
       *
       *  Available variables: self, $, args, player, context
       */
      const code = args[0];

      if (!code) {
        await self.tell('Usage: @eval <code>');
        await self.tell('Example: @eval self.name');
        await self.tell('Example: @eval await $.load(42).describe()');
        return;
      }

      try {
        // Wrap in async function to allow await
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction('self', '$', 'args', 'player', 'context',
          'return (async () => { return (' + code + '); })();'
        );

        const result = await fn(self, $, [], player, context);

        // Format result
        if (result === undefined) {
          await self.tell('=> undefined');
        } else if (result === null) {
          await self.tell('=> null');
        } else if (typeof result === 'object' && result.id !== undefined) {
          // RuntimeObject
          await self.tell('=> #' + result.id + ' (' + (result.name || 'unnamed') + ')');
        } else if (typeof result === 'object') {
          await self.tell('=> ' + JSON.stringify(result, null, 2));
        } else {
          await self.tell('=> ' + String(result));
        }
      } catch (err) {
        await self.tell('Error: ' + err.message);
      }
    `);

    // @evalm - Execute multiline MOO code
    obj.setMethod('@evalm', `
      /** Execute multiline MOO code using $.prompt.multiline.
       *  Enter code, then '.' on its own line to execute.
       *
       *  Available variables: self, $, args, player, context
       */
      await self.tell('Enter MOO code (end with . on its own line):');
      await self.tell('Available: self, $, player, context');
      await self.tell('---');

      const code = await $.prompt.multiline(self, '');

      if (!code || code.trim() === '') {
        await self.tell('Cancelled (empty input).');
        return;
      }

      await self.tell('---');
      await self.tell('Executing...');

      try {
        // Wrap in async function to allow await and multiple statements
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction('self', '$', 'args', 'player', 'context',
          code
        );

        const result = await fn(self, $, [], player, context);

        // Format result
        if (result === undefined) {
          await self.tell('=> undefined');
        } else if (result === null) {
          await self.tell('=> null');
        } else if (typeof result === 'object' && result.id !== undefined) {
          // RuntimeObject
          await self.tell('=> #' + result.id + ' (' + (result.name || 'unnamed') + ')');
        } else if (typeof result === 'object') {
          await self.tell('=> ' + JSON.stringify(result, null, 2));
        } else {
          await self.tell('=> ' + String(result));
        }
      } catch (err) {
        await self.tell('Error: ' + err.message);
        if (err.stack) {
          // Show first few lines of stack
          const stackLines = err.stack.split('\\n').slice(0, 3);
          for (const line of stackLines) {
            await self.tell('  ' + line);
          }
        }
      }
    `);
  }
}
