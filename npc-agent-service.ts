/**
 * NPC Agent Service
 *
 * Standalone service that manages AI agents for NPCs.
 * Runs in its own Docker container, connects to game MCP server.
 *
 * Environment variables:
 * - MCP_HOST: Game MCP server host (default: malice-game)
 * - MCP_PORT: Game MCP server port (default: 3001)
 * - POLL_INTERVAL: How often to check for new NPCs (default: 30000ms)
 */

import { NPCAgent } from './src/npc-agent/npc-agent.js';

const MCP_HOST = process.env.MCP_HOST || 'localhost';
const MCP_PORT = parseInt(process.env.MCP_PORT || '3001', 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '30000', 10);

interface AIRegistration {
  role: string;
  human: { id: number } | number;
  spawnedAt?: string;
}

interface ManagedAgent {
  agent: NPCAgent;
  npcId: number;
  name: string;
  role: string;
}

const agents = new Map<number, ManagedAgent>();

/**
 * Call MCP tool via HTTP
 */
async function mcpCall(tool: string, args: Record<string, unknown>): Promise<any> {
  const sessionId = `npc-agent-service-${Date.now()}`;

  // Initialize session
  const initRes = await fetch(`http://${MCP_HOST}:${MCP_PORT}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      id: 1,
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'npc-agent-service', version: '1.0.0' },
      },
    }),
  });

  if (!initRes.ok) {
    throw new Error(`MCP init failed: ${initRes.status}`);
  }

  const mcpSessionId = initRes.headers.get('mcp-session-id');

  // Call tool
  const toolRes = await fetch(`http://${MCP_HOST}:${MCP_PORT}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      ...(mcpSessionId ? { 'mcp-session-id': mcpSessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: 2,
      params: { name: tool, arguments: args },
    }),
  });

  if (!toolRes.ok) {
    throw new Error(`MCP tool call failed: ${toolRes.status}`);
  }

  const result = await toolRes.json();
  if (result.error) {
    throw new Error(result.error.message);
  }

  // Parse content from result
  const content = result.result?.content?.[0];
  if (content?.type === 'text') {
    return JSON.parse(content.text);
  }

  return result.result;
}

/**
 * Get object property via MCP
 */
async function getProperty(objectId: number, name: string): Promise<any> {
  return mcpCall('get_property', { objectId, name });
}

/**
 * Set object property via MCP
 */
async function setProperty(objectId: number, name: string, value: any): Promise<void> {
  await mcpCall('set_property', { objectId, name, value });
}

/**
 * List AI-controlled NPCs via MCP
 */
async function listAINpcs(): Promise<Array<{ id: number; name: string; role: string; sessionId?: string }>> {
  const result = await mcpCall('ai', { action: 'list' });
  return result.humans || [];
}

/**
 * Create agent for an NPC
 */
async function createAgentForNpc(npcId: number, name: string, role: string): Promise<ManagedAgent> {
  // Check for existing session ID
  let existingSessionId: string | undefined;
  try {
    const prop = await getProperty(npcId, 'agentSessionId');
    existingSessionId = prop?.value;
  } catch {
    // No existing session
  }

  const agent = new NPCAgent({
    npcId,
    name,
    role,
    mcpHost: MCP_HOST,
    mcpPort: MCP_PORT,
    resumeSessionId: existingSessionId,
    onSessionCreated: async (sessionId: string) => {
      // Persist session ID to database via MCP
      try {
        await setProperty(npcId, 'agentSessionId', sessionId);
        console.log(`[NPC-Agent] Saved session ${sessionId} for ${name} (#${npcId})`);
      } catch (err) {
        console.error(`[NPC-Agent] Failed to save session for ${name}:`, err);
      }
    },
  });

  agent.on('error', (err) => {
    console.error(`[NPC-Agent] Error for ${name} (#${npcId}):`, err);
  });

  const managed: ManagedAgent = { agent, npcId, name, role };
  agents.set(npcId, managed);

  if (existingSessionId) {
    console.log(`[NPC-Agent] Resumed ${name} (#${npcId}) with session ${existingSessionId}`);
  } else {
    console.log(`[NPC-Agent] Created new agent for ${name} (#${npcId})`);
  }

  return managed;
}

/**
 * Sync agents with AI registry
 */
async function syncAgents(): Promise<void> {
  try {
    const npcs = await listAINpcs();

    for (const npc of npcs) {
      if (!agents.has(npc.id)) {
        await createAgentForNpc(npc.id, npc.name, npc.role);
      }
    }

    // Remove agents for NPCs no longer in registry
    const npcIds = new Set(npcs.map(n => n.id));
    for (const [id, managed] of agents) {
      if (!npcIds.has(id)) {
        console.log(`[NPC-Agent] Removing agent for ${managed.name} (#${id})`);
        agents.delete(id);
      }
    }
  } catch (err) {
    console.error('[NPC-Agent] Failed to sync agents:', err);
  }
}

/**
 * Main service loop
 */
async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  NPC Agent Service');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  MCP Server: http://${MCP_HOST}:${MCP_PORT}/mcp`);
  console.log(`  Poll Interval: ${POLL_INTERVAL}ms`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Wait for MCP server to be ready
  console.log('[NPC-Agent] Waiting for MCP server...');
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      await listAINpcs();
      ready = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!ready) {
    console.error('[NPC-Agent] MCP server not available after 60s, exiting');
    process.exit(1);
  }

  console.log('[NPC-Agent] MCP server ready\n');

  // Initial sync
  await syncAgents();
  console.log(`[NPC-Agent] Managing ${agents.size} NPC agents\n`);

  // Periodic sync
  setInterval(syncAgents, POLL_INTERVAL);

  // Keep running
  console.log('[NPC-Agent] Service running. Press Ctrl+C to stop.\n');
}

main().catch((err) => {
  console.error('[NPC-Agent] Fatal error:', err);
  process.exit(1);
});
