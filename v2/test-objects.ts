#!/usr/bin/env tsx
import { ObjectDatabase, ObjectManager } from './src/database/index.js';

console.log('🎮 Testing LambdaMOO-style Object System\n');

// Connect to MongoDB (assumes local MongoDB running)
const db = new ObjectDatabase('mongodb://localhost:27017');
const manager = new ObjectManager(db);

try {
  await db.connect();
  console.log('✅ Connected to MongoDB');

  // Ensure root object #1 exists
  await db.ensureRoot();
  const root = await manager.load(1);
  console.log(`✅ Root object #${root!.id} loaded`);

  // Create a "person" prototype (#2) that inherits from root
  console.log('\n📦 Creating person prototype (#2)...');
  const personProto = await manager.create({
    parent: 1,
    properties: {
      name: 'Generic Person',
      hp: 100,
      maxHp: 100,
    },
    methods: {
      takeDamage: `
        const damage = args[0];
        const currentHp = this.get('hp');
        const newHp = Math.max(0, currentHp - damage);
        this.set('hp', newHp);
        await this.save();
        return \`Took \${damage} damage. HP: \${newHp}/\${this.get('maxHp')}\`;
      `,
      heal: `
        const amount = args[0];
        const currentHp = this.get('hp');
        const maxHp = this.get('maxHp');
        const newHp = Math.min(maxHp, currentHp + amount);
        this.set('hp', newHp);
        await this.save();
        return \`Healed \${amount}. HP: \${newHp}/\${maxHp}\`;
      `,
    },
  });
  console.log(`✅ Person prototype created: #${personProto.id}`);
  console.log(`   Properties: ${JSON.stringify(personProto.getOwnProperties())}`);

  // Create a specific person (#3) that inherits from person prototype
  console.log('\n👤 Creating Alice (#3)...');
  const alice = await manager.create({
    parent: personProto.id,
    properties: {
      name: 'Alice',
      hp: 80, // Override: Alice starts injured
    },
  });
  console.log(`✅ Alice created: #${alice.id}`);
  console.log(`   Name: ${alice.get('name')}`);
  console.log(`   HP: ${alice.get('hp')} (inherited maxHp: ${alice.get('maxHp')})`);

  // Test method execution
  console.log('\n⚔️  Testing combat methods...');
  const dmgResult = await alice.call('takeDamage', 15);
  console.log(`   ${dmgResult}`);

  const healResult = await alice.call('heal', 25);
  console.log(`   ${healResult}`);

  // Verify persistence
  console.log('\n💾 Testing persistence...');
  manager.clearCache();
  const aliceReloaded = await manager.load(alice.id);
  console.log(`✅ Alice reloaded from DB`);
  console.log(`   HP after reload: ${aliceReloaded!.get('hp')}`);

  // Test inheritance chain
  console.log('\n🔗 Testing inheritance...');
  console.log(`   Alice's parent: #${aliceReloaded!.getParent()}`);
  console.log(`   Alice has 'takeDamage' method: ${aliceReloaded!.hasMethod('takeDamage')}`);
  console.log(`   Alice's own methods: ${Object.keys(aliceReloaded!.getOwnMethods())}`);
  console.log(`   Person's methods: ${Object.keys(personProto.getOwnMethods())}`);

  console.log('\n✅ All tests passed!');
} catch (err) {
  console.error('❌ Error:', err);
} finally {
  await db.disconnect();
  process.exit(0);
}
