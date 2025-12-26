/**
 * Test harness for Claude Code SDK
 */
import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  console.log('Testing Claude Code SDK...');

  const systemPrompt = `You are Clara, a receptionist at Immigration Services.
Be helpful and brief. Respond in 1-2 sentences.`;

  const userPrompt = 'A stranger says: "Hello, what is this place?"';

  try {
    let response = '';
    let sessionId: string | null = null;

    for await (const message of query({
      prompt: userPrompt,
      options: {
        systemPrompt,
        mcpServers: {
          'malice-moo': {
            type: 'http',
            url: 'http://localhost:3001/mcp',
          },
        },
        allowedTools: ['*'],
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        cwd: process.env.HOME || '/home/node',
        persistSession: true,
      },
    })) {
      const msg = message as Record<string, unknown>;

      if (msg.type === 'system' && (msg as any).subtype === 'init') {
        sessionId = (msg as any).session_id;
        console.log('Session ID:', sessionId);
      }

      if (msg.type === 'assistant' && (msg as any).message?.content) {
        for (const block of (msg as any).message.content) {
          if (block.type === 'text') {
            response += block.text;
          }
        }
      }
    }

    console.log('Response:', response);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
