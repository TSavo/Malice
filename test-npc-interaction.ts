/**
 * Test NPC Agent with simulated player interaction
 */

import { NPCAgent } from './src/npc-agent/npc-agent.js';

const MARCUS_ID = 3028;
const _TEST_PLAYER_ID = 3077;

async function main() {
  console.log(`🤖 Creating NPC Agent for Marcus Webb (#${MARCUS_ID})...\n`);

  const agent = new NPCAgent({
    npcId: MARCUS_ID,
    name: 'Marcus Webb',
    role: 'guard',
    mcpHost: 'localhost',
    mcpPort: 3001,
    systemPromptAddition: `
SPECIFIC DUTIES:
- Guard the entrance to Pioneer Square
- Be suspicious of strangers
- Ask people their business
- You can use call_method to make yourself speak or emote
`,
  });

  // Log tool usage
  agent.on('tool_use', (data) => {
    console.log('  🔧 Tool:', data.tool);
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCENARIO: Test Player approaches and speaks to Marcus');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Simulate player entering
  console.log('📍 Event: player_entered\n');
  let response = await agent.handleEvent('player_entered', {
    playerName: 'Test Player',
  });
  console.log('📥 Marcus responds:\n');
  console.log(response);
  console.log('\n---\n');

  // Simulate player speaking
  console.log(
    '💬 Test Player says: "Hey, I\'m looking for work around here."\n',
  );
  response = await agent.handleEvent('player_said', {
    playerName: 'Test Player',
    message: "Hey, I'm looking for work around here.",
  });
  console.log('📥 Marcus responds:\n');
  console.log(response);
  console.log('\n---\n');

  // Another question
  console.log(
    '💬 Test Player says: "What happened to downtown? Why is there a wall?"\n',
  );
  response = await agent.handleEvent('player_said', {
    playerName: 'Test Player',
    message: 'What happened to downtown? Why is there a wall?',
  });
  console.log('📥 Marcus responds:\n');
  console.log(response);
  console.log('\n---\n');

  // Test memory - reference previous conversation
  console.log(
    '💬 Test Player says: "About that work you mentioned - where exactly should I go?"\n',
  );
  response = await agent.handleEvent('player_said', {
    playerName: 'Test Player',
    message: 'About that work you mentioned - where exactly should I go?',
  });
  console.log('📥 Marcus responds:\n');
  console.log(response);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Session ID:', agent.getState().sessionId);
  console.log('Message count:', agent.getState().messageCount);
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);
