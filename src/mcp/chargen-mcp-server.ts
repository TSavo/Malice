/**
 * CharGen MCP Server
 *
 * Standalone MCP server on port 3002 dedicated to character generation.
 * Allows an AI interviewer to programmatically complete chargen for a player.
 *
 * All state is stored on $.chargen.interviewState, not in server memory.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import type { ObjectManager } from '../database/object-manager.js';
import type { ObjId } from '../../types/object.js';

interface CharGenMCPServerConfig {
  port?: number;
  host?: string;
}

interface SessionState {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

export class CharGenMCPServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, SessionState>();
  private port: number;
  private host: string;

  constructor(
    private manager: ObjectManager,
    config: CharGenMCPServerConfig = {}
  ) {
    this.port = config.port ?? 3002;
    this.host = config.host ?? '127.0.0.1';
  }

  /**
   * Get $.chargen object
   */
  private async getCharGen(): Promise<any> {
    const root = await this.manager.load(0 as ObjId);
    if (!root) throw new Error('Root object not found');

    const aliases = root.get('aliases') as Record<string, number> | undefined;
    if (!aliases?.charGen) throw new Error('$.charGen alias not found');

    return await this.manager.load(aliases.charGen as ObjId);
  }

  /**
   * Serialize value for JSON output
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    if (value === null || value === undefined) return value;

    // Handle RuntimeObject
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number' && typeof value.get === 'function') {
      return `#${value.id}`;
    }

    if (Array.isArray(value)) {
      return value.map(v => this.serializeValue(v, seen));
    }

    if (typeof value === 'object') {
      if (seen.has(value)) return '[circular]';
      seen.add(value);
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.serializeValue(v, seen);
      }
      return result;
    }

    return value;
  }

  /**
   * Parse object ID from "#id" string format only
   */
  private parseObjectId(value: string): number | null {
    if (typeof value === 'string' && /^#-?\d+$/.test(value)) {
      return parseInt(value.slice(1), 10);
    }
    return null;
  }

  /**
   * Recursively deserialize "#id" strings to RuntimeObjects in args
   */
  private async deserializeValue(value: unknown): Promise<unknown> {
    if (value === null || value === undefined) return value;

    // Handle "#id" string format - convert to RuntimeObject
    if (typeof value === 'string' && /^#-?\d+$/.test(value)) {
      const id = parseInt(value.slice(1), 10);
      const obj = await this.manager.load(id as ObjId);
      return obj ?? value; // Return original string if object not found
    }

    // Recursively handle arrays
    if (Array.isArray(value)) {
      return Promise.all(value.map(v => this.deserializeValue(v)));
    }

    // Recursively handle objects
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = await this.deserializeValue(v);
      }
      return result;
    }

    return value;
  }

  /**
   * Create a new McpServer instance with chargen tools registered
   */
  private createSessionServer(): McpServer {
    const server = new McpServer({
      name: 'malice-chargen',
      version: '1.0.0',
    });

    this.registerTools(server);
    return server;
  }

  /**
   * Register CharGen MCP tools
   */
  private registerTools(server: McpServer): void {
    // Start interview for a player
    server.tool(
      'start_interview',
      'Start character creation interview for a player. Returns the list of questions.',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
      },
      async ({ playerId: rawPlayerId }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.startInterview(playerId);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Get next question needing an answer
    server.tool(
      'get_next_question',
      'Get the next unanswered question for a player. Returns null when all questions are answered.',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
      },
      async ({ playerId: rawPlayerId }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.getNextQuestionNeedingAnswer(playerId);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Answer a question
    server.tool(
      'answer_question',
      'Record an answer to a chargen question. Answers are open-ended text (except stat allocation).',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
        questionId: z.string().describe('Question ID (e.g., "name", "age", "eyeColor")'),
        answer: z.any().describe('The answer value (string for most questions, object for statAllocation)'),
      },
      async ({ playerId: rawPlayerId, questionId, answer }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.setAnswer(playerId, questionId, answer);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Get all questions and answers for a player
    server.tool(
      'get_progress',
      'Get all questions and current answers for a player interview.',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
      },
      async ({ playerId: rawPlayerId }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.getQuestionsAndAnswers(playerId);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Finish interview and create character
    server.tool(
      'finish_interview',
      'Complete the interview and create the character body. All questions must be answered.',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
      },
      async ({ playerId: rawPlayerId }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.finishInterview(playerId);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Get suggestions for a question
    server.tool(
      'get_suggestions',
      'Get suggested answers for a question (optional - answers are open-ended).',
      {
        questionId: z.string().describe('Question ID'),
      },
      async ({ questionId }) => {
        try {
          const chargen = await this.getCharGen();
          const result = await chargen.getSuggestions(questionId);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Register an object for recycling
    server.tool(
      'register_for_recycle',
      'Register an object (room, NPC) to be recycled when interview finishes.',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
        objectId: z.string().regex(/^#-?\d+$/).describe('Object ID to recycle on completion in "#id" format'),
      },
      async ({ playerId: rawPlayerId, objectId: rawObjectId }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const objectId = this.parseObjectId(rawObjectId);
          if (objectId === null) {
            return {
              content: [{ type: 'text', text: `Invalid object ID format: ${rawObjectId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.registerForRecycle(playerId, objectId);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );

    // Reject a player - end interview without creating character
    server.tool(
      'reject_player',
      'Reject a player and end chargen. Use when player is uncooperative, refuses to complete the process, or provides unusable answers. Cleans up temp objects, disconnects player, and recycles the incomplete player object.',
      {
        playerId: z.string().regex(/^#-?\d+$/).describe('Player object ID in "#id" format'),
        reason: z.string().describe('Reason for rejection (shown to player before disconnect)'),
      },
      async ({ playerId: rawPlayerId, reason }) => {
        try {
          const playerId = this.parseObjectId(rawPlayerId);
          if (playerId === null) {
            return {
              content: [{ type: 'text', text: `Invalid player ID format: ${rawPlayerId}` }],
              isError: true,
            };
          }
          const chargen = await this.getCharGen();
          const result = await chargen.rejectPlayer(playerId, reason);
          return {
            content: [{ type: 'text', text: JSON.stringify(this.serializeValue(result), null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error: ${err}` }],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Only handle /mcp endpoint
      if (req.url !== '/mcp') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      try {
        if (req.method === 'POST') {
          await this.handlePost(req, res, sessionId);
        } else if (req.method === 'GET') {
          await this.handleGet(req, res, sessionId);
        } else if (req.method === 'DELETE') {
          this.handleDelete(res, sessionId);
        } else {
          res.writeHead(405);
          res.end('Method Not Allowed');
        }
      } catch (err) {
        console.error('CharGen MCP request error:', err);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    this.httpServer.listen(this.port, this.host, () => {
      console.log(`🎭 CharGen MCP server listening on http://${this.host}:${this.port}/mcp`);
    });
  }

  /**
   * Handle POST requests
   */
  private async handlePost(req: IncomingMessage, res: ServerResponse, sessionId?: string): Promise<void> {
    const body = await this.readBody(req);
    const message = JSON.parse(body);

    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, message);
    } else if (message.method === 'initialize') {
      const server = this.createSessionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport });
        },
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, message);
    } else if (sessionId && !this.sessions.has(sessionId)) {
      // Stale session - recreate
      console.log(`[CharGen MCP] Recreating stale session ${sessionId}`);
      const server = this.createSessionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (newSessionId) => {
          this.sessions.set(newSessionId, { server, transport });
        },
      });

      await server.connect(transport);

      const initMessage = {
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'reconnected-client', version: '1.0.0' }
        }
      };

      const fakeRes = {
        writeHead: () => { },
        end: () => { },
        setHeader: () => { },
        write: () => true,
        on: () => { },
      } as unknown as ServerResponse;

      await transport.handleRequest(req, fakeRes, initMessage);
      await transport.handleRequest(req, res, message);
    } else {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Bad Request: No session ID and not an initialize request' }));
    }
  }

  /**
   * Handle GET requests (SSE)
   */
  private async handleGet(req: IncomingMessage, res: ServerResponse, sessionId?: string): Promise<void> {
    if (!sessionId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing session ID' }));
      return;
    }
    if (!this.sessions.has(sessionId)) {
      res.writeHead(410);
      res.end(JSON.stringify({
        error: 'Session expired. Next request will auto-reconnect.',
        code: 'SESSION_EXPIRED'
      }));
      return;
    }

    const session = this.sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  }

  /**
   * Handle DELETE requests
   */
  private handleDelete(res: ServerResponse, sessionId?: string): void {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.transport.close();
        this.sessions.delete(sessionId);
      }
    }
    res.writeHead(204);
    res.end();
  }

  /**
   * Read request body
   */
  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    for (const [id, session] of this.sessions) {
      session.transport.close();
      this.sessions.delete(id);
    }

    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close(err => err ? reject(err) : resolve());
      });
      this.httpServer = null;
    }
  }
}

/**
 * Create and start CharGen MCP server
 */
export async function createCharGenMCPServer(
  manager: ObjectManager,
  config?: CharGenMCPServerConfig
): Promise<CharGenMCPServer> {
  const server = new CharGenMCPServer(manager, config);
  await server.start();
  return server;
}
