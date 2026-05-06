import mongoose from 'mongoose';
import winston from 'winston';
import { MongooseTransport } from '../src/index.js';

/**
 * In Next.js, you should maintain a singleton logger to avoid
 * creating multiple Mongoose connections/transports during HMR.
 */

let logger: winston.Logger;

async function getLogger() {
  if (logger) return logger;

  // Ensure Mongoose is connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nextjs_logs');
  }

  logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new MongooseTransport({
        connection: mongoose.connection,
        collection: 'next_logs',
        expires: '14d',
        batching: { batchSize: 50, flushInterval: 3000 }
      })
    ],
  });

  return logger;
}

// Example usage in an API Route (App Router)
export async function GET() {
  const log = await getLogger();
  log.info('API route accessed', { service: 'next-api' });
  
  return Response.json({ message: 'Log sent' });
}

// Example usage in Server Action or getServerSideProps
export async function someServerAction(data: any) {
  const log = await getLogger();
  log.info('Server action performed', { data });
  // ... business logic
}
