#!/usr/bin/env tsx
/**
 * Test the new property syntax sugar
 * Demonstrates: self.hp instead of self.get('hp')
 * And automatic persistence on property changes
 */

import { ObjectDatabase } from './src/database/object-db.js';
import { ObjectManager } from './src/database/object-manager.js';

async function main() {
  console.log('🧪 Testing property syntax sugar...\n');

  const db = new ObjectDatabase('mongodb://localhost:27017', 'malice');
  const manager = new ObjectManager(db);

  await db.connect();
  console.log('✅ Connected to MongoDB\n');

  // Create a test object with HP property
  const player = await manager.create({
    parent: 1,
    properties: {
      name: 'TestPlayer',
      hp: 100,
      maxHp: 100,
      level: 1,
    },
    methods: {
      // OLD SYNTAX (still works):
      takeDamageOld: `
        const damage = args[0];
        const currentHp = self.get('hp');
        const newHp = Math.max(0, currentHp - damage);
        self.set('hp', newHp);
        await self.save();
        return newHp;
      `,

      // NEW SYNTAX (much cleaner!):
      takeDamage: `
        const damage = args[0];
        self.hp = Math.max(0, self.hp - damage);
        return self.hp;
      `,

      heal: `
        const amount = args[0];
        self.hp = Math.min(self.maxHp, self.hp + amount);
        return self.hp;
      `,

      levelUp: `
        self.level++;
        self.maxHp += 10;
        self.hp = self.maxHp; // Full heal on level up
        return \`Level \${self.level}! Max HP: \${self.maxHp}\`;
      `,
    },
  });

  console.log(`Created player #${player.id}`);
  console.log(`  Name: ${player.get('name')}`);
  console.log(`  HP: ${player.get('hp')}/${player.get('maxHp')}`);
  console.log(`  Level: ${player.get('level')}\n`);

  // Test old syntax
  console.log('📍 Testing OLD syntax (takeDamageOld):');
  const hpAfterOld = await player.call('takeDamageOld', 25);
  console.log(`  After 25 damage: ${hpAfterOld} HP\n`);

  // Reload to verify save
  await player.refresh();
  console.log(`  Reloaded HP: ${player.get('hp')}\n`);

  // Test new syntax
  console.log('✨ Testing NEW syntax (takeDamage):');
  const hpAfterNew = await player.call('takeDamage', 30);
  console.log(`  After 30 damage: ${hpAfterNew} HP`);

  // Wait a moment for auto-save
  await new Promise(resolve => setTimeout(resolve, 100));

  // Reload to verify auto-save
  await player.refresh();
  console.log(`  Reloaded HP: ${player.get('hp')}\n`);

  // Test heal
  console.log('💚 Testing heal:');
  const hpAfterHeal = await player.call('heal', 50);
  console.log(`  After healing 50: ${hpAfterHeal} HP`);

  await new Promise(resolve => setTimeout(resolve, 100));
  await player.refresh();
  console.log(`  Reloaded HP: ${player.get('hp')}\n`);

  // Test level up
  console.log('⭐ Testing levelUp:');
  const levelUpMsg = await player.call('levelUp');
  console.log(`  ${levelUpMsg}`);

  await new Promise(resolve => setTimeout(resolve, 100));
  await player.refresh();
  console.log(`  Reloaded - Level: ${player.get('level')}, HP: ${player.get('hp')}/${player.get('maxHp')}\n`);

  await db.disconnect();
  console.log('✅ All tests passed!');
  console.log('\n📝 Summary:');
  console.log('  - Property access: self.hp instead of self.get("hp")');
  console.log('  - Property setting: self.hp = 50 instead of self.set("hp", 50)');
  console.log('  - Auto-save: Changes persist automatically (no await self.save())');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
