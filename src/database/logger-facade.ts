/**
 * Logger Facade - Exposes GameLogger as a pseudo-RuntimeObject
 *
 * This is an INFRASTRUCTURE object:
 * - id = -1 (invalid object ID, will fail $.isValid())
 * - parent = -1 (no parent)
 * - NOT stored in MongoDB
 * - NOT a real RuntimeObject
 * - Cannot be recycled, modified, or replaced
 *
 * Exposed as $.logger but blocks all attempts to modify it.
 */

import { getGameLogger } from './game-logger.js';
import type { ObjId } from '../../types/object.js';
import type {
  LogQuery,
  CommandPattern,
  CoordinationPattern,
} from '../../types/log.js';

/**
 * LoggerFacade - looks like a RuntimeObject but is pure TypeScript
 */
export class LoggerFacade {
  /** Always -1 - marks this as an infrastructure object */
  readonly id: ObjId = -1;

  /** Always -1 - no parent */
  readonly parent: ObjId = -1;

  /** Name for display */
  readonly name = 'logger';

  /** Description */
  readonly description = 'Infrastructure logging system - not a game object';

  /**
   * Check if this is a valid game object (always false)
   */
  isValid(): boolean {
    return false;
  }

  /**
   * Block get - no properties
   */
  get(_prop: string): undefined {
    return undefined;
  }

  /**
   * Block set - immutable
   */
  set(_prop: string, _value: any): void {
    throw new Error('Cannot modify $.logger - infrastructure object');
  }

  /**
   * Block call - use typed methods instead
   */
  async call(_method: string, ..._args: any[]): Promise<any> {
    throw new Error('$.logger methods are not callable via call() - use typed methods directly');
  }

  // ==========================================================================
  // Query Methods (admin-only in practice, but access control is at MOO layer)
  // ==========================================================================

  /**
   * Query logs with filters
   */
  async query(query: LogQuery) {
    const logger = getGameLogger();
    if (!logger) {
      throw new Error('Logger not initialized');
    }
    return logger.query(query);
  }

  /**
   * Analyze command patterns for bot detection
   */
  async analyzeCommandPattern(
    actor: ObjId,
    windowMinutes = 60
  ): Promise<CommandPattern | null> {
    const logger = getGameLogger();
    if (!logger) {
      throw new Error('Logger not initialized');
    }
    return logger.analyzeCommandPattern(actor, windowMinutes);
  }

  /**
   * Analyze coordination between players
   */
  async analyzeCoordination(
    players: ObjId[],
    windowHours = 24
  ): Promise<CoordinationPattern> {
    const logger = getGameLogger();
    if (!logger) {
      throw new Error('Logger not initialized');
    }
    return logger.analyzeCoordination(players, windowHours);
  }

  /**
   * Get activity summary for a player
   */
  async getPlayerActivity(actor: ObjId, windowHours = 24) {
    const logger = getGameLogger();
    if (!logger) {
      throw new Error('Logger not initialized');
    }
    return logger.getPlayerActivity(actor, windowHours);
  }
}

/**
 * Singleton instance
 */
let loggerFacade: LoggerFacade | null = null;

/**
 * Get the logger facade singleton
 */
export function getLoggerFacade(): LoggerFacade {
  if (!loggerFacade) {
    loggerFacade = new LoggerFacade();
  }
  return loggerFacade;
}

/**
 * Reserved alias names that cannot be overwritten
 * These are infrastructure objects backed by TypeScript, not MongoDB
 */
export const RESERVED_ALIASES = new Set([
  'logger',
  // Future: 'scheduler', 'network', etc.
]);
