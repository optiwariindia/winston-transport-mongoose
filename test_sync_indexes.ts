import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const connection = mongoose.createConnection(mongoServer.getUri());
  await new Promise((resolve) => connection.once('open', resolve));

  const collectionName = 'sync_index_test';
  
  // 1. Pre-create standard index
  await connection.db.collection(collectionName).createIndex({ timestamp: 1 });
  
  // 2. Define schema with TTL
  const schema = new mongoose.Schema({
    timestamp: { type: Date, index: { expireAfterSeconds: 300 } }
  });
  const Model = connection.model('Test', schema, collectionName);

  console.log('Syncing indexes...');
  await Model.syncIndexes();

  const indexes = await connection.db.collection(collectionName).indexes();
  console.log('Final Indexes:', JSON.stringify(indexes, null, 2));

  await connection.close();
  await mongoServer.stop();
}

run().catch(console.error);
