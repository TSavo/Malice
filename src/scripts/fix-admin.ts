import { ObjectManager } from '../database/object-manager.js';
import { ObjectDatabase } from '../database/object-db.js';
import { AliasLoader } from '../database/bootstrap/alias-loader.js';

async function fixAdmin() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'malice';

  const db = new ObjectDatabase(mongoUri, dbName);
  await db.connect();

  const manager = new ObjectManager(db);
  await manager.loadAll();

  // Load aliases
  const aliasLoader = new AliasLoader(manager);
  await aliasLoader.loadAliases();

  // Find admin user by playername
  const admin = await manager.load(11954);

  if (!admin) {
    console.error('Admin user #11954 not found');
    await db.disconnect();
    process.exit(1);
  }

  console.log('Found admin user:', admin.get('playername'));

  // Set chargenComplete to true
  admin.set('chargenComplete', true);
  console.log('  Set chargenComplete: true');

  // Get a start room (The Core is #6425)
  const startRoom = manager.getAliases().get('startRoom') || await manager.load(6425);
  if (startRoom) {
    admin.set('location', { type: 'objref', value: startRoom.id });
    console.log('  Set location:', startRoom.get('name'), '#' + startRoom.id);
  }

  console.log('✅ Admin user fixed!');

  // Flush writes
  await new Promise(resolve => setTimeout(resolve, 1000));

  await db.disconnect();
}

fixAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
