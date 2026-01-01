import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds the $transports system object
 * Singleton that exposes FactionTransportRegistry to MOO code
 *
 * The actual TypeScript FactionTransportRegistry is set via setRegistry()
 * from the GameCoordinator after both are initialized.
 *
 * Usage from MOO code:
 *   await $transports.create(faction)           // Start transports for faction
 *   await $transports.destroy(faction)          // Stop transports
 *   $transports.list()                          // List all active bundles
 *   $transports.get(factionId)                  // Get bundle info
 *   $transports.getConnections(factionId)       // Get connections for faction
 */
export class TransportsBuilder implements Builder {
  static provides = ['transports'];
  static depends = ['factionManager']; // Uses $.factionManager.list() in startAll

  private transports: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.transports) {
      this.transports = await this.manager.load(aliases.transports);
      if (this.transports) return;
    }

    if (!this.transports) {
      const root = await this.manager.load('root');
      this.transports = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Transports',
          description:
            'Transport registry for faction network infrastructure.',
          // Registry reference set by GameCoordinator
          _registryRef: null,

          abilities: `Singleton registry for faction transport bundles. Accessed via $transports.

STARTUP: startAll() starts transports for all factions registered with $factionManager. Called during bootstrap.

CREATE: create(faction) spins up HTTP/WS/SessionMCP for faction. Returns allocated ports.

DESTROY: destroy(faction, options?) shuts down faction's transports. Options: {gracefulTimeoutMs, message}.

QUERY: list() returns all active bundles. get(factionId) returns bundle info. has(factionId) checks if exists.

CONNECTIONS: getConnections(factionId) returns all connections. getConnectionCount(factionId) returns count.

INTERNAL: Registry is set via setRegistry() by GameCoordinator at startup.`,
        },
        methods: {},
      });
    }

    // Create a faction's transport bundle
    this.transports.setMethod(
      'create',
      `
      /** Create transport bundle for a faction.
       *  @param faction - Faction object to create transports for
       *  @returns Allocated ports {http, ws, sessionMcp}
       */
      const faction = args[0];
      if (!faction || !faction.id) {
        throw new Error('Faction object required');
      }

      const registry = self._registryRef;
      if (!registry) {
        throw new Error('Transport registry not initialized');
      }

      // Get transport types from faction (defaults to HTTP+WS, no SessionMCP)
      const transportTypes = faction.transportTypes || { http: true, ws: true, sessionMcp: false };

      const ports = await registry.create({
        factionId: faction.id,
        name: faction.name || 'Unknown',
        domain: faction.domain || undefined,
        index: faction.index,
        transports: transportTypes,
        debug: false,
      });

      // Store ports back to faction
      faction.ports = ports;

      return ports;
    `,
    );

    // Destroy a faction's transport bundle
    this.transports.setMethod(
      'destroy',
      `
      /** Destroy transport bundle for a faction.
       *  @param faction - Faction object or ID
       *  @param options - {gracefulTimeoutMs?, message?}
       */
      const factionArg = args[0];
      const options = args[1] || {};

      const factionId = typeof factionArg === 'number' ? factionArg : factionArg?.id;
      if (!factionId) {
        throw new Error('Faction required');
      }

      const registry = self._registryRef;
      if (!registry) {
        throw new Error('Transport registry not initialized');
      }

      await registry.destroy(factionId, options);

      // Clear ports on faction if we have the object
      if (typeof factionArg !== 'number') {
        factionArg.ports = null;
      }
    `,
    );

    // List all active transport bundles
    this.transports.setMethod(
      'list',
      `
      /** List all active faction transport bundles.
       *  @returns Array of {factionId, name, domain, ports, connectionCount, online}
       */
      const registry = self._registryRef;
      if (!registry) {
        return [];
      }

      return registry.list();
    `,
    );

    // Get info about a specific faction's transports
    this.transports.setMethod(
      'get',
      `
      /** Get transport info for a faction.
       *  @param factionId - Faction ID
       *  @returns {factionId, name, domain, ports, connectionCount, online} or null
       */
      const factionId = args[0];
      if (!factionId) return null;

      const id = typeof factionId === 'number' ? factionId : factionId.id;

      const registry = self._registryRef;
      if (!registry) return null;

      return registry.get(id);
    `,
    );

    // Check if faction has transport bundle
    this.transports.setMethod(
      'has',
      `
      /** Check if faction has a transport bundle.
       *  @param factionId - Faction ID or object
       *  @returns boolean
       */
      const factionArg = args[0];
      const id = typeof factionArg === 'number' ? factionArg : factionArg?.id;
      if (!id) return false;

      const registry = self._registryRef;
      if (!registry) return false;

      return registry.has(id);
    `,
    );

    // Get connections for a faction
    this.transports.setMethod(
      'getConnections',
      `
      /** Get all connections for a faction.
       *  @param factionId - Faction ID or object
       *  @returns Array of Connection objects
       */
      const factionArg = args[0];
      const id = typeof factionArg === 'number' ? factionArg : factionArg?.id;
      if (!id) return [];

      const registry = self._registryRef;
      if (!registry) return [];

      return registry.getConnections(id);
    `,
    );

    // Get connection count for a faction
    this.transports.setMethod(
      'getConnectionCount',
      `
      /** Get connection count for a faction.
       *  @param factionId - Faction ID or object
       *  @returns number
       */
      const factionArg = args[0];
      const id = typeof factionArg === 'number' ? factionArg : factionArg?.id;
      if (!id) return 0;

      const registry = self._registryRef;
      if (!registry) return 0;

      return registry.getConnectionCount(id);
    `,
    );

    // Get total connection count across all factions
    this.transports.setMethod(
      'getTotalConnectionCount',
      `
      /** Get total connection count across all factions.
       *  @returns number
       */
      const registry = self._registryRef;
      if (!registry) return 0;

      return registry.getTotalConnectionCount();
    `,
    );

    // Set the registry reference (called by GameCoordinator)
    this.transports.setMethod(
      'setRegistry',
      `
      /** Set the TypeScript registry reference.
       *  Called by GameCoordinator during startup.
       *  @param registry - FactionTransportRegistry instance
       */
      const registry = args[0];
      self._registryRef = registry;
    `,
    );

    // Start transports for all registered factions
    this.transports.setMethod(
      'startAll',
      `
      /** Start transports for all registered factions.
       *  Called during bootstrap after factions are created.
       *  @returns Array of {faction, ports} for each started faction
       */
      const registry = self._registryRef;
      if (!registry) {
        throw new Error('Transport registry not initialized - call setRegistry first');
      }

      // Get all factions from $factionManager
      const factions = await $factionManager.list();
      if (!factions || factions.length === 0) {
        console.log('📭 No factions registered - skipping transport startup');
        return [];
      }

      console.log('🌐 Starting transports for ' + factions.length + ' faction(s)...');
      const results = [];

      for (const faction of factions) {
        try {
          const ports = await self.create(faction);
          console.log('  ✓ ' + faction.name + ' (ports: ' + JSON.stringify(ports) + ')');
          results.push({ faction: faction.name, ports });
        } catch (err) {
          console.error('  ✗ Failed to start ' + faction.name + ':', err?.message || err);
        }
      }

      return results;
    `,
    );

    // Property descriptions
    this.transports.setPropertyDescription(
      '_registryRef',
      'Reference to TypeScript FactionTransportRegistry (set by GameCoordinator)',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.transports) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'transports', this.transports.id);
    console.log(`Registered transports alias -> #${this.transports.id}`);
  }
}

// Self-register
registerBuilder(TransportsBuilder);
