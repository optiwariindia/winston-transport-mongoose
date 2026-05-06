import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseTransport } from './src/index.js';

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const connection = mongoose.createConnection(mongoServer.getUri());
  await new Promise((resolve) => connection.once('open', resolve));

  const collectionName = 'ttl_sync_fix_test';
  
  // 1. Pre-create standard index
  await connection.db.collection(collectionName).createIndex({ timestamp: 1 });
  
  // 2. Transport with syncIndexes logic (simulated)
  const transport = new MongooseTransport({
    connection,
    collection: collectionName,
    expires: 300
  });

  // @ts-ignore - reaching into private to test syncIndexes
  console.log('Manually triggering syncIndexes...');
  await (transport as any).model.syncIndexes();

  const indexes = await connection.db.collection(collectionName).indexes();
  console.log('Final Indexes:', JSON.stringify(indexes, null, 2));

  const ttlIndex = indexes.find(idx => idx.key.timestamp !== undefined);
  if (ttlIndex && ttlIndex.expireAfterSeconds === 300) {
    console.log('SUCCESS: TTL index updated via syncIndexes');
  } else {
    console.log('FAILURE: TTL index NOT updated');
  }

  await connection.close();
  await mongoServer.stop();
}

run().catch(console.error);
