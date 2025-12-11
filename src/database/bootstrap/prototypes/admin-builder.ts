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
    this.addAliasCommands(obj);
    this.addEvalCommands(obj);
    this.addDoorCommands(obj);
    this.addElevatorCommands(obj);

    return obj;
  }

  /** Elevator management commands */
  private addElevatorCommands(obj: RuntimeObject): void {
    // @elevator — interactive elevator creation/wiring
    obj.setMethod('@elevator', `
      // Menu-driven elevator management
      const aliases = $.system.aliases || {};
      const elevProto = aliases.elevator;
      if (!elevProto) {
        await self.tell('Elevator prototype not found.');
        return;
      }

      const menu = async () => {
        await self.tell('--- @elevator ---');
        await self.tell('[1] Create new elevator');
        await self.tell('[2] Attach existing elevator to this room (as in/out)');
        await self.tell('[3] Configure existing elevator (id)');
        await self.tell('[0] Done');
        const choice = await $.prompt.question(self, 'Choice: ');
        return choice && choice.trim();
      };

      let exitLoop = false;
      while (!exitLoop) {
        const choice = await menu();
        if (choice === null) break;
        switch (choice) {
          case '1': {
            // Create elevator and minimal wiring
            const name = await $.prompt.question(self, 'Elevator name: ');
            const floorsStr = await $.prompt.question(self, 'Floors (comma-separated numbers): ');
            if (floorsStr === null) break;
            const floors = floorsStr.split(',').map(f => parseInt(f.trim(), 10)).filter(n => !isNaN(n));
            if (!floors.length) { await self.tell('No valid floors.'); break; }
            const currentFloor = floors[0];
            const elev = await $.create({ parent: elevProto, properties: { name: name || 'Elevator', floors, currentFloor, floorRooms: {} } });
            await self.tell('Created elevator #' + elev.id + ' (' + (elev.name || '') + ').');
            break;
          }
          case '2': {
            const elevIdStr = await $.prompt.question(self, 'Elevator id to attach: ');
            const eid = elevIdStr ? parseInt(elevIdStr, 10) : NaN;
            if (isNaN(eid)) { await self.tell('Invalid id.'); break; }
            const elev = await $.load(eid);
            if (!elev) { await self.tell('Elevator not found.'); break; }
            const currentRoom = self.location ? await $.load(self.location) : null;
            if (!currentRoom) { await self.tell('You are nowhere.'); break; }
            // Attach in/out exits to this room (avoid duplicates)
            const exitProto = aliases.exit;
            if (!exitProto) { await self.tell('Exit prototype not found.'); break; }
            const roomExits = currentRoom.exits || [];
            const elevExits = elev.exits || [];

            // in -> elevator (from room)
            let inExit = roomExits.find(ex => {
              const exObj = typeof ex === 'number' ? null : ex;
              return exObj && exObj.destRoom === elev.id;
            });
            if (!inExit) {
              inExit = await $.create({ parent: exitProto, properties: { name: 'in', aliases: ['in','i'], destRoom: elev.id } });
              await currentRoom.addExit(inExit);
            }

            // out -> room (from elevator)
            let outExit = elevExits.find(ex => {
              const exObj = typeof ex === 'number' ? null : ex;
              return exObj && exObj.destRoom === currentRoom.id;
            });
            if (!outExit) {
              outExit = await $.create({ parent: exitProto, properties: { name: 'out', aliases: ['out','o'], destRoom: currentRoom.id } });
              await elev.addExit(outExit);
            }

            // Optionally map this room to a floor
            const mapNow = await $.prompt.yesorno(self, 'Map this room to a floor number?');
            if (mapNow) {
              const fStr = await $.prompt.question(self, 'Floor number to map to this room: ');
              const fnum = fStr ? parseInt(fStr, 10) : NaN;
              if (!isNaN(fnum)) {
                const fr = elev.floorRooms || {};
                fr[fnum] = currentRoom.id;
                elev.floorRooms = fr;
                if (!Array.isArray(elev.floors)) elev.floors = [];
                if (!elev.floors.includes(fnum)) elev.floors.push(fnum);
                elev.currentFloor = fnum;
                await self.tell('Mapped floor ' + fnum + ' to room #' + currentRoom.id + ', added to floors list, and set current floor.');
              }
            }

            // Optionally attach a door to this elevator
            const attachDoor = await $.prompt.yesorno(self, 'Attach a door object to this elevator?');
            if (attachDoor) {
              const doorIdStr = await $.prompt.question(self, 'Door object id (blank to cancel): ');
              const did = doorIdStr ? parseInt(doorIdStr, 10) : NaN;
              if (!isNaN(did)) {
                elev.door = did;
                await self.tell('Attached door #' + did + ' to elevator.');
              }
            }

            await self.tell('Attached elevator #' + eid + ' to this room (in/out exits ensured both ways).');
            break;
          }
          case '3': {
            const elevIdStr = await $.prompt.question(self, 'Elevator id to configure: ');
            const eid = elevIdStr ? parseInt(elevIdStr, 10) : NaN;
            if (isNaN(eid)) { await self.tell('Invalid id.'); break; }
            const elev = await $.load(eid);
            if (!elev) { await self.tell('Elevator not found.'); break; }
            await self.tell('Elevator #' + eid + ' (' + (elev.name || '') + ')');
            let cfgDone = false;
            while (!cfgDone) {
              const floors = elev.floors || [];
              const locksDetailed = [];
              for (const l of elev.locks || []) {
                const obj = typeof l === 'number' ? await $.load(l) : l;
                const id = typeof l === 'number' ? l : l.id;
                locksDetailed.push('#' + id + (obj?.name ? ' ' + obj.name : ''));
              }
              const doorInfo = elev.door ? ('#' + (typeof elev.door === 'number' ? elev.door : elev.door.id)) : 'none';
              await self.tell('Floors: ' + floors.join(', '));
              await self.tell('Locks: ' + (locksDetailed.join(', ') || 'none'));
              await self.tell('Door: ' + doorInfo);
              await self.tell('[a] Set floors\n[b] Set floorRooms\n[c] Add lock (id)\n[d] Add lock by type\n[e] Remove lock (id)\n[f] Attach door (id)\n[g] Set travel time per floor\n[h] Set capacity\n[i] Set current floor\n[0] Done');
              const sub = await $.prompt.question(self, 'Choice: ');
              if (sub === null) { cfgDone = true; break; }
              switch ((sub || '').trim()) {
                case 'a': {
                  const floorsStr2 = await $.prompt.question(self, 'Floors (comma-separated numbers): ');
                  if (floorsStr2 !== null) {
                    const nf = floorsStr2.split(',').map(f => parseInt(f.trim(), 10)).filter(n => !isNaN(n));
                    if (nf.length) elev.floors = nf;
                  }
                  break;
                }
                case 'b': {
                  const floorNumStr = await $.prompt.question(self, 'Floor number to map: ');
                  const fnum = floorNumStr ? parseInt(floorNumStr, 10) : NaN;
                  if (isNaN(fnum)) { await self.tell('Invalid floor.'); break; }
                  const roomIdStr = await $.prompt.question(self, 'Room id for floor ' + fnum + ': ');
                  const rid = roomIdStr ? parseInt(roomIdStr, 10) : NaN;
                  if (isNaN(rid)) { await self.tell('Invalid room id.'); break; }
                  const fr = elev.floorRooms || {};
                  fr[fnum] = rid;
                  elev.floorRooms = fr;
                  await self.tell('Mapped floor ' + fnum + ' -> room #' + rid + '.');
                  break;
                }
                case 'c': {
                  const lockIdStr = await $.prompt.question(self, 'Lock object id to add: ');
                  const lid = lockIdStr ? parseInt(lockIdStr, 10) : NaN;
                  if (isNaN(lid)) { await self.tell('Invalid id.'); break; }
                  const existing = elev.locks || [];
                  if (!existing.some(l => (typeof l === 'number' ? l : l.id) === lid)) {
                    existing.push(lid);
                    elev.locks = existing;
                    await self.tell('Added lock #' + lid + '.');
                  } else {
                    await self.tell('Lock already present.');
                  }
                  break;
                }
                case 'd': {
                  const aliasMap = $.system.aliases || {};
                  const lockAliases = Object.keys(aliasMap).filter(k => k.toLowerCase().includes('lock'));
                  if (lockAliases.length) {
                    await self.tell('Known lock aliases: ' + lockAliases.join(', '));
                  }
                  const lockType = await $.prompt.question(self, 'Lock prototype alias: ');
                  if (!lockType) { await self.tell('Cancelled.'); break; }
                  const protoId = aliasMap[lockType];
                  if (!protoId) { await self.tell('Unknown lock prototype alias.'); break; }
                  const newLock = await $.recycler.create(protoId, {});
                  const existing = elev.locks || [];
                  existing.push(newLock.id);
                  elev.locks = existing;
                  await self.tell('Created and added lock #' + newLock.id + ' (' + (newLock.name || lockType) + ').');
                  break;
                }
                case 'e': {
                  const lockIdStr = await $.prompt.question(self, 'Lock object id to remove: ');
                  const lid = lockIdStr ? parseInt(lockIdStr, 10) : NaN;
                  if (isNaN(lid)) { await self.tell('Invalid id.'); break; }
                  elev.locks = (elev.locks || []).filter(l => (typeof l === 'number' ? l : l.id) !== lid);
                  await self.tell('Removed lock #' + lid + '.');
                  break;
                }
                case 'f': {
                  const doorIdStr = await $.prompt.question(self, 'Door object id to attach: ');
                  const did = doorIdStr ? parseInt(doorIdStr, 10) : NaN;
                  if (isNaN(did)) { await self.tell('Invalid id.'); break; }
                  elev.door = did;
                  await self.tell('Attached door #' + did + ' to elevator.');
                  break;
                }
                case 'g': {
                  const tStr = await $.prompt.question(self, 'Travel time per floor (ms): ');
                  const t = tStr ? parseInt(tStr, 10) : NaN;
                  if (!isNaN(t)) { elev.travelTimePerFloor = t; await self.tell('Set to ' + t + ' ms.'); }
                  break;
                }
                case 'h': {
                  const capStr = await $.prompt.question(self, 'Capacity: ');
                  const cap = capStr ? parseInt(capStr, 10) : NaN;
                  if (!isNaN(cap)) { elev.capacity = cap; await self.tell('Capacity set to ' + cap + '.'); }
                  break;
                }
                case 'i': {
                  const cfStr = await $.prompt.question(self, 'Current floor: ');
                  const cf = cfStr ? parseInt(cfStr, 10) : NaN;
                  if (!isNaN(cf)) { elev.currentFloor = cf; await self.tell('Current floor set to ' + cf + '.'); }
                  break;
                }
                case '0':
                  cfgDone = true;
                  break;
                default:
                  await self.tell('Invalid choice.');
              }
            }
            break;
          }
          case '0':
            exitLoop = true;
            break;
          default:
            await self.tell('Invalid choice.');
        }
      }
    `);
  }

  /** Door/exit management commands */

  private addDoorCommands(obj: RuntimeObject): void {
    // @door <direction> — interactive door/lock management for an exit
    obj.setMethod('@door', `
      const direction = (args[0] || '').toLowerCase();
      if (!direction) {
        await self.tell('Usage: @door <direction>');
        return;
      }

      const currentRoom = self.location ? await $.load(self.location) : null;
      if (!currentRoom) {
        await self.tell('You are nowhere.');
        return;
      }

      const exits = currentRoom.exits || [];
      const exit = exits.find(ex => ex && ex.matches && ex.matches(direction));
      if (!exit) {
        await self.tell('No exit in that direction.');
        return;
      }

      const exitObj = typeof exit === 'number' ? await $.load(exit) : exit;
      if (!exitObj) {
        await self.tell('Exit not found.');
        return;
      }

      // Resolve or create the door
      let door = exitObj.door ? await $.load(exitObj.door) : null;
      const aliases = $.system.aliases || {};
      const doorProto = aliases.door;
      if (!door && !doorProto) {
        await self.tell('Door prototype not found.');
        return;
      }

      if (!door) {
        const name = (exitObj.name || 'Exit') + ' Door';
        door = await $.create({
          parent: doorProto,
          properties: { name }
        });
        exitObj.door = door.id;

        // Attach to reverse exit if present
        const dest = exitObj.destRoom ? await $.load(exitObj.destRoom) : null;
        if (dest && dest.exits) {
          const rev = dest.exits.find(ex => ex && ex.matches && ex.matches(exitObj.getReverseDirection ? exitObj.getReverseDirection() : ''));
          if (rev) {
            const revObj = typeof rev === 'number' ? await $.load(rev) : rev;
            if (revObj) revObj.door = door.id;
          }
        }
      }

      const doorObj = door;

      // Menu loop
      let done = false;
      while (!done) {
        const stateLocked = doorObj.locked ? 'locked' : 'unlocked';
        const stateOpen = doorObj.open ? 'open' : 'closed';
        const locksDetailed = [];
        for (const l of doorObj.locks || []) {
          const obj = typeof l === 'number' ? await $.load(l) : l;
          const id = typeof l === 'number' ? l : l.id;
          locksDetailed.push('#' + id + (obj?.name ? ' ' + obj.name : ''));
        }
        const locks = locksDetailed.join(', ') || 'none';
        const code = doorObj.code ? '(set)' : '(none)';
        await self.tell('--- @door ' + direction + ' ---');
        await self.tell('Door #' + doorObj.id + ' ' + (doorObj.name || '') + '\nState: ' + stateLocked + ', ' + stateOpen + '\nLocks: ' + locks + '\nCode: ' + code);
        await self.tell('[1] Toggle locked\n[2] Toggle open\n[3] Set/clear code\n[4] Add lock (id)\n[5] Add lock by type\n[6] Remove lock (id)\n[7] Rename door\n[8] Set description\n[9] Attach door to elevator (by id)\n[0] Done');

        const choice = await $.prompt.question(self, 'Choice: ');
        if (choice === null) { done = true; break; }
        switch (choice.trim()) {
          case '1':
            doorObj.locked = !doorObj.locked;
            await self.tell('Door is now ' + (doorObj.locked ? 'locked' : 'unlocked') + '.');
            break;
          case '2':
            doorObj.open = !doorObj.open;
            await self.tell('Door is now ' + (doorObj.open ? 'open' : 'closed') + '.');
            break;
          case '3': {
            const newCode = await $.prompt.question(self, 'Enter code (blank to clear): ');
            if (newCode === '') {
              doorObj.code = null;
              await self.tell('Code cleared.');
            } else if (newCode !== null) {
              doorObj.code = newCode;
              await self.tell('Code set.');
            }
            break;
          }
          case '4': {
            const lockIdStr = await $.prompt.question(self, 'Lock object id to add: ');
            const lid = lockIdStr ? parseInt(lockIdStr, 10) : NaN;
            if (isNaN(lid)) { await self.tell('Invalid id.'); break; }
            const existing = doorObj.locks || [];
            if (!existing.some(l => (typeof l === 'number' ? l : l.id) === lid)) {
              existing.push(lid);
              doorObj.locks = existing;
              await self.tell('Added lock #' + lid + '.');
            } else {
              await self.tell('Lock already present.');
            }
            break;
          }
          case '5': {
            // Add lock by type
            const aliasMap = $.system.aliases || {};
            const lockAliases = Object.keys(aliasMap).filter(k => k.toLowerCase().includes('lock'));
            if (lockAliases.length) {
              await self.tell('Known lock aliases: ' + lockAliases.join(', '));
            }
            const lockType = await $.prompt.question(self, 'Lock prototype alias (e.g., biometricLock, keycardLock): ');
            if (!lockType) { await self.tell('Cancelled.'); break; }
            const protoId = aliasMap[lockType];
            if (!protoId) { await self.tell('Unknown lock prototype alias.'); break; }
            const newLock = await $.recycler.create(protoId, {});
            const existing = doorObj.locks || [];
            existing.push(newLock.id);
            doorObj.locks = existing;
            await self.tell('Created and added lock #' + newLock.id + ' (' + (newLock.name || lockType) + ').');
            break;
          }
          case '6': {
            const lockIdStr = await $.prompt.question(self, 'Lock object id to remove: ');
            const lid = lockIdStr ? parseInt(lockIdStr, 10) : NaN;
            if (isNaN(lid)) { await self.tell('Invalid id.'); break; }
            doorObj.locks = (doorObj.locks || []).filter(l => (typeof l === 'number' ? l : l.id) !== lid);
            await self.tell('Removed lock #' + lid + '.');
            break;
          }
          case '7': {
            const newName = await $.prompt.question(self, 'Door name: ');
            if (newName !== null && newName !== '') {
              doorObj.name = newName;
              await self.tell('Name set.');
            }
            break;
          }
          case '8': {
            const newDesc = await $.prompt.question(self, 'Door description: ');
            if (newDesc !== null) {
              doorObj.description = newDesc;
              await self.tell('Description set.');
            }
            break;
          }
          case '9': {
            const elevIdStr = await $.prompt.question(self, 'Elevator object id to attach this door to: ');
            const eid = elevIdStr ? parseInt(elevIdStr, 10) : NaN;
            if (isNaN(eid)) { await self.tell('Invalid id.'); break; }
            const elev = await $.load(eid);
            if (!elev) { await self.tell('Elevator not found.'); break; }
            elev.door = doorObj.id;
            await self.tell('Door #' + doorObj.id + ' attached to elevator #' + eid + '.');
            break;
          }
          case '0':
            done = true;
            break;
          default:
            await self.tell('Invalid choice.');
        }
      }
    `);
  }


  private addConnectionOverride(obj: RuntimeObject): void {
    // Override connect to add admin verbs after parent's connect
    obj.setMethod('connect', `
      // Register admin verbs BEFORE calling parent
      // (so admin message appears before prompt)
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
      await self.registerVerb('@aliases', self);
      await self.registerVerb(['@alias %s'], self, '@alias');
      await self.registerVerb(['@unalias %s'], self, '@unalias');

      // Call parent's connect (Player -> registers player verbs, shows welcome, prompt)
      await pass(args[0]);

      // Show admin commands after welcome but before we're done
      // Note: prompt was already shown by parent, so this appears after
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

  private addAliasCommands(obj: RuntimeObject): void {
    // @aliases - List all system aliases
    obj.setMethod('@aliases', `
      /** List all system aliases ($.* objects).
       *  Usage: @aliases
       */
      const aliases = $.system.aliases || {};

      await self.tell('=== System Aliases ($.name -> #id) ===');

      // Separate into categories
      const prototypes = [];
      const utilities = [];
      const bodyParts = {};

      for (const [name, value] of Object.entries(aliases)) {
        if (name === 'bodyParts' && typeof value === 'object') {
          // Nested body parts
          Object.assign(bodyParts, value);
          continue;
        }

        // Check if it's a prototype (has typical prototype names)
        const protoNames = ['describable', 'location', 'exit', 'room', 'agent', 'embodied',
          'human', 'player', 'admin', 'decayable', 'corpse', 'humanRemains', 'skeletalRemains',
          'wound', 'edible', 'food', 'drink', 'stomachContents', 'bodyPart', 'wearable', 'clothing',
          'nothing', 'root', 'system', 'object_manager'];

        if (protoNames.includes(name)) {
          prototypes.push([name, value]);
        } else {
          utilities.push([name, value]);
        }
      }

      // Show utilities first
      if (utilities.length > 0) {
        await self.tell('\\r\\n--- Utilities ---');
        for (const [name, id] of utilities.sort((a, b) => a[0].localeCompare(b[0]))) {
          const obj = await $.load(id);
          const desc = obj ? obj.name || '(no name)' : '(not found)';
          await self.tell('  $.' + name + ' -> #' + id + ' (' + desc + ')');
        }
      }

      // Show prototypes
      if (prototypes.length > 0) {
        await self.tell('\\r\\n--- Prototypes ---');
        for (const [name, id] of prototypes.sort((a, b) => a[0].localeCompare(b[0]))) {
          await self.tell('  $.' + name + ' -> #' + id);
        }
      }

      // Show body parts if any
      const bodyPartNames = Object.keys(bodyParts);
      if (bodyPartNames.length > 0) {
        await self.tell('\\r\\n--- Body Part Prototypes ---');
        for (const name of bodyPartNames.sort()) {
          await self.tell('  $.bodyParts.' + name + ' -> #' + bodyParts[name]);
        }
      }

      await self.tell('\\r\\nTotal: ' + Object.keys(aliases).length + ' aliases');
    `);

    // @alias - Create or show an alias
    obj.setMethod('@alias', `
      /** Create or view a system alias.
       *  Usage: @alias name=#123     - Set alias
       *  Usage: @alias name          - Show alias
       *  Usage: @alias name=         - Clear alias
       *
       *  Examples:
       *    @alias myUtil=#42         - Create $.myUtil pointing to #42
       *    @alias myUtil             - Show what $.myUtil points to
       *    @alias myUtil=            - Remove $.myUtil
       */
      const input = args[0];
      if (!input) {
        await self.tell('Usage: @alias name=#123  (set)');
        await self.tell('       @alias name       (show)');
        await self.tell('       @alias name=      (clear)');
        return;
      }

      const aliases = $.system.aliases || {};

      // Check if setting or viewing
      const setMatch = input.match(/^(\\w+)\\s*=\\s*(.*)$/);

      if (setMatch) {
        const name = setMatch[1];
        const valueStr = setMatch[2].trim();

        // Clearing?
        if (!valueStr) {
          if (aliases[name] === undefined) {
            await self.tell('Alias $.' + name + ' does not exist.');
            return;
          }

          // Protect system aliases
          const protected = ['nothing', 'object_manager', 'root', 'system'];
          if (protected.includes(name)) {
            await self.tell('Cannot remove protected alias $.' + name);
            return;
          }

          delete aliases[name];
          $.system.aliases = aliases;
          await self.tell('Removed alias $.' + name);
          return;
        }

        // Setting
        const objId = parseInt(valueStr.replace('#', ''), 10);
        if (isNaN(objId)) {
          await self.tell('Invalid object ID: ' + valueStr);
          await self.tell('Usage: @alias name=#123');
          return;
        }

        // Verify object exists
        const obj = await $.load(objId);
        if (!obj) {
          await self.tell('Object #' + objId + ' not found.');
          return;
        }

        // Protect system aliases from being overwritten
        const protected = ['nothing', 'object_manager', 'root', 'system'];
        if (protected.includes(name) && aliases[name] !== undefined) {
          await self.tell('Cannot overwrite protected alias $.' + name);
          return;
        }

        aliases[name] = objId;
        $.system.aliases = aliases;
        await self.tell('Set $.' + name + ' -> #' + objId + ' (' + (obj.name || 'unnamed') + ')');

      } else {
        // Viewing
        const name = input.trim();
        if (aliases[name] === undefined) {
          await self.tell('Alias $.' + name + ' does not exist.');
          await self.tell('Use @aliases to list all aliases.');
          return;
        }

        const objId = aliases[name];
        if (typeof objId === 'object') {
          // Nested object (like bodyParts)
          await self.tell('$.' + name + ' = {');
          for (const [k, v] of Object.entries(objId)) {
            await self.tell('  ' + k + ': #' + v);
          }
          await self.tell('}');
        } else {
          const obj = await $.load(objId);
          await self.tell('$.' + name + ' -> #' + objId + ' (' + (obj?.name || 'not found') + ')');
        }
      }
    `);

    // @unalias - Remove an alias
    obj.setMethod('@unalias', `
      /** Remove a system alias.
       *  Usage: @unalias name
       */
      const name = args[0];
      if (!name) {
        await self.tell('Usage: @unalias <name>');
        return;
      }

      const aliases = $.system.aliases || {};

      if (aliases[name] === undefined) {
        await self.tell('Alias $.' + name + ' does not exist.');
        return;
      }

      // Protect system aliases
      const protected = ['nothing', 'object_manager', 'root', 'system'];
      if (protected.includes(name)) {
        await self.tell('Cannot remove protected alias $.' + name);
        return;
      }

      const oldId = aliases[name];
      delete aliases[name];
      $.system.aliases = aliases;
      await self.tell('Removed alias $.' + name + ' (was #' + oldId + ')');
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
       *  Available variables: self, $, player, context
       */
      // args[0] contains the captured %s from "@eval %s"
      const code = args[0];

      if (!code) {
        await player.tell('Usage: @eval <code>');
        await player.tell('Example: @eval self.name');
        await player.tell('Example: @eval await $.load(42).describe()');
        return;
      }

      try {
        const AsyncFunction = (async function(){}).constructor;
        const fn = new AsyncFunction('self', '$', 'player', 'context',
          'return (async () => { return (' + code + '); })();'
        );

        const result = await fn(self, $, player, context);

        if (result === undefined) {
          await player.tell('=> undefined');
        } else if (result === null) {
          await player.tell('=> null');
        } else if (typeof result === 'object' && result.id !== undefined) {
          await player.tell('=> #' + result.id + ' (' + (result.name || 'unnamed') + ')');
        } else if (typeof result === 'object') {
          try {
            await player.tell('=> ' + JSON.stringify(result, null, 2));
          } catch {
            await player.tell('=> [object]');
          }
        } else {
          await player.tell('=> ' + String(result));
        }
      } catch (err) {
        await player.tell('Error: ' + err.message);
      }
    `);

    // @evalm - Execute multiline MOO code
    obj.setMethod('@evalm', `
      /** Execute multiline MOO code using $.prompt.multiline.
       *  Enter code, then '.' on its own line to execute.
       *  Type @abort to cancel.
       *
       *  Available variables: self, $, player, context
       */
      await player.tell('Enter MOO code (end with . on its own line, @abort to cancel):');
      await player.tell('Available: self, $, player, context');
      await player.tell('---');

      let code;
      try {
        code = await $.prompt.multiline(player, '');
      } catch (err) {
        if (err.message && err.message.includes('Aborted by user')) {
          await player.tell('Aborted.');
          return;
        }
        throw err;
      }

      if (!code || code.trim() === '') {
        await player.tell('Cancelled (empty input).');
        return;
      }

      await player.tell('---');
      await player.tell('Executing...');

      try {
        const AsyncFunction = (async function(){}).constructor;
        const fn = new AsyncFunction('self', '$', 'player', 'context', code);

        const result = await fn(self, $, player, context);

        if (result === undefined) {
          await player.tell('=> undefined');
        } else if (result === null) {
          await player.tell('=> null');
        } else if (typeof result === 'object' && result.id !== undefined) {
          await player.tell('=> #' + result.id + ' (' + (result.name || 'unnamed') + ')');
        } else if (typeof result === 'object') {
          try {
            await player.tell('=> ' + JSON.stringify(result, null, 2));
          } catch {
            await player.tell('=> [object]');
          }
        } else {
          await player.tell('=> ' + String(result));
        }
      } catch (err) {
        await player.tell('Error: ' + err.message);
        if (err.stack) {
          const stackLines = err.stack.split('\\n').slice(0, 3);
          for (const line of stackLines) {
            await player.tell('  ' + line);
          }
        }
      }
    `);
  }
}
