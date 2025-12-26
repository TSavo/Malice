/**
 * Test script for NPC Agent
 *
 * Authentication options:
 * 1. Claude Max/Pro subscription:
 *    - Run: claude setup-token
 *    - Then: CLAUDE_CODE_OAUTH_TOKEN=<token> npx tsx test-npc-agent.ts
 *
 * 2. API Key:
 *    - ANTHROPIC_API_KEY=your-key npx tsx test-npc-agent.ts
 */

import { NPCAgent } from './src/npc-agent/npc-agent.js';

const NPC_ID = 3028; // Marcus Webb

async function main() {
  const hasOAuthToken = !!process.env.CLAUDE_CODE_OAUTH_TOKEN;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  if (hasOAuthToken) {
    console.log('🔐 Auth: Claude Max/Pro OAuth token');
  } else if (hasApiKey) {
    console.log('🔐 Auth: API Key');
  } else {
    console.log('🔐 Auth: Using Claude Code credentials (if available)');
  }

  console.log(`🤖 Creating NPC Agent for Marcus Webb (#${NPC_ID})...\n`);

  const agent = new NPCAgent({
    npcId: NPC_ID,
    name: 'Marcus Webb',
    role: 'guard',
    mcpHost: 'localhost',
    mcpPort: 3001,
    workingDirectory: process.cwd(),
  });

  // Log events
  agent.on('tool_use', (data) => {
    console.log('🔧 Tool:', data.tool);
  });

  agent.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  // Test prompt
  console.log('📤 Sending prompt to agent...\n');

  try {
    const response = await agent.prompt(
      'Look around your current location using get_room_info. Then say hello to anyone present.',
    );

    console.log('\n📥 Response:\n');
    console.log(response);
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

main().catch(console.error);
