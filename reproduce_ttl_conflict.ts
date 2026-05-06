import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseTransport } from './src/index.js';

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const connection = mongoose.createConnection(mongoServer.getUri());
  await new Promise((resolve) => connection.once('open', resolve));

  const collectionName = 'ttl_conflict_test';
  
  // 1. Pre-create a standard index (NO TTL)
  console.log('Pre-creating standard index...');
  await connection.db.collection(collectionName).createIndex({ timestamp: 1 });
  
  let indexes = await connection.db.collection(collectionName).indexes();
  console.log('Initial Indexes:', JSON.stringify(indexes, null, 2));

  // 2. Try to use the transport with TTL
  console.log('Initializing transport with expires: 300...');
  const transport = new MongooseTransport({
    connection,
    collection: collectionName,
    expires: 300
  });

  // Wait for Mongoose to try and create indexes
  await new Promise((resolve) => setTimeout(resolve, 2000));

  indexes = await connection.db.collection(collectionName).indexes();
  console.log('Final Indexes:', JSON.stringify(indexes, null, 2));

  const ttlIndex = indexes.find(idx => idx.key.timestamp !== undefined);
  
  if (ttlIndex && ttlIndex.expireAfterSeconds === 300) {
    console.log('SUCCESS: TTL index updated correctly');
  } else {
    console.log('FAILURE: TTL index NOT updated. expireAfterSeconds is:', ttlIndex?.expireAfterSeconds ?? 'MISSING');
  }

  await connection.close();
  await mongoServer.stop();
}

run().catch(console.error);
