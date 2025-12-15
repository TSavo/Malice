/**
 * NPC Agent Service
 *
 * Standalone service that manages AI agents for NPCs.
 * Runs in its own Docker container, connects to game MCP server.
 * Uses MongoDB change streams to react to NPC spawn/despawn events.
 *
 * Environment variables:
 * - MCP_HOST: Game MCP server host (default: malice-game)
 * - MCP_PORT: Game MCP server port (default: 3001)
 * - MONGO_URI: MongoDB connection string (default: mongodb://mongodb:27017)
 * - MONGO_DB: Database name (default: malice)
 */

import { MongoClient, ChangeStream, ChangeStreamDocument } from 'mongodb';
import { NPCAgent } from './src/npc-agent/npc-agent.js';

const MCP_HOST = process.env.MCP_HOST || 'localhost';
const MCP_PORT = parseInt(process.env.MCP_PORT || '3001', 10);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017';
const MONGO_DB = process.env.MONGO_DB || 'malice';

interface ManagedAgent {
  agent: NPCAgent;
  npcId: number;
  name: string;
  role: string;
}

const agents = new Map<number, ManagedAgent>();
let mongoClient: MongoClient;
let changeStream: ChangeStream | null = null;

/**
 * Call MCP tool via HTTP
 */
async function mcpCall(tool: string, args: Record<string, unknown>): Promise<any> {
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
 * Set object property via MCP
 */
async function setProperty(objectId: number, name: string, value: any): Promise<void> {
  await mcpCall('set_property', { objectId, name, value });
}

/**
 * Create agent for an NPC
 */
async function createAgentForNpc(npcId: number, name: string, role: string, existingSessionId?: string): Promise<ManagedAgent> {
  // Skip if already exists
  if (agents.has(npcId)) {
    return agents.get(npcId)!;
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
    console.log(`[NPC-Agent] Created agent for ${name} (#${npcId})`);
  }

  return managed;
}

/**
 * Remove agent for an NPC
 */
function removeAgent(npcId: number): void {
  const managed = agents.get(npcId);
  if (managed) {
    console.log(`[NPC-Agent] Removed agent for ${managed.name} (#${npcId})`);
    agents.delete(npcId);
  }
}

/**
 * Load existing AI NPCs from database
 */
async function loadExistingNpcs(): Promise<void> {
  const db = mongoClient.db(MONGO_DB);
  const objects = db.collection('objects');

  // Find the $.ai registry object by looking for the AI object with registry property
  const aiObj = await objects.findOne({
    'properties.name': 'AI',
    'properties.registry': { $exists: true },
  });

  if (!aiObj) {
    console.log('[NPC-Agent] No AI registry found yet');
    return;
  }

  const registry = aiObj.properties?.registry || {};

  for (const [npcIdStr, entry] of Object.entries(registry)) {
    const npcId = parseInt(npcIdStr, 10);
    if (isNaN(npcId)) continue;

    const reg = entry as { role: string; human?: { type: string; value: number } };

    // Load NPC object to get name and session ID
    const npcObj = await objects.findOne({ _id: npcId });
    if (!npcObj) continue;

    const name = npcObj.properties?.name || `NPC #${npcId}`;
    const sessionId = npcObj.properties?.agentSessionId;

    await createAgentForNpc(npcId, name, reg.role, sessionId);
  }
}

/**
 * Watch for changes to AI registry
 */
async function watchAIRegistry(): Promise<void> {
  const db = mongoClient.db(MONGO_DB);
  const objects = db.collection('objects');

  // Find the AI registry object ID
  const aiObj = await objects.findOne({
    'properties.name': 'AI',
    'properties.registry': { $exists: true },
  });

  const aiId = aiObj?._id;

  // Watch for changes to the AI registry object
  const pipeline = aiId
    ? [{ $match: { 'documentKey._id': aiId } }]
    : [{ $match: { 'fullDocument.properties.name': 'AI' } }];

  changeStream = objects.watch(pipeline, { fullDocument: 'updateLookup' });

  changeStream.on('change', async (change: ChangeStreamDocument) => {
    if (change.operationType === 'update' || change.operationType === 'replace') {
      const doc = (change as any).fullDocument;
      if (!doc?.properties?.registry) return;

      const registry = doc.properties.registry;
      const currentNpcIds = new Set(Object.keys(registry).map(id => parseInt(id, 10)));

      // Add new NPCs
      for (const [npcIdStr, entry] of Object.entries(registry)) {
        const npcId = parseInt(npcIdStr, 10);
        if (isNaN(npcId) || agents.has(npcId)) continue;

        const reg = entry as { role: string };

        // Load NPC object to get name
        const npcObj = await objects.findOne({ _id: npcId });
        const name = npcObj?.properties?.name || `NPC #${npcId}`;
        const sessionId = npcObj?.properties?.agentSessionId;

        await createAgentForNpc(npcId, name, reg.role, sessionId);
      }

      // Remove deleted NPCs
      for (const [npcId] of agents) {
        if (!currentNpcIds.has(npcId)) {
          removeAgent(npcId);
        }
      }
    }
  });

  changeStream.on('error', (err) => {
    console.error('[NPC-Agent] Change stream error:', err);
    // Attempt to restart
    setTimeout(watchAIRegistry, 5000);
  });

  console.log('[NPC-Agent] Watching AI registry for changes');
}

/**
 * Wait for MCP server to be ready
 */
async function waitForMCP(): Promise<boolean> {
  console.log('[NPC-Agent] Waiting for MCP server...');
  for (let i = 0; i < 30; i++) {
    try {
      await mcpCall('list_objects', { limit: 1 });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return false;
}

/**
 * Main service
 */
async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  NPC Agent Service');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  MCP Server: http://${MCP_HOST}:${MCP_PORT}/mcp`);
  console.log(`  MongoDB: ${MONGO_URI}/${MONGO_DB}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Connect to MongoDB
  console.log('[NPC-Agent] Connecting to MongoDB...');
  mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  console.log('[NPC-Agent] MongoDB connected');

  // Wait for MCP server
  if (!await waitForMCP()) {
    console.error('[NPC-Agent] MCP server not available after 60s, exiting');
    process.exit(1);
  }
  console.log('[NPC-Agent] MCP server ready\n');

  // Load existing NPCs
  await loadExistingNpcs();
  console.log(`[NPC-Agent] Loaded ${agents.size} existing NPC agents\n`);

  // Watch for changes (event-driven, no polling)
  await watchAIRegistry();

  console.log('[NPC-Agent] Service running. Press Ctrl+C to stop.\n');
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('\n[NPC-Agent] Shutting down...');
  if (changeStream) {
    await changeStream.close();
  }
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('[NPC-Agent] Fatal error:', err);
  process.exit(1);
});
