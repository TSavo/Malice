import { ObjectManager } from '../database/object-manager.js';
import { ObjectDatabase } from '../database/object-db.js';
import { AliasLoader } from '../database/bootstrap/alias-loader.js';
import { hash } from 'bcrypt';

async function createAdmin() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'malice';

  const db = new ObjectDatabase(mongoUri, dbName);
  await db.connect();

  const manager = new ObjectManager(db);
  await manager.loadAll();

  // Load aliases
  const aliasLoader = new AliasLoader(manager);
  await aliasLoader.loadAliases();

  // Get required objects - types are accessed via getTypeSync()
  const adminProto = manager.getTypeSync('admin');

  if (!adminProto) {
    console.error('Admin type not found');
    await db.disconnect();
    process.exit(1);
  }

  // Get password from environment variable or command-line argument
  const password = process.env.ADMIN_PASSWORD || process.argv[2];
  if (!password) {
    console.error('Error: Password required. Set ADMIN_PASSWORD env var or pass as argument.');
    await db.disconnect();
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Error: Password must be at least 12 characters.');
    await db.disconnect();
    process.exit(1);
  }

  // Hash password
  const passwordHash = await hash(password, 10);

  // Create admin player directly using manager.create()
  const admin = await manager.create({
    parent: adminProto,
    properties: {
      name: 'Admin',
      playername: 'admin',
      emailVerified: true,
      passwordHash: passwordHash,
      isAdmin: true,
    },
  });

  console.log('✅ Created admin user:');
  console.log('   ID:', admin.id);
  console.log('   Username: admin');
  console.log('   isAdmin:', admin.get('isAdmin'));

  // Flush writes
  await new Promise(resolve => setTimeout(resolve, 1000));

  await db.disconnect();
}

createAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
