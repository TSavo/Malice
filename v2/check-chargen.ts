#!/usr/bin/env tsx
/**
 * Check CharGen object methods
 */

import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';

async function main() {
  const db = new ObjectDatabase('mongodb://localhost:27017', 'malice');
  const manager = new ObjectManager(db);
  await db.connect();

  const chargen = await manager.load(4);
  if (!chargen) {
    console.log('❌ CharGen not found');
    process.exit(1);
  }

  const methods = chargen.getOwnMethods();
  console.log('CharGen methods:');
  console.log(Object.keys(methods).join(', '));

  console.log('\nonNewUser method preview:');
  console.log(methods.onNewUser?.substring(0, 200) + '...');

  await db.disconnect();
  process.exit(0);
}

main().catch(console.error);
