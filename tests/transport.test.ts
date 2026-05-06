import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import winston from 'winston';
import { MongooseTransport } from '../src/index.js';

describe('MongooseTransport', () => {
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

  beforeEach(async () => {
    // Clear collections between tests
    const collections = connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  it('should log a message to MongoDB', async () => {
    const modelName = 'LogSimple';
    const transport = new MongooseTransport({ connection, collection: 'test_logs', modelName });
    transport.on('error', (err) => console.error('Transport Error:', err));
    
    const logger = winston.createLogger({
      transports: [transport],
    });

    logger.info('test message', { foo: 'bar' });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const Log = connection.model(modelName);
    const logs = await Log.find({});
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('test message');
    expect(logs[0].level).toBe('info');
    expect(logs[0].meta.foo).toBe('bar');
  });

  it('should respect batching options', async () => {
    const modelName = 'LogBatch';
    const transport = new MongooseTransport({
      connection,
      collection: 'batched_logs',
      modelName,
      batching: { batchSize: 3, flushInterval: 1000 },
    });
    transport.on('error', (err) => console.error('Transport Error:', err));

    const logger = winston.createLogger({
      transports: [transport],
    });

    logger.info('msg 1');
    logger.info('msg 2');

    const Log = connection.model(modelName);
    let logs = await Log.find({});
    expect(logs).toHaveLength(0);

    logger.info('msg 3');

    await new Promise((resolve) => setTimeout(resolve, 600));
    logs = await Log.find({});
    expect(logs).toHaveLength(3);
  });

  it('should create TTL index when expires is provided', async () => {
    const collectionName = 'ttl_logs';
    const modelName = 'LogTTL';
    new MongooseTransport({
      connection,
      collection: collectionName,
      modelName,
      expires: '1h',
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const indexes = await connection.db!.collection(collectionName).indexes();
    const ttlIndex = indexes.find((idx) => idx.key.timestamp !== undefined && idx.expireAfterSeconds !== undefined);
    
    expect(ttlIndex).toBeDefined();
    expect(ttlIndex?.expireAfterSeconds).toBeDefined();
  });

  it('should support additional schema fields', async () => {
    const modelName = 'LogCustom';
    const transport = new MongooseTransport({
      connection,
      collection: 'custom_logs',
      modelName,
      additionalSchemaFields: {
        requestId: { type: String, required: true },
      },
    });
    transport.on('error', (err) => console.error('Transport Error:', err));

    const logger = winston.createLogger({
      transports: [transport],
    });

    logger.info('custom field test', { requestId: '12345' });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const Log = connection.model(modelName);
    const logs = await Log.find({});
    expect(logs).toHaveLength(1);
    expect(logs[0].requestId).toBe('12345');
  });
});
