/**
 * Game Logger - Infrastructure-only logging for metagaming detection
 *
 * IMPORTANT: This is NOT exposed to MOO code. Players and agents have no access.
 * All logging happens automatically at the TypeScript layer.
 */

import { Db, Collection } from 'mongodb';
import type { ObjId } from '../../types/object.js';
import type {
  LogEntry,
  LogType,
  LogQuery,
  CommandPattern,
  CoordinationPattern,
} from '../../types/log.js';

/**
 * Session timing state for bot detection
 */
interface SessionTiming {
  lastCommand: Date;
  commandCount: number;
  windowStart: Date;
}

/**
 * GameLogger - Writes to a separate 'logs' collection
 * Invisible to the game layer.
 */
export class GameLogger {
  private collection!: Collection<LogEntry>;
  private connected = false;

  /** Track timing per session for bot detection */
  private sessionTimings = new Map<string, SessionTiming>();

  constructor(private db: Db) {}

  /**
   * Initialize the logger - create collection and indexes
   */
  async init(): Promise<void> {
    if (this.connected) return;

    this.collection = this.db.collection<LogEntry>('logs');

    // Create indexes for efficient querying
    await Promise.all([
      // Time-based queries (most common)
      this.collection.createIndex({ ts: -1 }),

      // Player activity queries
      this.collection.createIndex({ actor: 1, ts: -1 }),

      // Session tracking
      this.collection.createIndex({ session: 1, ts: -1 }),

      // Event type filtering
      this.collection.createIndex({ type: 1, ts: -1 }),

      // Location-based queries (who was where)
      this.collection.createIndex({ location: 1, ts: -1 }),

      // IP tracking (multi-account detection)
      this.collection.createIndex({ ip: 1, ts: -1 }),

      // Compound: player + type + time (common pattern detection query)
      this.collection.createIndex({ actor: 1, type: 1, ts: -1 }),

      // Compound: location + time (who was in room when)
      this.collection.createIndex({ location: 1, type: 1, ts: -1 }),

      // TTL index - auto-delete logs older than 90 days
      // Comment out if you want to keep logs forever
      // this.collection.createIndex({ ts: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }),
    ]);

    this.connected = true;
  }

  /**
   * Calculate timing data for bot detection
   */
  private getTiming(session: string): { sinceLast: number; rate: number } {
    const now = new Date();
    const timing = this.sessionTimings.get(session);

    if (!timing) {
      // First command in session
      this.sessionTimings.set(session, {
        lastCommand: now,
        commandCount: 1,
        windowStart: now,
      });
      return { sinceLast: 0, rate: 0 };
    }

    const sinceLast = now.getTime() - timing.lastCommand.getTime();
    const windowMs = now.getTime() - timing.windowStart.getTime();
    const rate = windowMs > 0 ? (timing.commandCount / windowMs) * 60000 : 0;

    // Update timing
    timing.lastCommand = now;
    timing.commandCount++;

    // Reset window every 5 minutes to keep rate current
    if (windowMs > 5 * 60 * 1000) {
      timing.windowStart = now;
      timing.commandCount = 1;
    }

    return { sinceLast, rate };
  }

  /**
   * Clear session timing (on disconnect)
   */
  clearSession(session: string): void {
    this.sessionTimings.delete(session);
  }

  /**
   * Log an event
   */
  async log(
    type: LogType,
    actor: ObjId,
    session: string,
    options: {
      target?: ObjId;
      location?: ObjId;
      ip?: string;
      details?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const timing = this.getTiming(session);

    const entry: LogEntry = {
      ts: new Date(),
      type,
      actor,
      session,
      timing,
      ...options,
    };

    // Fire and forget - don't block game logic for logging
    this.collection.insertOne(entry).catch((err) => {
      // Silently fail - logging should never break the game
      console.error('[GameLogger] Failed to write log:', err.message);
    });
  }

  /**
   * Log a connection event
   */
  async logConnect(
    session: string,
    ip: string,
    transport: 'telnet' | 'websocket' | 'tls'
  ): Promise<void> {
    await this.log('connect', -1, session, {
      ip,
      details: { transport },
    });
  }

  /**
   * Log authentication
   */
  async logAuth(
    session: string,
    actor: ObjId,
    ip: string,
    success: boolean,
    username: string
  ): Promise<void> {
    await this.log(success ? 'auth' : 'auth_fail', actor, session, {
      ip,
      details: { username },
    });
  }

  /**
   * Log a command (universal - captures all player actions)
   */
  async logCommand(
    session: string,
    actor: ObjId,
    location: ObjId,
    raw: string,
    verb?: string,
    args?: string,
    ip?: string
  ): Promise<void> {
    await this.log('command', actor, session, {
      location,
      ip,
      details: { raw, verb, args },
    });
  }

  /**
   * Log disconnect
   */
  async logDisconnect(
    session: string,
    actor: ObjId,
    reason?: string
  ): Promise<void> {
    await this.log('disconnect', actor, session, {
      details: { reason },
    });
    this.clearSession(session);
  }

  /**
   * Query logs
   */
  async query(query: LogQuery): Promise<LogEntry[]> {
    const filter: Record<string, any> = {};

    if (query.types?.length) {
      filter.type = { $in: query.types };
    }
    if (query.actor !== undefined) {
      filter.actor = query.actor;
    }
    if (query.location !== undefined) {
      filter.location = query.location;
    }
    if (query.session) {
      filter.session = query.session;
    }
    if (query.ip) {
      filter.ip = query.ip;
    }
    if (query.from || query.to) {
      filter.ts = {};
      if (query.from) filter.ts.$gte = query.from;
      if (query.to) filter.ts.$lte = query.to;
    }

    const cursor = this.collection
      .find(filter)
      .sort({ ts: query.sort === 'asc' ? 1 : -1 });

    if (query.skip) cursor.skip(query.skip);
    if (query.limit) cursor.limit(query.limit);

    return cursor.toArray();
  }

  /**
   * Analyze command patterns for a player (bot detection)
   */
  async analyzeCommandPattern(
    actor: ObjId,
    windowMinutes: number = 60
  ): Promise<CommandPattern | null> {
    const from = new Date(Date.now() - windowMinutes * 60 * 1000);
    const to = new Date();

    const logs = await this.query({
      types: ['command'],
      actor,
      from,
      to,
      sort: 'asc',
    });

    if (logs.length < 10) {
      return null; // Not enough data
    }

    // Calculate intervals between commands
    const intervals: number[] = [];
    for (let i = 1; i < logs.length; i++) {
      intervals.push(logs[i].ts.getTime() - logs[i - 1].ts.getTime());
    }

    const avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Calculate standard deviation
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // Count command frequency
    const commandCounts = new Map<string, number>();
    for (const log of logs) {
      const verb = log.details?.verb || log.details?.raw?.split(' ')[0] || 'unknown';
      commandCounts.set(verb, (commandCounts.get(verb) || 0) + 1);
    }

    const topCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const windowMs = to.getTime() - from.getTime();
    const commandRate = (logs.length / windowMs) * 60000;

    return {
      actor,
      window: { from, to },
      commandRate,
      avgInterval,
      intervalStdDev: stdDev,
      topCommands,
    };
  }

  /**
   * Analyze coordination between players (metagaming detection)
   * Uses command logs to detect patterns like:
   * - Players frequently in same location
   * - Simultaneous login times
   * - Shared IP addresses
   */
  async analyzeCoordination(
    players: ObjId[],
    windowHours: number = 24
  ): Promise<CoordinationPattern> {
    const from = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const to = new Date();

    const flags: string[] = [];
    let colocations = 0;
    let interactions = 0;

    // Get all command logs for these players
    const playerLogs = await Promise.all(
      players.map((p) =>
        this.query({
          types: ['command'],
          actor: p,
          from,
          to,
        })
      )
    );

    // Build location timeline for each player
    const locationTimelines = playerLogs.map((logs) => {
      return logs.map((l) => ({ ts: l.ts.getTime(), location: l.location }));
    });

    // Count colocations: times when players were in same location within 1 minute
    const COLOCATION_WINDOW = 60 * 1000; // 1 minute
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        for (const log1 of locationTimelines[i]) {
          for (const log2 of locationTimelines[j]) {
            if (
              log1.location &&
              log1.location === log2.location &&
              Math.abs(log1.ts - log2.ts) < COLOCATION_WINDOW
            ) {
              colocations++;
            }
          }
        }
      }
    }

    // Check for simultaneous login patterns
    const connectLogs = await Promise.all(
      players.map((p) =>
        this.query({
          types: ['connect'],
          actor: p,
          from,
          to,
        })
      )
    );

    // Check if players login within 5 minutes of each other frequently
    const loginTimes = connectLogs.flat().map((l) => l.ts.getTime()).sort();
    let closeLogins = 0;
    for (let i = 1; i < loginTimes.length; i++) {
      if (loginTimes[i] - loginTimes[i - 1] < 5 * 60 * 1000) {
        closeLogins++;
      }
    }

    // Calculate suspicion score
    let suspicionScore = 0;

    // High colocation rate
    const colocationRate = colocations / windowHours;
    if (colocationRate > 2) {
      suspicionScore += 0.2;
      flags.push(`High colocation rate: ${colocationRate.toFixed(1)}/hour`);
    }

    if (closeLogins > 3) {
      suspicionScore += 0.3;
      flags.push(`Frequent simultaneous logins: ${closeLogins}`);
    }

    // Check for shared IP
    const ipsByPlayer = connectLogs.map((logs) =>
      new Set(logs.map((l) => l.ip).filter(Boolean))
    );
    const allIps = new Set(ipsByPlayer.flatMap((s) => [...s]));
    for (const ip of allIps) {
      const playersWithIp = ipsByPlayer.filter((s) => s.has(ip as string)).length;
      if (playersWithIp > 1) {
        suspicionScore += 0.4;
        flags.push(`Shared IP detected: ${ip}`);
        break;
      }
    }

    suspicionScore = Math.min(1, suspicionScore);

    return {
      players,
      window: { from, to },
      colocations,
      interactions,
      suspicionScore,
      flags,
    };
  }

  /**
   * Get activity summary for a player
   * Parses command verbs to categorize activity
   */
  async getPlayerActivity(
    actor: ObjId,
    windowHours: number = 24
  ): Promise<{
    commands: number;
    movements: number;
    messages: number;
    connections: number;
    uniqueLocations: number;
  }> {
    const from = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const logs = await this.query({
      actor,
      from,
    });

    const locations = new Set<ObjId>();
    let commands = 0;
    let movements = 0;
    let messages = 0;
    let connections = 0;

    // Verbs that indicate movement
    const movementVerbs = new Set([
      'north', 'south', 'east', 'west', 'up', 'down',
      'n', 's', 'e', 'w', 'u', 'd',
      'ne', 'nw', 'se', 'sw',
      'northeast', 'northwest', 'southeast', 'southwest',
      'go', 'enter', 'leave', 'exit', 'climb',
    ]);

    // Verbs that indicate speech
    const speechVerbs = new Set([
      'say', 'whisper', 'emote', 'shout', 'yell', 'tell', 'ask',
    ]);

    for (const log of logs) {
      if (log.location) locations.add(log.location);

      switch (log.type) {
        case 'command': {
          commands++;
          const verb = log.details?.verb?.toLowerCase();
          if (verb && movementVerbs.has(verb)) {
            movements++;
          } else if (verb && speechVerbs.has(verb)) {
            messages++;
          }
          break;
        }
        case 'connect':
          connections++;
          break;
      }
    }

    return {
      commands,
      movements,
      messages,
      connections,
      uniqueLocations: locations.size,
    };
  }
}

/**
 * Global logger instance - set during server initialization
 */
let globalLogger: GameLogger | null = null;

/**
 * Initialize the global logger
 */
export async function initGameLogger(db: Db): Promise<GameLogger> {
  globalLogger = new GameLogger(db);
  await globalLogger.init();
  return globalLogger;
}

/**
 * Get the global logger instance
 */
export function getGameLogger(): GameLogger | null {
  return globalLogger;
}
