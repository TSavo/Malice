/**
 * LSP Server Launcher
 * Entry point for starting the Malice LSP server from VS Code extension
 */

import { ObjectDatabase } from '../database/object-db.js';
import { ObjectManager } from '../database/object-manager.js';
import { MaliceLSPServer } from './server.js';

/**
 * Start the LSP server
 */
async function main() {
  // Get MongoDB URL from environment or use default
  const mongoUrl = process.env.MALICE_MONGO_URL || 'mongodb://localhost:27017';
  const dbName = process.env.MALICE_DB_NAME || 'malice';

  console.error(`Connecting to MongoDB: ${mongoUrl}/${dbName}`);

  // Connect to database
  const db = new ObjectDatabase(mongoUrl, dbName);
  await db.connect();

  console.error('Connected to MongoDB');

  // Create object manager
  const manager = new ObjectManager(db);

  console.error('Starting Malice LSP Server...');

  // Create and start LSP server
  const server = new MaliceLSPServer(manager);
  server.start();

  // Handle shutdown
  process.on('SIGTERM', async () => {
    console.error('Shutting down LSP server...');
    await db.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.error('Shutting down LSP server...');
    await db.disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start LSP server:', err);
  process.exit(1);
});
