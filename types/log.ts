/**
 * Game logging types - used for metagaming detection and analysis
 *
 * IMPORTANT: This system is infrastructure-only. MOO code has no access.
 * Players and agents cannot query, modify, or see these logs.
 *
 * DESIGN: We log COMMANDS, not actions. Every player input is logged as a
 * command with verb/args. This gives us everything we need:
 * - "north" → verb="north" (movement)
 * - "say hello" → verb="say", args="hello" (speech)
 * - "eat apple" → verb="eat", args="apple" (action)
 */

import type { ObjId } from './object.js';
import type { ObjectId } from 'mongodb';

/**
 * Log event types - kept minimal
 */
export type LogType =
  | 'connect'     // Player connected
  | 'disconnect'  // Player disconnected
  | 'auth'        // Successful authentication
  | 'auth_fail'   // Failed authentication
  | 'command';    // Player command (universal - captures everything)

/**
 * Log entry - all logs have these fields
 */
export interface LogEntry {
  _id?: ObjectId;

  /** High-precision timestamp */
  ts: Date;

  /** Event type */
  type: LogType;

  /** Who performed the action (player ID, -1 for unauthenticated) */
  actor: ObjId;

  /** Where it happened (room ID) */
  location?: ObjId;

  /** Session ID (tracks individual connections) */
  session: string;

  /** IP address (for multi-account detection) */
  ip?: string;

  /** Timing data for bot detection */
  timing?: {
    /** Milliseconds since last command from this session */
    sinceLast: number;
    /** Average command rate (commands per minute) for this session */
    rate: number;
  };

  /** Event-specific details */
  details?: Record<string, any>;
}

/**
 * Query options for log retrieval
 */
export interface LogQuery {
  /** Filter by event types */
  types?: LogType[];

  /** Filter by actor */
  actor?: ObjId;

  /** Filter by location */
  location?: ObjId;

  /** Filter by session */
  session?: string;

  /** Filter by IP */
  ip?: string;

  /** Time range start */
  from?: Date;

  /** Time range end */
  to?: Date;

  /** Maximum results */
  limit?: number;

  /** Skip first N results */
  skip?: number;

  /** Sort order (default: descending by time) */
  sort?: 'asc' | 'desc';
}

/**
 * Command pattern analysis for bot detection
 */
export interface CommandPattern {
  /** Player ID */
  actor: ObjId;

  /** Time window analyzed */
  window: {
    from: Date;
    to: Date;
  };

  /** Commands per minute */
  commandRate: number;

  /** Average time between commands (ms) */
  avgInterval: number;

  /** Standard deviation of intervals (low = bot-like) */
  intervalStdDev: number;

  /** Most common commands */
  topCommands: { command: string; count: number }[];
}

/**
 * Coordination pattern detection for metagaming
 */
export interface CoordinationPattern {
  /** Players involved */
  players: ObjId[];

  /** Time window analyzed */
  window: {
    from: Date;
    to: Date;
  };

  /** Times they were in the same location */
  colocations: number;

  /** Times they interacted (based on command patterns) */
  interactions: number;

  /** Suspicion score (0-1) */
  suspicionScore: number;

  /** Reasons for suspicion */
  flags: string[];
}
