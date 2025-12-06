/**
 * System Object Type Extensions
 * Defines types for system-level utility objects
 */

import { ParsedCommand, CombatResult, PlayerStats, Direction, RoomExit } from './game';

/**
 * System object - provides core utility methods
 * Object #2 in the database
 */
export interface SystemObject extends RuntimeObject {
  /**
   * Parse user command input into structured format
   * @param input - Raw command string from user
   * @returns Parsed command object
   */
  parseCommand(input: string): Promise<ParsedCommand>;

  /**
   * Roll dice for random number generation
   * @param sides - Number of sides on the die
   * @param count - Number of dice to roll
   * @returns Sum of all dice rolls
   */
  rollDice(sides: number, count?: number): Promise<number>;

  /**
   * Format a timestamp into human-readable string
   * @param timestamp - Unix timestamp or Date
   * @returns Formatted date string
   */
  formatTime(timestamp: number | Date): Promise<string>;

  /**
   * Calculate combat damage based on stats
   * @param attacker - Attacking object
   * @param defender - Defending object
   * @returns Combat result with damage and messages
   */
  calculateCombat(attacker: RuntimeObject, defender: RuntimeObject): Promise<CombatResult>;

  /**
   * Broadcast message to all players in a room
   * @param roomId - Room object ID
   * @param message - Message to broadcast
   * @param exclude - Optional player ID to exclude from broadcast
   */
  broadcastToRoom(roomId: number, message: string, exclude?: number): Promise<void>;

  /**
   * Send message to specific player
   * @param playerId - Player object ID
   * @param message - Message text
   */
  sendToPlayer(playerId: number, message: string): Promise<void>;

  /**
   * Log system event for debugging
   * @param level - Log level (info, warn, error)
   * @param message - Log message
   * @param data - Additional data to log
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): Promise<void>;
}

/**
 * Authentication Manager
 * Object #3 in the database
 */
export interface AuthManagerObject extends RuntimeObject {
  /**
   * Authenticate a user by username and password
   * @param username - User's username
   * @param password - User's password
   * @returns Player object ID if authenticated, null otherwise
   */
  authenticate(username: string, password: string): Promise<number | null>;

  /**
   * Create new player account
   * @param username - Desired username
   * @param password - Desired password
   * @param email - Email address
   * @returns New player object ID
   */
  createAccount(username: string, password: string, email: string): Promise<number>;

  /**
   * Check if username is available
   * @param username - Username to check
   * @returns True if available
   */
  isUsernameAvailable(username: string): Promise<boolean>;

  /**
   * Change player password
   * @param playerId - Player object ID
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @returns True if successful
   */
  changePassword(playerId: number, oldPassword: string, newPassword: string): Promise<boolean>;
}

/**
 * Combat Manager
 * Object #4 in the database
 */
export interface CombatManagerObject extends RuntimeObject {
  /**
   * Initiate combat between two objects
   * @param attackerId - Attacking object ID
   * @param defenderId - Defending object ID
   * @returns Combat result
   */
  attack(attackerId: number, defenderId: number): Promise<CombatResult>;

  /**
   * Apply damage to an object
   * @param targetId - Target object ID
   * @param damage - Amount of damage
   * @param source - Source of damage (for logging)
   * @returns True if target died
   */
  applyDamage(targetId: number, damage: number, source: string): Promise<boolean>;

  /**
   * Heal an object
   * @param targetId - Target object ID
   * @param amount - Amount to heal
   * @returns New health value
   */
  heal(targetId: number, amount: number): Promise<number>;

  /**
   * Check if object is in combat
   * @param objectId - Object ID to check
   * @returns True if in combat
   */
  isInCombat(objectId: number): Promise<boolean>;
}

/**
 * Extend the global ObjectManager to include typed system objects
 */
declare global {
  interface ObjectManager {
    /** System utilities (Object #2) */
    readonly system: SystemObject;

    /** Authentication manager (Object #3) */
    readonly auth: AuthManagerObject;

    /** Combat manager (Object #4) */
    readonly combat: CombatManagerObject;
  }
}
