import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseTransport } from './src/index.js';

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  const connection = mongoose.createConnection(mongoServer.getUri());
  await new Promise((resolve) => connection.once('open', resolve));

  console.log('Testing with expires: 300');
  
  const transport = new MongooseTransport({
    connection,
    collection: 'ttl_test',
    expires: 300
  });

  // Mongoose creates indexes asynchronously
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const indexes = await connection.db.collection('ttl_test').indexes();
  console.log('Indexes:', JSON.stringify(indexes, null, 2));

  const ttlIndex = indexes.find(idx => idx.key.timestamp !== undefined);
  
  if (ttlIndex && ttlIndex.expireAfterSeconds === 300) {
    console.log('SUCCESS: TTL index created correctly with expireAfterSeconds: 300');
  } else if (ttlIndex) {
    console.log('FAILURE: Index found but expireAfterSeconds is:', ttlIndex.expireAfterSeconds);
  } else {
    console.log('FAILURE: No index found on timestamp');
  }

  await connection.close();
  await mongoServer.stop();
}

run().catch(console.error);
