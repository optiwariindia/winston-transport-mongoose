import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseTransport } from '../src/index.js';

describe('MongooseTransport TTL Sync', () => {
  let mongoServer: MongoMemoryServer;
  let connection: mongoose.Connection;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    connection = mongoose.createConnection(mongoServer.getUri());
    await new Promise((resolve) => connection.once('open', resolve));
  });

  afterAll(async () => {
    await connection.close();
    await mongoServer.stop();
  });

  it('should update TTL index if it already exists with different options', async () => {
    const collectionName = 'ttl_update_test';
    const modelName = 'LogTTLUpdate';

    // 1. Create a non-TTL index first
    await connection.db.collection(collectionName).createIndex({ timestamp: 1 });
    
    let indexes = await connection.db.collection(collectionName).indexes();
    let timestampIndex = indexes.find(idx => idx.key.timestamp !== undefined);
    expect(timestampIndex?.expireAfterSeconds).toBeUndefined();

    // 2. Initialize transport with TTL
    new MongooseTransport({
      connection,
      collection: collectionName,
      modelName,
      expires: 300
    });

    // 3. Wait for syncIndexes to finish
    // We wait slightly longer as syncIndexes is async
    await new Promise((resolve) => setTimeout(resolve, 2000));

    indexes = await connection.db.collection(collectionName).indexes();
    timestampIndex = indexes.find(idx => idx.key.timestamp !== undefined);
    
    expect(timestampIndex?.expireAfterSeconds).toBe(300);
  });
});
