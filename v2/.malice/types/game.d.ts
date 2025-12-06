/**
 * Core Game Types
 * Shared types used across all MOO methods
 */

/** Player statistics */
export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
  level: number;
  experience: number;
}

/** Direction for room exits */
export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down' | 'northeast' | 'northwest' | 'southeast' | 'southwest';

/** Room exit definition */
export interface RoomExit {
  direction: Direction;
  targetRoom: number;
  description?: string;
  locked?: boolean;
  hidden?: boolean;
}

/** Inventory item */
export interface Item {
  id: number;
  name: string;
  description: string;
  weight: number;
  value: number;
  equipSlot?: 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'amulet';
}

/** Combat result */
export interface CombatResult {
  damage: number;
  criticalHit: boolean;
  message: string;
  targetDied: boolean;
}

/** Parsed command from user input */
export interface ParsedCommand {
  verb: string;
  directObject?: string;
  preposition?: string;
  indirectObject?: string;
  fullText: string;
}

/** Game event */
export interface GameEvent {
  type: 'combat' | 'movement' | 'interaction' | 'system';
  source: number;
  target?: number;
  data: any;
  timestamp: Date;
}

/** Enhanced Player Object */
export interface PlayerObject extends RuntimeObject {
  name: string;
  stats: PlayerStats;
  location: number;
  inventory: number[];
  equipment: Partial<Record<'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'amulet', number>>;
  title?: string;
  description?: string;
}

/** Enhanced Room Object */
export interface RoomObject extends RuntimeObject {
  name: string;
  description: string;
  exits: RoomExit[];
  contents: number[]; // Object IDs in this room
  dark?: boolean;
  noTeleport?: boolean;
}

/** Enhanced Item Object */
export interface ItemObject extends RuntimeObject {
  name: string;
  description: string;
  weight: number;
  value: number;
  location: number; // Where the item is (room or player)
  equipSlot?: 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'amulet';
  damage?: number;
  armor?: number;
}

/** Enhanced NPC/Mob Object */
export interface NPCObject extends RuntimeObject {
  name: string;
  description: string;
  location: number;
  stats: PlayerStats;
  hostile: boolean;
  respawnTime?: number;
  lootTable?: number[];
}
