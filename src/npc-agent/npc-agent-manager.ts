/**
 * NPC Agent Manager
 *
 * Manages AI agents for NPCs in the game world.
 * Integrates with the $.ai registry to track AI-controlled humans.
 */

import { EventEmitter } from 'events';
import { NPCAgent, type NPCAgentConfig, type NPCAgentState } from './npc-agent.js';
import type { ObjectManager } from '../database/object-manager.js';

export interface NPCAgentManagerConfig {
  /** MCP server host */
  mcpHost?: string;
  /** MCP server port */
  mcpPort?: number;
  /** Working directory */
  workingDirectory?: string;
  /** Default allowed tools */
  defaultAllowedTools?: string[];
}

export interface ManagedNPC {
  agent: NPCAgent;
  npcId: number;
  name: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

/**
 * Manages multiple NPC agents
 */
export class NPCAgentManager extends EventEmitter {
  private agents: Map<number, ManagedNPC> = new Map();
  private config: NPCAgentManagerConfig;
  private manager: ObjectManager;

  constructor(manager: ObjectManager, config: NPCAgentManagerConfig = {}) {
    super();
    this.manager = manager;
    this.config = {
      mcpHost: 'localhost',
      mcpPort: 3001,
      workingDirectory: process.cwd(),
      defaultAllowedTools: ['Read', 'Glob', 'Grep'],
      ...config,
    };
  }

  /**
   * Create an agent for an existing NPC
   */
  async createAgent(npcId: number, options: Partial<NPCAgentConfig> = {}): Promise<NPCAgent> {
    // Check if agent already exists
    if (this.agents.has(npcId)) {
      return this.agents.get(npcId)!.agent;
    }

    // Load NPC from database
    const npc = await this.manager.load(npcId);
    if (!npc) {
      throw new Error(`NPC #${npcId} not found`);
    }

    // Get NPC properties
    const name = String(npc.get('name') || `NPC #${npcId}`);
    const role = String(npc.get('aiRole') || options.role || 'generic');

    // Build agent config
    const agentConfig: NPCAgentConfig = {
      npcId,
      name,
      role,
      mcpHost: this.config.mcpHost,
      mcpPort: this.config.mcpPort,
      workingDirectory: this.config.workingDirectory,
      allowedTools: options.allowedTools || this.config.defaultAllowedTools,
      systemPromptAddition: options.systemPromptAddition,
    };

    // Create agent
    const agent = new NPCAgent(agentConfig);

    // Set up event forwarding
    agent.on('tool_use', (data) => {
      this.emit('npc_tool_use', { npcId, ...data });
    });

    agent.on('error', (error) => {
      this.emit('npc_error', { npcId, error });
    });

    agent.on('message', (message) => {
      this.emit('npc_message', { npcId, message });
    });

    // Store managed NPC
    const managedNPC: ManagedNPC = {
      agent,
      npcId,
      name,
      role,
      active: true,
      createdAt: new Date(),
    };

    this.agents.set(npcId, managedNPC);
    this.emit('agent_created', { npcId, name, role });

    return agent;
  }

  /**
   * Get an existing agent
   */
  getAgent(npcId: number): NPCAgent | undefined {
    return this.agents.get(npcId)?.agent;
  }

  /**
   * Remove an agent
   */
  removeAgent(npcId: number): boolean {
    const managed = this.agents.get(npcId);
    if (!managed) return false;

    managed.active = false;
    this.agents.delete(npcId);
    this.emit('agent_removed', { npcId, name: managed.name });

    return true;
  }

  /**
   * Prompt a specific NPC
   */
  async promptNPC(npcId: number, input: string): Promise<string> {
    const managed = this.agents.get(npcId);
    if (!managed) {
      throw new Error(`No agent for NPC #${npcId}`);
    }

    return managed.agent.prompt(input);
  }

  /**
   * Send an event to a specific NPC
   */
  async sendEventToNPC(npcId: number, eventType: string, data: Record<string, any>): Promise<string> {
    const managed = this.agents.get(npcId);
    if (!managed) {
      throw new Error(`No agent for NPC #${npcId}`);
    }

    return managed.agent.handleEvent(eventType, data);
  }

  /**
   * Broadcast an event to all NPCs in a location
   */
  async broadcastToLocation(locationId: number, eventType: string, data: Record<string, any>): Promise<Map<number, string>> {
    const results = new Map<number, string>();

    for (const [npcId, managed] of this.agents) {
      // Check if NPC is in this location
      const npc = await this.manager.load(npcId);
      if (npc && npc.get('location') === locationId) {
        try {
          const response = await managed.agent.handleEvent(eventType, data);
          results.set(npcId, response);
        } catch (error) {
          this.emit('npc_error', { npcId, error });
          results.set(npcId, `(error: ${error})`);
        }
      }
    }

    return results;
  }

  /**
   * List all managed NPCs
   */
  listAgents(): Array<{ npcId: number; name: string; role: string; state: NPCAgentState }> {
    return Array.from(this.agents.values()).map((managed) => ({
      npcId: managed.npcId,
      name: managed.name,
      role: managed.role,
      state: managed.agent.getState(),
    }));
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Sync with $.ai registry to create agents for all registered AI humans
   */
  async syncWithRegistry(): Promise<number> {
    // Find the $.ai registry object via alias
    const aliases = this.manager.getAliases();
    const aiRegistry = aliases.get('ai');
    if (!aiRegistry) {
      console.warn('[NPCAgentManager] $.ai registry not found');
      return 0;
    }

    // Get all registered AI humans
    const registry = (aiRegistry.get('registry') as Record<string, unknown>) || {};
    let created = 0;

    for (const [humanIdStr, registration] of Object.entries(registry)) {
      const humanId = parseInt(humanIdStr, 10);
      if (isNaN(humanId)) continue;

      const reg = registration as { role: string; humanId: number };

      // Skip if already managed
      if (this.agents.has(humanId)) continue;

      try {
        await this.createAgent(humanId, { role: reg.role });
        created++;
      } catch (error) {
        console.error(`[NPCAgentManager] Failed to create agent for #${humanId}:`, error);
      }
    }

    return created;
  }

  /**
   * Shutdown all agents
   */
  shutdown(): void {
    for (const managed of this.agents.values()) {
      managed.active = false;
    }
    this.agents.clear();
    this.emit('shutdown');
  }
}
