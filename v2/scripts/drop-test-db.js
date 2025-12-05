import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

async function dropDatabase() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Drop the test database
    await client.db('malice_test_chargen_look').dropDatabase();
    console.log('✅ Dropped database: malice_test_chargen_look');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

dropDatabase();
