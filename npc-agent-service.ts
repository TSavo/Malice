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
/**
 * Parse SSE response to extract JSON data
 */
function parseSSEResponse(text: string): any {
  // SSE format: "event: message\ndata: {...}\n\n"
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.slice(6));
    }
  }
  // Try parsing as raw JSON if no SSE format
  return JSON.parse(text);
}

// Reusable MCP session
let sharedMcpSessionId: string | null = null;
let sessionInitPromise: Promise<string> | null = null;

async function getMcpSession(): Promise<string> {
  if (sharedMcpSessionId) return sharedMcpSessionId;

  // Prevent multiple concurrent initializations
  if (sessionInitPromise) return sessionInitPromise;

  sessionInitPromise = (async () => {
    console.log('[NPC-Agent] Initializing MCP session...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
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
        signal: controller.signal,
      });

      if (!initRes.ok) {
        throw new Error(`MCP init failed: ${initRes.status}`);
      }

      const sessionId = initRes.headers.get('mcp-session-id') || '';
      sharedMcpSessionId = sessionId;
      console.log(`[NPC-Agent] MCP session initialized: ${sessionId}`);
      return sessionId;
    } finally {
      clearTimeout(timeout);
      sessionInitPromise = null;
    }
  })();

  return sessionInitPromise;
}

/**
 * Reset the MCP session and get a new one (for when session expires)
 */
async function resetMcpSession(): Promise<string> {
  console.log('[NPC-Agent] Resetting MCP session...');
  sharedMcpSessionId = null;
  sessionInitPromise = null;
  return getMcpSession();
}

async function mcpCall(tool: string, args: Record<string, unknown>): Promise<any> {
  const mcpSessionId = await getMcpSession();

  // Call tool with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const toolRes = await fetch(`http://${MCP_HOST}:${MCP_PORT}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': mcpSessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        id: Date.now(),
        params: { name: tool, arguments: args },
      }),
      signal: controller.signal,
    });

    if (!toolRes.ok) {
      // Session may have expired, reset and retry once
      if (toolRes.status === 400 || toolRes.status === 404) {
        console.log('[NPC-Agent] MCP session expired, resetting...');
        sharedMcpSessionId = null;
        return mcpCall(tool, args); // Retry with new session
      }
      throw new Error(`MCP tool call failed: ${toolRes.status}`);
    }

    return toolRes;
  } finally {
    clearTimeout(timeout);
  }
}

async function mcpCallWithParse(tool: string, args: Record<string, unknown>): Promise<any> {
  const toolRes = await mcpCall(tool, args);

  const responseText = await toolRes.text();
  const result = parseSSEResponse(responseText);

  if (result.error) {
    throw new Error(result.error.message);
  }

  // Parse content from result
  const content = result.result?.content?.[0];
  if (content?.type === 'text') {
    // Try to parse as JSON, fall back to raw text
    try {
      return JSON.parse(content.text);
    } catch {
      return content.text;
    }
  }

  return result.result;
}

/**
 * Set object property via MCP
 */
async function setProperty(objectId: number, name: string, value: any): Promise<void> {
  await mcpCallWithParse('set_property', { objectId, name, value });
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
    getMcpSessionId: async () => getMcpSession(),
    resetMcpSession: async () => resetMcpSession(),
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
  // Note: Properties are stored as { type: 'string', value: 'AI' } in MongoDB
  const aiObj = await objects.findOne({
    'properties.name.value': 'AI',
    'properties.registry': { $exists: true },
  });

  if (!aiObj) {
    console.log('[NPC-Agent] No AI registry found yet');
    return;
  }

  // Registry is stored as { type: 'object', value: {...} }
  const registryProp = aiObj.properties?.registry as { type: string; value: Record<string, any> } | undefined;
  const registry = registryProp?.value || {};

  for (const [npcIdStr, entry] of Object.entries(registry)) {
    const npcId = parseInt(npcIdStr, 10);
    if (isNaN(npcId)) continue;

    // Entry values are also typed: { type: 'object', value: { role: { type: 'string', value: '...' }, ... } }
    const entryValue = (entry as any)?.value || entry;
    const role = entryValue?.role?.value || entryValue?.role || 'generic';

    // Load NPC object to get name and session ID
    const npcObj = await objects.findOne({ _id: npcId });
    if (!npcObj) continue;

    const nameProp = npcObj.properties?.name as { type: string; value: string } | undefined;
    const name = nameProp?.value || `NPC #${npcId}`;
    const sessionIdProp = npcObj.properties?.agentSessionId as { type: string; value: string } | undefined;
    const sessionId = sessionIdProp?.value;

    await createAgentForNpc(npcId, name, role, sessionId);
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
    'properties.name.value': 'AI',
    'properties.registry': { $exists: true },
  });

  const aiId = aiObj?._id;

  // Watch for changes to the AI registry object
  const pipeline = aiId
    ? [{ $match: { 'documentKey._id': aiId } }]
    : [{ $match: { 'fullDocument.properties.name.value': 'AI' } }];

  changeStream = objects.watch(pipeline, { fullDocument: 'updateLookup' });

  changeStream.on('change', async (change: ChangeStreamDocument) => {
    if (change.operationType === 'update' || change.operationType === 'replace') {
      const doc = (change as any).fullDocument;
      if (!doc?.properties?.registry) return;

      // Registry is stored as { type: 'object', value: {...} }
      const registryProp = doc.properties.registry as { type: string; value: Record<string, any> };
      const registry = registryProp?.value || {};
      const currentNpcIds = new Set(Object.keys(registry).map(id => parseInt(id, 10)));

      // Add new NPCs
      for (const [npcIdStr, entry] of Object.entries(registry)) {
        const npcId = parseInt(npcIdStr, 10);
        if (isNaN(npcId) || agents.has(npcId)) continue;

        // Entry values are also typed
        const entryValue = (entry as any)?.value || entry;
        const role = entryValue?.role?.value || entryValue?.role || 'generic';

        // Load NPC object to get name
        const npcObj = await objects.findOne({ _id: npcId });
        const nameProp = npcObj?.properties?.name as { type: string; value: string } | undefined;
        const name = nameProp?.value || `NPC #${npcId}`;
        const sessionIdProp = npcObj?.properties?.agentSessionId as { type: string; value: string } | undefined;
        const sessionId = sessionIdProp?.value;

        await createAgentForNpc(npcId, name, role, sessionId);
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
 * Watch for game events (speech, etc.) and route to NPCs
 */
let eventStream: ChangeStream | null = null;

async function watchGameEvents(): Promise<void> {
  const db = mongoClient.db(MONGO_DB);
  const events = db.collection('game_events');

  // Create TTL index to auto-delete old events (1 hour)
  try {
    await events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
  } catch {
    // Index may already exist
  }

  // Watch for new events
  eventStream = events.watch([
    { $match: { operationType: 'insert' } }
  ], { fullDocument: 'updateLookup' });

  eventStream.on('change', async (change: ChangeStreamDocument) => {
    if (change.operationType !== 'insert') return;

    const doc = (change as any).fullDocument;
    if (!doc || doc.processed) return;

    const eventType = doc.type;
    const eventData = doc.data?.value || doc.data;

    if (eventType === 'speech') {
      await handleSpeechEvent(eventData);
    } else if (eventType === 'directed_speech') {
      await handleDirectedSpeechEvent(eventData);
    } else if (eventType === 'item_received') {
      await handleItemReceivedEvent(eventData);
    }

    // Mark as processed
    try {
      await events.updateOne({ _id: doc._id }, { $set: { processed: true } });
    } catch {
      // Ignore - event may have expired
    }
  });

  eventStream.on('error', (err) => {
    console.error('[NPC-Agent] Game events stream error:', err);
    setTimeout(watchGameEvents, 5000);
  });

  console.log('[NPC-Agent] Watching game events');
}

/**
 * Handle a speech event - route to NPCs in the same location
 */
async function handleSpeechEvent(data: any): Promise<void> {
  console.log(`[NPC-Agent] handleSpeechEvent called with:`, JSON.stringify(data).substring(0, 200));

  // Extract data - handle typed MongoDB format
  const speakerId = data.speakerId?.value ?? data.speakerId;
  const speakerName = data.speakerName?.value ?? data.speakerName;
  const message = data.message?.value ?? data.message;
  const locationId = data.locationId?.value ?? data.locationId;

  console.log(`[NPC-Agent] Extracted: speaker=${speakerId} (${speakerName}), loc=${locationId}`);

  if (!locationId || !message) {
    console.log(`[NPC-Agent] Missing locationId or message, skipping`);
    return;
  }

  // Skip if speaker is an NPC (prevents feedback loops)
  if (agents.has(speakerId)) {
    console.log(`[NPC-Agent] Speaker ${speakerId} is an NPC, skipping to prevent loop`);
    return;
  }

  console.log(`[NPC-Agent] Processing speech from player ${speakerName}`);


  // Find NPCs in this location - process sequentially to avoid overwhelming MCP
  const npcsToNotify: Array<{ npcId: number; managed: ManagedAgent }> = [];

  for (const [npcId, managed] of agents) {
    if (npcId === speakerId) continue;

    try {
      console.log(`[NPC-Agent] Checking location for ${managed.name} (#${npcId})...`);
      const npcInfo = await mcpCallWithParse('get_object', { id: npcId });
      const npcLocation = npcInfo?.properties?.location?.value ?? npcInfo?.properties?.location;
      console.log(`[NPC-Agent] ${managed.name} is at location ${npcLocation}`);

      if (npcLocation === locationId) {
        npcsToNotify.push({ npcId, managed });
      }
    } catch (err) {
      console.error(`[NPC-Agent] Error checking NPC location for ${managed.name}:`, err);
    }
  }

  console.log(`[NPC-Agent] Found ${npcsToNotify.length} NPCs to notify`);

  // Process each NPC sequentially
  for (const { npcId, managed } of npcsToNotify) {
    console.log(`[NPC-Agent] Routing speech to ${managed.name} (#${npcId}): "${message}"`);

    try {
      console.log(`[NPC-Agent] Calling agent.handleEvent for ${managed.name}...`);
      const response = await managed.agent.handleEvent('player_said', {
        playerName: speakerName,
        message: message,
      });
      console.log(`[NPC-Agent] Got response from ${managed.name}`);

      if (response) {
        console.log(`[NPC-Agent] ${managed.name} responds: ${response}`);
      }
    } catch (err) {
      console.error(`[NPC-Agent] Error handling speech for ${managed.name}:`, err);
    }
  }

  console.log(`[NPC-Agent] handleSpeechEvent complete`);
}

/**
 * Handle a directed speech event - only notify the targeted NPC
 */
async function handleDirectedSpeechEvent(data: any): Promise<void> {
  console.log(`[NPC-Agent] handleDirectedSpeechEvent called with:`, JSON.stringify(data).substring(0, 200));

  // Extract data - handle typed MongoDB format
  const speakerId = data.speakerId?.value ?? data.speakerId;
  const speakerName = data.speakerName?.value ?? data.speakerName;
  const targetId = data.targetId?.value ?? data.targetId;
  const targetName = data.targetName?.value ?? data.targetName;
  const message = data.message?.value ?? data.message;

  console.log(`[NPC-Agent] Directed speech: ${speakerName} -> ${targetName} (#${targetId}): "${message}"`);

  if (!targetId || !message) {
    console.log(`[NPC-Agent] Missing targetId or message, skipping`);
    return;
  }

  // Skip if speaker is an NPC (prevents feedback loops)
  if (agents.has(speakerId)) {
    console.log(`[NPC-Agent] Speaker ${speakerId} is an NPC, skipping to prevent loop`);
    return;
  }

  // Check if target is a managed NPC
  const managed = agents.get(targetId);
  if (!managed) {
    console.log(`[NPC-Agent] Target ${targetId} is not a managed NPC, skipping`);
    return;
  }

  console.log(`[NPC-Agent] Routing directed speech to ${managed.name} (#${targetId})`);

  try {
    const response = await managed.agent.handleEvent('player_said', {
      playerName: speakerName,
      message: message,
    });

    if (response) {
      console.log(`[NPC-Agent] ${managed.name} responds: ${response}`);
    }
  } catch (err) {
    console.error(`[NPC-Agent] Error handling directed speech for ${managed.name}:`, err);
  }

  console.log(`[NPC-Agent] handleDirectedSpeechEvent complete`);
}

/**
 * Handle an item received event - notify the NPC that received the item
 */
async function handleItemReceivedEvent(data: any): Promise<void> {
  console.log(`[NPC-Agent] handleItemReceivedEvent called with:`, JSON.stringify(data).substring(0, 200));

  // Extract data - handle typed MongoDB format
  const giverId = data.giverId?.value ?? data.giverId;
  const giverName = data.giverName?.value ?? data.giverName;
  const recipientId = data.recipientId?.value ?? data.recipientId;
  const recipientName = data.recipientName?.value ?? data.recipientName;
  const itemName = data.itemName?.value ?? data.itemName;

  console.log(`[NPC-Agent] Item received: ${giverName} gave ${itemName} to ${recipientName} (#${recipientId})`);

  if (!recipientId || !itemName) {
    console.log(`[NPC-Agent] Missing recipientId or itemName, skipping`);
    return;
  }

  // Skip if giver is an NPC (prevents feedback loops)
  if (agents.has(giverId)) {
    console.log(`[NPC-Agent] Giver ${giverId} is an NPC, skipping to prevent loop`);
    return;
  }

  // Check if recipient is a managed NPC
  const managed = agents.get(recipientId);
  if (!managed) {
    console.log(`[NPC-Agent] Recipient ${recipientId} is not a managed NPC, skipping`);
    return;
  }

  console.log(`[NPC-Agent] Routing item_received to ${managed.name} (#${recipientId})`);

  try {
    const response = await managed.agent.handleEvent('item_received', {
      playerName: giverName,
      itemName: itemName,
    });

    if (response) {
      console.log(`[NPC-Agent] ${managed.name} responds: ${response}`);
    }
  } catch (err) {
    console.error(`[NPC-Agent] Error handling item_received for ${managed.name}:`, err);
  }

  console.log(`[NPC-Agent] handleItemReceivedEvent complete`);
}

/**
 * Wait for MCP server to be ready
 */
async function waitForMCP(): Promise<boolean> {
  console.log('[NPC-Agent] Waiting for MCP server...');
  for (let i = 0; i < 30; i++) {
    try {
      await mcpCallWithParse('list_objects', { limit: 1 });
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

  // Watch for game events (speech, etc.)
  await watchGameEvents();

  console.log('[NPC-Agent] Service running. Press Ctrl+C to stop.\n');
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('\n[NPC-Agent] Shutting down...');
  if (changeStream) {
    await changeStream.close();
  }
  if (eventStream) {
    await eventStream.close();
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
