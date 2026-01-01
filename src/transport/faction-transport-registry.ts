/**
 * FactionTransportRegistry - Manages transport bundles for all factions
 *
 * This is the main registry that creates/destroys faction transport bundles.
 * Exposed to MOO code as $transports.
 */

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type {
  FactionPorts,
  FactionTransportConfig,
  FactionTransportTypes,
} from '../../types/transport';
import { calculateFactionPorts } from '../config/faction-ports';
import type { Connection } from '../connection/connection';
import type { ObjectManager } from '../database/object-manager';
import { FactionBundle } from './faction-bundle';

/**
 * Information about a registered faction's transports
 */
export interface FactionInfo {
  factionId: number;
  name: string;
  domain?: string;
  ports: FactionPorts;
  connectionCount: number;
  online: boolean;
}

/**
 * Options for creating a faction transport bundle
 */
export interface CreateFactionOptions {
  /** Faction object ID */
  factionId: number;
  /** Faction name (for logging) */
  name: string;
  /** Web domain for HTTP Host routing */
  domain?: string;
  /** Faction index for port allocation (auto-assigned if not provided) */
  index?: number;
  /** Pre-allocated ports (calculated from index if not provided) */
  ports?: FactionPorts;
  /** Which transports to enable (defaults: http=domain set, ws=true, sessionMcp=false) */
  transports?: FactionTransportTypes;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Registry of faction transport bundles
 */
export class FactionTransportRegistry {
  private readonly destroyed$ = new Subject<void>();

  /** Map of factionId -> FactionBundle */
  private bundles = new Map<number, FactionBundle>();

  /** Next auto-assigned index for port allocation */
  private nextIndex = 0;

  /** Merged connection stream from all factions */
  public readonly connection$ = new Subject<Connection>();

  /** Debug mode */
  private debug: boolean;

  /** Object manager for HTTP server integration */
  private manager: ObjectManager | null = null;

  constructor(options?: { debug?: boolean; manager?: ObjectManager }) {
    this.debug = options?.debug ?? false;
    this.manager = options?.manager ?? null;
  }

  /**
   * Set the object manager (for HTTP server integration)
   */
  setManager(manager: ObjectManager): void {
    this.manager = manager;
    // Update existing bundles
    for (const bundle of this.bundles.values()) {
      bundle.setManager(manager);
    }
  }

  /**
   * Create a transport bundle for a faction
   * @returns The allocated ports
   */
  async create(options: CreateFactionOptions): Promise<FactionPorts> {
    const { factionId, name, domain, debug, transports } = options;

    // Check if already exists
    if (this.bundles.has(factionId)) {
      throw new Error(`Faction ${factionId} already has a transport bundle`);
    }

    // Allocate index if not provided
    const index = options.index ?? this.nextIndex++;

    // Calculate or use provided ports
    const ports = options.ports ?? calculateFactionPorts(index);

    // Determine enabled transports for logging
    const enabledTransports = [];
    if (transports?.http ?? !!domain)
      enabledTransports.push(`HTTP ${ports.http}`);
    if (transports?.ws ?? true) enabledTransports.push(`WS ${ports.ws}`);
    if (transports?.sessionMcp ?? false)
      enabledTransports.push(`SessionMCP ${ports.sessionMcp}`);

    if (this.debug || debug) {
      console.log(
        `[FactionRegistry] Creating transport bundle for ${name} (#${factionId})`,
      );
      console.log(`  Enabled: ${enabledTransports.join(', ') || 'none'}`);
    }

    // Create bundle config
    const config: FactionTransportConfig = {
      factionId,
      name,
      domain,
      ports,
      transports,
      debug: this.debug || debug,
    };

    // Create and start bundle (pass manager for HTTP server)
    const bundle = new FactionBundle(config, this.manager ?? undefined);

    // Forward connections to merged stream
    bundle.connection$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (conn) => this.connection$.next(conn),
    });

    // Start the bundle
    await bundle.start();

    // Register
    this.bundles.set(factionId, bundle);

    if (this.debug || debug) {
      console.log(`[FactionRegistry] Transport bundle for ${name} is online`);
    }

    return ports;
  }

  /**
   * Destroy a faction's transport bundle
   */
  async destroy(
    factionId: number,
    options?: { gracefulTimeoutMs?: number; message?: string },
  ): Promise<void> {
    const bundle = this.bundles.get(factionId);
    if (!bundle) {
      if (this.debug) {
        console.warn(
          `[FactionRegistry] No bundle found for faction ${factionId}`,
        );
      }
      return;
    }

    if (this.debug) {
      console.log(
        `[FactionRegistry] Destroying transport bundle for faction ${factionId}`,
      );
    }

    await bundle.stop(options);
    this.bundles.delete(factionId);

    if (this.debug) {
      console.log(
        `[FactionRegistry] Transport bundle for faction ${factionId} destroyed`,
      );
    }
  }

  /**
   * Get info about a faction's transports
   */
  get(factionId: number): FactionInfo | null {
    const bundle = this.bundles.get(factionId);
    if (!bundle) return null;

    return {
      factionId: bundle.config.factionId,
      name: bundle.config.name,
      domain: bundle.config.domain,
      ports: bundle.ports,
      connectionCount: bundle.getConnectionCount(),
      online: true,
    };
  }

  /**
   * List all registered factions
   */
  list(): FactionInfo[] {
    const result: FactionInfo[] = [];
    for (const bundle of this.bundles.values()) {
      result.push({
        factionId: bundle.config.factionId,
        name: bundle.config.name,
        domain: bundle.config.domain,
        ports: bundle.ports,
        connectionCount: bundle.getConnectionCount(),
        online: true,
      });
    }
    return result;
  }

  /**
   * Get connection count for a faction
   */
  getConnectionCount(factionId: number): number {
    const bundle = this.bundles.get(factionId);
    return bundle?.getConnectionCount() ?? 0;
  }

  /**
   * Get all connections for a faction
   */
  getConnections(factionId: number): Connection[] {
    const bundle = this.bundles.get(factionId);
    return bundle?.getConnections() ?? [];
  }

  /**
   * Get total connection count across all factions
   */
  getTotalConnectionCount(): number {
    let total = 0;
    for (const bundle of this.bundles.values()) {
      total += bundle.getConnectionCount();
    }
    return total;
  }

  /**
   * Check if a faction has a transport bundle
   */
  has(factionId: number): boolean {
    return this.bundles.has(factionId);
  }

  /**
   * Shut down all transport bundles
   */
  async shutdown(options?: {
    gracefulTimeoutMs?: number;
    message?: string;
  }): Promise<void> {
    if (this.debug) {
      console.log(`[FactionRegistry] Shutting down all transport bundles...`);
    }

    this.destroyed$.next();
    this.destroyed$.complete();

    const promises: Promise<void>[] = [];
    for (const bundle of this.bundles.values()) {
      promises.push(bundle.stop(options));
    }

    await Promise.all(promises);
    this.bundles.clear();
    this.connection$.complete();

    if (this.debug) {
      console.log(`[FactionRegistry] All transport bundles shut down`);
    }
  }
}
