/**
 * Enhanced Virtual File System Test
 * Test the new categorization logic
 */

import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';
import { VirtualFileSystem } from '../src/lsp/virtual-fs.js';

async function testCategorization() {
  console.log('🧪 Testing enhanced virtual file system...');

  // Connect to database
  const db = new ObjectDatabase(
    process.env.MONGO_URI || 'mongodb://localhost:27017',
    'malice',
  );
  await db.connect();

  const manager = new ObjectManager(db);
  const vfs = new VirtualFileSystem(manager);

  // Test method categorization
  console.log('\n📁 Testing categorization...');

  const testMethods = [
    'connect',
    'disconnect',
    'onCreate',
    'onDestroy', // Lifecycle
    'onPlayerEnter',
    'handleMessage',
    'triggerEvent', // Events
    'look',
    'examine',
    'describe',
    'getLocation', // Public API
    'attack',
    'defend',
    'damage',
    'heal', // Combat
    'say',
    'tell',
    'whisper',
    'shout', // Communication
    'move',
    'go',
    'walk',
    'teleport', // Movement
    'take',
    'drop',
    'equip',
    'unequip', // Inventory
    '_validateInput',
    '_checkPermission',
    'debugInfo', // Internal
  ];

  for (const method of testMethods) {
    const category = (vfs as any).categorizeMethod?.(
      method,
      `// Example ${method} code`,
    );
    console.log(`${method.padEnd(20)} -> ${category || 'unknown'}`);
  }

  await db.disconnect();
  console.log('\n✅ Test complete!');
}

testCategorization().catch(console.error);
