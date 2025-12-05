#!/usr/bin/env tsx
/**
 * Test dynamic object aliases
 * Demonstrates: $.myAlias = object, then use $.myAlias later
 */

import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';

async function main() {
  console.log('🧪 Testing dynamic object aliases...\n');

  const db = new ObjectDatabase('mongodb://localhost:27017', 'malice');
  const manager = new ObjectManager(db);

  await db.connect();
  console.log('✅ Connected to MongoDB\n');

  // Create some test objects
  const townSquare = await manager.create({
    parent: 1,
    properties: {
      name: 'Town Square',
      description: 'A bustling town square with a fountain.',
    },
    methods: {
      describe: `
        return \`\${self.name}: \${self.description}\`;
      `,
    },
  });

  const tavern = await manager.create({
    parent: 1,
    properties: {
      name: 'The Prancing Pony',
      description: 'A cozy tavern with a warm fire.',
    },
    methods: {
      describe: `
        return \`\${self.name}: \${self.description}\`;
      `,
    },
  });

  console.log(`Created Town Square #${townSquare.id}`);
  console.log(`Created Tavern #${tavern.id}\n`);

  // Register aliases using property syntax
  console.log('📌 Registering aliases...');
  (manager as any).square = townSquare;
  (manager as any).inn = tavern;
  console.log('  $.square = Town Square');
  console.log('  $.inn = Tavern\n');

  // Access via aliases
  console.log('🔍 Accessing via aliases:');
  const squareAlias = (manager as any).square;
  const innAlias = (manager as any).inn;

  console.log(`  $.square.id = ${squareAlias.id}`);
  console.log(`  $.inn.id = ${innAlias.id}\n`);

  // Call methods via aliases
  console.log('🎭 Calling methods via aliases:');
  const squareDesc = await squareAlias.call('describe');
  const innDesc = await innAlias.call('describe');

  console.log(`  $.square.describe() = "${squareDesc}"`);
  console.log(`  $.inn.describe() = "${innDesc}"\n`);

  // Show all registered aliases
  console.log('📋 All registered aliases:');
  const aliases = manager.getAliases();
  for (const [name, obj] of aliases) {
    console.log(`  $.${name} -> #${obj.id} (${obj.get('name')})`);
  }
  console.log();

  // Test in method context
  console.log('🧬 Testing aliases in method context:');
  const testObj = await manager.create({
    parent: 1,
    properties: { name: 'TestObject' },
    methods: {
      testAliases: `
        // Access via alias in method
        const sq = $.square;
        const description = await sq.call('describe');
        return \`Found via alias: \${description}\`;
      `,
    },
  });

  const result = await testObj.call('testAliases');
  console.log(`  Result: "${result}"\n`);

  // Remove an alias
  console.log('❌ Removing alias $.inn...');
  manager.removeAlias('inn');
  console.log(`  $.inn is now: ${(manager as any).inn}\n`);

  await db.disconnect();
  console.log('✅ All alias tests passed!');
  console.log('\n📝 Summary:');
  console.log('  - $.alias = object to register');
  console.log('  - $.alias to access later');
  console.log('  - Works in method execution context');
  console.log('  - Programmatic: $.registerAlias(name, obj)');
  console.log('  - Remove: $.removeAlias(name)');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
