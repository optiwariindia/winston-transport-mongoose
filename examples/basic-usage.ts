import mongoose from 'mongoose';
import winston from 'winston';
import { MongooseTransport } from '../src/index.js';

// 1. Setup Mongoose connection
await mongoose.connect('mongodb://localhost:27017/logs_example');

// 2. Create the transport
const mongooseTransport = new MongooseTransport({
  connection: mongoose.connection,
  collection: 'app_logs',
  modelName: 'AppLog',
  expires: '30d', // Logs expire after 30 days
  batching: {
    batchSize: 50,
    flushInterval: 5000,
  },
  additionalSchemaFields: {
    service: String,
    environment: String,
  }
});

// 3. Configure Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    mongooseTransport
  ],
});

// 4. Log away!
logger.info('Hello from Mongoose transport!', { 
  service: 'user-service', 
  environment: 'production' 
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongooseTransport.close();
  await mongoose.disconnect();
  process.exit(0);
});
