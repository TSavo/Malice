import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

async function dropDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // List all databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();

    // Drop all test databases
    for (const db of dbs.databases) {
      if (db.name.startsWith('malice_test_')) {
        await client.db(db.name).dropDatabase();
        console.log(`✅ Dropped database: ${db.name}`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

dropDatabase();
