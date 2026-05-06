import mongoose from 'mongoose';
import winston from 'winston';
import { MongooseTransport } from '../src/index.js';

// 1. Setup Mongoose connection
await mongoose.connect('mongodb://localhost:27017/multi_collection_example');

/**
 * Custom format to filter for a specific level.
 * Winston's native `level` option on transports captures everything
 * at that priority and *higher*. To log *only* a specific level
 * to a collection, we use a filter.
 */
const levelFilter = (level: string) => winston.format((info) => {
  return info.level === level ? info : false;
})();

// 2. Create transports for different levels
const errorTransport = new MongooseTransport({
  connection: mongoose.connection,
  collection: 'errors',
  modelName: 'ErrorLog',
  expires: '60d',
  format: winston.format.combine(
    levelFilter('error'), // Capture only errors
    winston.format.timestamp(),
    winston.format.json()
  )
});

const infoTransport = new MongooseTransport({
  connection: mongoose.connection,
  collection: 'info',
  modelName: 'InfoLog',
  expires: '7d', // Info logs live for a shorter time
  format: winston.format.combine(
    levelFilter('info'), // Capture only info
    winston.format.timestamp(),
    winston.format.json()
  )
});

// 3. Configure Winston
const logger = winston.createLogger({
  transports: [
    errorTransport,
    infoTransport,
    new winston.transports.Console()
  ],
});

// 4. Log away!
logger.error('This will go to the ERRORS collection');
logger.info('This will go to the INFO collection');
logger.warn('This will only go to CONSOLE (unhandled level)');

console.log('Logs sent. Check your MongoDB collections "errors" and "info".');

// Graceful shutdown
process.on('SIGINT', async () => {
  await errorTransport.close();
  await infoTransport.close();
  await mongoose.disconnect();
  process.exit(0);
});
