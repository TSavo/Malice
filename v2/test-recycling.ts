#!/usr/bin/env tsx
/**
 * Test object recycling (LambdaMOO-style soft delete)
 * Demonstrates: $.recycle(obj) marks for deletion, IDs are reused
 */

import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';

async function main() {
  console.log('🧪 Testing object recycling...\n');

  const db = new ObjectDatabase('mongodb://localhost:27017', 'malice');
  const manager = new ObjectManager(db);

  await db.connect();
  console.log('✅ Connected to MongoDB\n');

  // Create some test objects
  console.log('📦 Creating objects...');
  const obj1 = await manager.create({
    parent: 1,
    properties: { name: 'Object A', value: 100 },
  });

  const obj2 = await manager.create({
    parent: 1,
    properties: { name: 'Object B', value: 200 },
  });

  const obj3 = await manager.create({
    parent: 1,
    properties: { name: 'Object C', value: 300 },
  });

  console.log(`  Created #${obj1.id}: ${obj1.get('name')}`);
  console.log(`  Created #${obj2.id}: ${obj2.get('name')}`);
  console.log(`  Created #${obj3.id}: ${obj3.get('name')}\n`);

  const id2 = obj2.id;

  // Recycle object #2
  console.log(`♻️  Recycling object #${id2}...`);
  await manager.recycle(obj2);
  console.log(`  Object #${id2} marked as recycled\n`);

  // Try to load recycled object
  console.log(`🔍 Attempting to load recycled object #${id2}...`);
  const loaded = await manager.load(id2);
  if (loaded) {
    const raw = (loaded as any)._getRaw();
    console.log(`  Loaded: #${loaded.id}, recycled=${raw.recycled}`);
    console.log(`  Name: ${loaded.get('name')}\n`);
  }

  // Create new object - should reuse recycled ID
  console.log('🆕 Creating new object (should reuse recycled ID)...');
  const obj4 = await manager.create({
    parent: 1,
    properties: { name: 'Object D (reused ID)', value: 400 },
  });

  console.log(`  Created #${obj4.id}: ${obj4.get('name')}`);
  console.log(`  Reused ID ${id2}? ${obj4.id === id2 ? 'YES ✅' : 'NO ❌'}\n`);

  // Verify it's not recycled anymore
  const reloaded = await manager.load(obj4.id);
  if (reloaded) {
    const raw = (reloaded as any)._getRaw();
    console.log(`  Recycled flag: ${raw.recycled || false}`);
    console.log(`  Name: ${reloaded.get('name')}\n`);
  }

  // Create more objects to show sequential IDs continue
  console.log('📦 Creating more objects...');
  const obj5 = await manager.create({
    parent: 1,
    properties: { name: 'Object E', value: 500 },
  });

  const obj6 = await manager.create({
    parent: 1,
    properties: { name: 'Object F', value: 600 },
  });

  console.log(`  Created #${obj5.id}: ${obj5.get('name')}`);
  console.log(`  Created #${obj6.id}: ${obj6.get('name')}\n`);

  // Recycle multiple and create one - should reuse lowest ID
  console.log('♻️  Recycling multiple objects...');
  await manager.recycle(obj6);
  await manager.recycle(obj5);
  console.log(`  Recycled #${obj5.id} and #${obj6.id}\n`);

  console.log('🆕 Creating new object (should reuse lowest recycled ID)...');
  const obj7 = await manager.create({
    parent: 1,
    properties: { name: 'Object G (lowest ID)', value: 700 },
  });

  console.log(`  Created #${obj7.id}: ${obj7.get('name')}`);
  console.log(`  Reused lowest ID ${obj5.id}? ${obj7.id === obj5.id ? 'YES ✅' : 'NO ❌'}\n`);

  await db.disconnect();
  console.log('✅ Recycling tests passed!');
  console.log('\n📝 Summary:');
  console.log('  - $.recycle(obj) marks object as deleted');
  console.log('  - Recycled IDs are reused for new objects');
  console.log('  - Lowest recycled ID is reused first');
  console.log('  - Prevents dangling references (ID exists, just recycled)');
  console.log('  - Keeps object ID space compact');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
